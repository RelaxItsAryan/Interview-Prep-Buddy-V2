import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { islGestureEngine, type ISLGestureResult } from '@/lib/islGestureEngine';
import { Button } from '@/components/ui/button';
import {
  Hand,
  RotateCcw,
  CheckCheck,
  Delete,
  Space,
  Pause,
  Play,
  Zap,
} from 'lucide-react';

// ── Interview-focused word bank for ISL autocomplete ────────────────────────
const WORD_BANK = [
  // Tech / role keywords
  'React','JavaScript','TypeScript','Python','Node','Express','MongoDB','SQL',
  'API','REST','GraphQL','Docker','Kubernetes','AWS','Git','GitHub','CSS','HTML',
  'Redux','NextJS','VueJS','Angular','Flutter','Swift','Kotlin','Java','Spring',
  'machine','learning','neural','network','algorithm','database','backend','frontend',
  'fullstack','testing','debugging','deployment','CI','CD','agile','scrum','sprint',
  'microservices','serverless','cloud','devops','Linux','terminal',
  // Interview common words
  'I','my','we','our','team','project','worked','built','developed','designed',
  'implemented','solved','improved','reduced','increased','managed','led','created',
  'experience','years','months','role','position','company','startup','product',
  'problem','solution','challenge','result','impact','success','failure','learned',
  'skill','technical','communication','leadership','collaboration','responsibility',
  'deadline','stakeholder','client','user','feedback','review','iteration',
  'architecture','scalable','performance','security','optimization','refactoring',
  'testing','unit','integration','end','to','end','deployment','production',
  // Common connectors
  'the','and','but','for','with','from','that','this','have','been','when',
  'about','also','into','over','under','after','before','during','through',
].map(w => w.toLowerCase());
// Deduplicate
const UNIQUE_WORD_BANK = [...new Set(WORD_BANK)];

interface ISLSignLanguagePanelProps {
  onTextUpdate?: (text: string) => void;
  disabled?: boolean;
}

// ISL reference guide images (visual alphabet hints)
const ISL_HINTS: Record<string, string> = {
  A: 'Fist, thumb beside',
  B: 'All 4 fingers up, thumb in',
  C: 'Curved C-shape',
  D: 'Index up, others curled',
  E: 'All curled inward',
  F: 'Index+thumb touch, others up',
  G: 'Index pointing sideways',
  H: 'Index+middle horizontal',
  I: 'Pinky only up',
  J: 'Pinky curved outward',
  K: 'Index+middle+thumb up',
  L: 'L-shape: index+thumb',
  M: '3 fingers over thumb',
  N: '2 fingers over thumb',
  O: 'O-shape with fingers',
  P: 'Index pointing down',
  Q: 'Index down, thumb out',
  R: 'Index+middle crossed',
  S: 'Fist, thumb over fingers',
  T: 'Thumb between fingers',
  U: 'Index+middle up, close',
  V: 'V-shape peace sign',
  W: 'Index+middle+ring up',
  X: 'Index finger hooked',
  Y: 'Thumb+pinky out (Shaka)',
  Z: 'Index pointing forward',
};

