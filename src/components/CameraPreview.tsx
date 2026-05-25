import React, { useEffect, useRef, useState } from 'react';
import { confidenceEngine, ConfidenceMetrics } from '@/lib/confidenceEngine';
import { WebcamConfidenceResult } from '@/lib/confidenceApi';
import { Progress } from '@/components/ui/progress';

interface CameraPreviewProps {
  className?: string;
  onConfidenceUpdate?: (result: WebcamConfidenceResult | null) => void;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({ className = '', onConfidenceUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ConfidenceMetrics | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const getConfidenceLabel = (score: number): 'Confident' | 'Neutral' | 'Low' => {
    if (score >= 75) return 'Confident';
    if (score >= 40) return 'Neutral';
    return 'Low';
  };

  useEffect(() => {
    let mounted = true;

    const initEngine = async () => {
      try {
        await confidenceEngine.initialize();
        if (mounted) setIsInitializing(false);
      } catch (err) {
        console.error('Engine initialization error:', err);
        if (mounted) setError('Failed to initialize analysis engine');
      }
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: { ideal: 30 } } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});

          const processFrame = async () => {
            if (!mounted || !videoRef.current || videoRef.current.readyState < 2) {
              rafRef.current = requestAnimationFrame(processFrame);
              return;
            }

            try {
              const timestamp = performance.now();
              const result = await confidenceEngine.processFrame(videoRef.current, timestamp);
              
              if (mounted && result) {
                setMetrics(result);
                
                // Map to the existing result format for compatibility
                const decorated: WebcamConfidenceResult = {
                  confidence: getConfidenceLabel(result.total),
                  probability: result.total / 100,
                  all_probabilities: {
                    Confident: result.total >= 75 ? 1 : 0,
                    Neutral: result.total >= 40 && result.total < 75 ? 1 : 0,
                    Low: result.total < 40 ? 1 : 0,
                  }
                };
                onConfidenceUpdate?.(decorated);
              }
            } catch (err) {
              console.error('Frame processing error:', err);
            }

            rafRef.current = requestAnimationFrame(processFrame);
          };

          rafRef.current = requestAnimationFrame(processFrame);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        if (mounted) setError('Unable to access camera or microphone');
      }
    };

    initEngine().then(startCamera);

    return () => {
      mounted = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      onConfidenceUpdate?.(null);
    };
  }, [onConfidenceUpdate]);

  return (
    <div className={`group relative bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 hover:border-primary/30 ${className}`}>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-900/90 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-white mb-1">Camera Error</p>
          <p className="text-xs text-zinc-400">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full h-full object-cover mirror-mode"
            playsInline
            muted
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {isInitializing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium">Initializing AI</p>
            </div>
          ) : metrics && (
            <div className="absolute bottom-4 left-4 right-4 space-y-3 pointer-events-none transition-all duration-500 group-hover:bottom-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold block mb-1">Live Confidence</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-bold text-white tracking-tight">
                      {metrics.total}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      metrics.total >= 75 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      metrics.total >= 40 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {getConfidenceLabel(metrics.total)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-medium block">Eyes</span>
                    <span className="text-xs font-bold text-white/90">{metrics.eyeContact}%</span>
                  </div>
                  <div className="text-right border-l border-white/10 pl-4">
                    <span className="text-[9px] uppercase tracking-wider text-white/40 font-medium block">Posture</span>
                    <span className="text-xs font-bold text-white/90">{metrics.posture}%</span>
                  </div>
                </div>
              </div>
              
              <Progress value={metrics.total} variant="gradient" className="h-1.5 bg-white/10" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 drop-shadow-md">Live Analysis</span>
          </div>
        </>
      )}
      
      <style>{`
        .mirror-mode {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CameraPreview;