const ISLSignLanguagePanel: React.FC<ISLSignLanguagePanelProps> = ({
  onTextUpdate,
  disabled = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastConfirmedRef = useRef<string | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdProgressRef = useRef<number>(0);

  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [gestureResult, setGestureResult] = useState<ISLGestureResult | null>(null);
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);
  const [sentence, setSentence] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedFlash, setConfirmedFlash] = useState(false);
  const [mounted, setMounted] = useState(true);

  // Word suggestions derived from currentWord
  const suggestions = useMemo(() => {
    const q = currentWord.toLowerCase();
    if (q.length < 1) return [];
    return UNIQUE_WORD_BANK
      .filter(w => w.startsWith(q) && w !== q)
      .sort((a, b) => a.length - b.length)
      .slice(0, 6);
  }, [currentWord]);

  // Hold-to-confirm: 1.5 seconds of stable gesture
  const HOLD_DURATION_MS = 1500;
  const HOLD_STEPS = 30; // frames

  const addLetter = useCallback((letter: string) => {
    if (letter === ' ') {
      setSentence(prev => {
        const newSentence = prev + currentWord + ' ';
        onTextUpdate?.(newSentence);
        return newSentence;
      });
      setCurrentWord('');
    } else if (letter === 'DEL') {
      setCurrentWord(prev => prev.slice(0, -1));
    } else {
      setCurrentWord(prev => prev + letter);
    }

    // Flash confirm animation
    setConfirmedFlash(true);
    setTimeout(() => setConfirmedFlash(false), 300);
  }, [currentWord, onTextUpdate]);

  // Draw hand skeleton on canvas overlay
  const drawLandmarks = useCallback(
    (landmarks: number[][] | undefined) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!landmarks || landmarks.length === 0) return;

      const W = canvas.width;
      const H = canvas.height;

      // Connection pairs for hand skeleton
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],         // Index
        [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17],              // Palm
      ];

      // Mirror: since video is mirrored, landmarks need to be flipped
      const pts = landmarks.map(([x, y]) => [(1 - x) * W, y * H]);

      // Draw connections
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
      ctx.lineWidth = 2;
      for (const [a, b] of connections) {
        ctx.beginPath();
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
        ctx.stroke();
      }

      // Draw joint dots
      const fingerColors = [
        '#f43f5e', // Thumb - rose
        '#8b5cf6', // Index - violet
        '#06b6d4', // Middle - cyan
        '#10b981', // Ring - emerald
        '#f59e0b', // Pinky - amber
      ];

      for (let i = 0; i < pts.length; i++) {
        const fingerGroup = i === 0 ? 0 : Math.ceil(i / 4);
        const color = fingerColors[Math.min(fingerGroup, 4)];
        ctx.beginPath();
        ctx.arc(pts[i][0], pts[i][1], i % 4 === 0 ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Wrist dot
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,92,246,0.9)';
      ctx.fill();
    },
    []
  );

  useEffect(() => {
    setMounted(true);
    let active = true;

    const init = async () => {
      try {
        await islGestureEngine.initialize();
        if (!active) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        });

        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if (active) setIsInitializing(false);

        let holdCount = 0;
        let holdLetter: string | null = null;

        const processFrame = async () => {
          if (!active || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(processFrame);
            return;
          }

          if (isPaused) {
            rafRef.current = requestAnimationFrame(processFrame);
            return;
          }

          try {
            const result = await islGestureEngine.processFrame(
              videoRef.current,
              performance.now()
            );

            if (active) {
              setGestureResult(result);
              setDetectedLetter(result.letter);
              drawLandmarks(result.landmarks);

              // Hold-to-confirm logic
              if (result.letter && result.letter !== '?' && result.letter !== holdLetter) {
                holdLetter = result.letter;
                holdCount = 0;
                setHoldProgress(0);
                setIsConfirming(false);
              } else if (result.letter && result.letter === holdLetter) {
                holdCount++;
                const progress = Math.min((holdCount / HOLD_STEPS) * 100, 100);
                setHoldProgress(progress);
                setIsConfirming(holdCount > 0 && holdCount < HOLD_STEPS);

                if (holdCount >= HOLD_STEPS && holdLetter !== lastConfirmedRef.current) {
                  lastConfirmedRef.current = holdLetter;
                  addLetter(holdLetter!);
                  holdCount = 0;
                  holdLetter = null;
                  setHoldProgress(0);
                  setIsConfirming(false);
                  // Reset after confirm to avoid repeats
                  setTimeout(() => {
                    lastConfirmedRef.current = null;
                  }, 1000);
                }
              } else if (!result.letter) {
                holdCount = 0;
                holdLetter = null;
                setHoldProgress(0);
                setIsConfirming(false);
              }
            }
          } catch (err) {
            console.error('ISL frame processing error:', err);
          }

          rafRef.current = requestAnimationFrame(processFrame);
        };

        rafRef.current = requestAnimationFrame(processFrame);
      } catch (err: unknown) {
        console.error('ISL init error:', err);
        if (active) {
          setError(
            err instanceof Error && err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access.'
              : 'Failed to initialize sign language recognition.'
          );
          setIsInitializing(false);
        }
      }
    };

    init();

    return () => {
      active = false;
      setMounted(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearSentence = () => {
    setSentence('');
    setCurrentWord('');
    onTextUpdate?.('');
  };

  const handleAddSpace = () => {
    if (currentWord) {
      setSentence(prev => {
        const newText = prev + currentWord + ' ';
        onTextUpdate?.(newText);
        return newText;
      });
      setCurrentWord('');
    }
  };

  const handleDeleteLetter = () => {
    if (currentWord.length > 0) {
      setCurrentWord(prev => prev.slice(0, -1));
    } else if (sentence.length > 0) {
      setSentence(prev => {
        const updated = prev.trimEnd();
        const newSent = updated.slice(0, -1);
        onTextUpdate?.(newSent);
        return newSent;
      });
    }
  };

  const handleUseText = () => {
    const full = (sentence + currentWord).trim();
    onTextUpdate?.(full);
  };

  // Tap a suggestion → commit the full word immediately
  const handleSuggestionTap = useCallback((word: string) => {
    setSentence(prev => {
      const newText = prev + word + ' ';
      onTextUpdate?.(newText);
      return newText;
    });
    setCurrentWord('');
    setConfirmedFlash(true);
    setTimeout(() => setConfirmedFlash(false), 400);
  }, [onTextUpdate]);

  const displayText = sentence + currentWord;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/20">
            <Hand className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">
              ISL Sign Language
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Indian Sign Language · A–Z Recognition
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsPaused(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/70 hover:text-white"
        >
          {isPaused ? (
            <><Play className="w-3 h-3" /> Resume</>
          ) : (
            <><Pause className="w-3 h-3" /> Pause</>
          )}
        </button>
      </div>

      {/* Camera + Overlay */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-white/5 shadow-2xl"
           style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Initializing overlay */}
        {isInitializing && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              <Hand className="absolute inset-0 m-auto w-6 h-6 text-violet-400" />
            </div>
            <p className="text-sm font-bold text-white mb-1">Loading ISL Engine</p>
            <p className="text-[11px] text-zinc-400">MediaPipe Hands + ISL Classifier</p>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <span className="text-red-400 text-xl font-bold">!</span>
            </div>
            <p className="text-sm font-semibold text-white mb-1">Camera Error</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Paused overlay */}
        {isPaused && !isInitializing && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Pause className="w-10 h-10 text-white/60 mx-auto mb-2" />
              <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Paused</p>
            </div>
          </div>
        )}

        {/* Live indicator */}
        {!isInitializing && !error && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-violet-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {isPaused ? 'Paused' : 'ISL Live'}
            </span>
          </div>
        )}

        {/* Detected letter display */}
        {detectedLetter && !isPaused && gestureResult?.handDetected && (
          <div className={`absolute top-3 right-3 transition-all duration-200 ${confirmedFlash ? 'scale-125' : 'scale-100'}`}>
            <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-2xl transition-all duration-300 ${
              confirmedFlash
                ? 'bg-emerald-500/90 border-emerald-400 shadow-emerald-500/50'
                : isConfirming
                  ? 'bg-violet-500/80 border-violet-400 shadow-violet-500/30'
                  : 'bg-black/70 border-white/20'
            }`}>
              <span className="text-3xl font-black text-white leading-none">{detectedLetter}</span>
              <span className="text-[9px] uppercase tracking-widest text-white/60 font-bold mt-0.5">
                {confirmedFlash ? 'Added!' : `${Math.round(gestureResult.confidence * 100)}%`}
              </span>
            </div>
          </div>
        )}

        {/* No hand detected hint */}
        {!gestureResult?.handDetected && !isInitializing && !error && !isPaused && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center">
            <div className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <Hand className="w-4 h-4 text-violet-400 animate-pulse" />
              <span className="text-xs text-white/70 font-medium">Show your hand to the camera</span>
            </div>
          </div>
        )}

        {/* Hold progress bar */}
        {isConfirming && detectedLetter && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-100 rounded-full"
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Gesture hint */}
      {detectedLetter && detectedLetter !== '?' && ISL_HINTS[detectedLetter] && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
            <span className="text-base font-black text-violet-300">{detectedLetter}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-violet-300">{ISL_HINTS[detectedLetter]}</p>
            <p className="text-[10px] text-violet-400/60 font-medium">
              Hold gesture for ~1.5s to confirm letter
            </p>
          </div>
          <div className="ml-auto">
            <div className="relative w-8 h-8">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="rgb(139,92,246)"
                  strokeWidth="3"
                  strokeDasharray={`${(holdProgress / 100) * 94.2} 94.2`}
                  strokeLinecap="round"
                  className="transition-all duration-100"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Sentence Builder */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        {/* Current word being built */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-2">
            Building Word
          </p>
          <div className="min-h-[40px] flex items-center">
            {currentWord ? (
              <div className="flex flex-wrap gap-1">
                {currentWord.split('').map((char, i) => (
                  <span
                    key={i}
                    className={`w-7 h-8 flex items-center justify-center rounded-lg text-sm font-black border transition-all duration-200 ${
                      i === currentWord.length - 1
                        ? 'bg-violet-500/30 border-violet-400/50 text-violet-200 scale-110'
                        : 'bg-white/10 border-white/10 text-white'
                    }`}
                  >
                    {char}
                  </span>
                ))}
                <span className="w-0.5 h-8 bg-violet-400 animate-pulse rounded-full self-center ml-1" />
              </div>
            ) : (
              <span className="text-sm text-muted-foreground/30 italic">
                Sign letters to build a word...
              </span>
            )}
          </div>
        </div>

        {/* ── Word Suggestions ── */}
        {suggestions.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-3 h-3 text-fuchsia-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-fuchsia-400/70">
                Suggestions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(word => (
                <button
                  key={word}
                  onClick={() => handleSuggestionTap(word)}
                  className="group relative px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200
                    bg-fuchsia-500/10 border-fuchsia-500/25 text-fuchsia-200
                    hover:bg-fuchsia-500/30 hover:border-fuchsia-400/60 hover:scale-105 hover:shadow-lg hover:shadow-fuchsia-500/20
                    active:scale-95"
                >
                  <span className="text-fuchsia-400 font-black">{currentWord.toLowerCase()}</span>
                  <span className="text-fuchsia-200/80">{word.slice(currentWord.length)}</span>
                  <span className="ml-1.5 text-[9px] text-fuchsia-400/50 font-medium uppercase tracking-wide">↵</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed sentence */}
        {sentence && (
          <div className="px-4 py-2 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 mb-1">
              Sentence
            </p>
            <p className="text-sm text-white/80 leading-relaxed font-medium min-h-[20px]">
              {sentence}
              <span className="text-violet-300/60">▌</span>
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-4 pb-4 pt-3 border-t border-white/5 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddSpace}
            disabled={!currentWord}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white/70 hover:text-white"
          >
            <Space className="w-3.5 h-3.5" />
            Space
          </button>
          <button
            onClick={handleDeleteLetter}
            disabled={!displayText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-red-400"
          >
            <Delete className="w-3.5 h-3.5" />
            Delete
          </button>
          <button
            onClick={handleClearSentence}
            disabled={!displayText}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-rose-400"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>

          <Button
            variant="hero"
            size="sm"
            onClick={handleUseText}
            disabled={!displayText}
            className="ml-auto text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
            Use as Answer
          </Button>
        </div>
      </div>

      {/* ISL Alphabet Quick Reference */}
      <details className="group rounded-2xl bg-white/3 border border-white/5 overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors select-none">
          <span>ISL Alphabet Quick Reference</span>
          <span className="group-open:rotate-180 transition-transform text-muted-foreground">▾</span>
        </summary>
        <div className="px-4 pb-4 grid grid-cols-6 gap-1.5">
          {Object.entries(ISL_HINTS).map(([letter, hint]) => (
            <div
              key={letter}
              className={`relative flex flex-col items-center rounded-xl p-2 border transition-all duration-200 cursor-default ${
                detectedLetter === letter
                  ? 'bg-violet-500/30 border-violet-400/50 shadow-violet-500/20 shadow-lg scale-105'
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
              title={hint}
            >
              <span className="text-lg font-black text-white leading-none">{letter}</span>
              {detectedLetter === letter && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-violet-500 border border-black" />
              )}
            </div>
          ))}
        </div>
      </details>

      {/* Instructions */}
      <div className="flex gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
        <div className="text-violet-400 text-base shrink-0 mt-0.5">💡</div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Show ISL hand signs in front of the camera. <strong className="text-white/70">Hold each gesture for ~1.5 seconds</strong> to confirm the letter.
          Use <strong className="text-white/70">Space</strong> to finish a word, then click <strong className="text-white/70">Use as Answer</strong> to submit.
        </p>
      </div>
    </div>
  );
};

export default ISLSignLanguagePanel;
