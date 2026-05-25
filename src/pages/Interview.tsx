import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AnswerComparison from '@/components/AnswerComparison';
import CareerReadiness from '@/components/CareerReadiness';
import VoiceRecorder from '@/components/VoiceRecorder';
import FloatingOrb from '@/components/FloatingOrb';
import Geometric3D from '@/components/Geometric3D';
import CameraPreview from '@/components/CameraPreview';
import { evaluateAnswer, isGroqConfigured, transcribeAudio, generateInterviewQuestions, GeneratedQuestion } from '@/lib/groqService';
import { ArrowLeft, ArrowRight, Send, Mic, Keyboard, MessageSquare, Loader2, Gauge, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';
import type { WebcamConfidenceResult } from '@/lib/confidenceApi';
import heroBg from '@/assets/background.png';

const Interview: React.FC = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{
    feedback: string;
    strongAnswer: string;
    missingElements: string[];
    confidenceScore: number;
    confidenceLevel: 'Low' | 'Medium' | 'High';
    confidenceExplanation: string;
  } | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [webcamConfidence, setWebcamConfidence] = useState<WebcamConfidenceResult | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const getRoleTitle = (r: string) => {
    const titles: Record<string, string> = {
      frontend: 'Frontend Developer',
      backend: 'Backend Developer',
      'data-analyst': 'Data Analyst',
    };
    return titles[r] || 'Developer';
  };

  // Generate questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      if (!isGroqConfigured()) {
        toast.error('Groq API not configured', {
          description: 'Add VITE_GROQ_API_KEY to your .env file.',
        });
        navigate('/select-role');
        return;
      }

      try {
        setIsLoadingQuestions(true);
        const generatedQuestions = await generateInterviewQuestions(getRoleTitle(role || 'frontend'), 8);
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error('Failed to generate questions:', error);
        toast.error('Failed to generate questions', {
          description: error instanceof Error ? error.message : 'Please try again.',
        });
        navigate('/select-role');
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [role, navigate]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const aiFeedback = await evaluateAnswer(
        currentQuestion.text,
        answer,
        getRoleTitle(role || 'frontend'),
        currentQuestion.category
      );
      setFeedback(aiFeedback);
      setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('Failed to evaluate answer', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceRecording = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      toast.info('Transcribing your response...');
      const transcribedText = await transcribeAudio(audioBlob);
      
      if (!transcribedText.trim()) {
        toast.error('Could not transcribe audio. Please try again or type your answer.');
        setIsAnalyzing(false);
        return;
      }
      
      setAnswer(transcribedText);
      toast.success('Transcription complete!');
      
      const aiFeedback = await evaluateAnswer(
        currentQuestion.text,
        transcribedText,
        getRoleTitle(role || 'frontend'),
        currentQuestion.category
      );
      setFeedback(aiFeedback);
      setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    } catch (error) {
      console.error('Voice processing error:', error);
      toast.error('Failed to process voice recording', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswer('');
      setFeedback(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswer('');
      setFeedback(null);
    }
  };

  // Show loading state while generating questions
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen relative overflow-hidden py-8 px-4 flex items-center justify-center">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <FloatingOrb className="top-10 -right-20" size="lg" color="secondary" />
        <FloatingOrb className="bottom-40 -left-32" size="xl" color="primary" />
        <div className="max-w-md w-full relative z-10 text-center glass-strong p-12 rounded-3xl animate-fade-in shadow-2xl border border-white/5">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center rotate-12 shadow-glow">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="font-display text-2xl font-bold mb-3 tracking-tight">Preparing Interview...</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">AI is generating precision questions for your {getRoleTitle(role || '')} role.</p>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const confidenceTone = feedback?.confidenceLevel === 'High'
    ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : feedback?.confidenceLevel === 'Medium'
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <div className="min-h-screen relative overflow-hidden py-8 px-4">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Background Elements */}
      <FloatingOrb className="top-10 -right-20" size="lg" color="secondary" />
      <FloatingOrb className="bottom-40 -left-32" size="xl" color="primary" />
      <FloatingOrb className="top-1/2 left-1/3" size="md" color="accent" />

      {/* 3D Elements */}
      <Geometric3D type="sphere" className="absolute top-20 left-10 opacity-20 hidden xl:block" />
      <Geometric3D type="pyramid" className="absolute bottom-20 right-10 opacity-20 hidden xl:block" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/select-role')}
            className="group glass-strong"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Change Role
          </Button>
          
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {getRoleTitle(role || '')} <span className="gradient-text">Interview</span>
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <Card variant="glow" className="animate-fade-in border-white/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/20 text-white border border-primary/20">
                    {currentQuestion.category}
                  </span>
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                    currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                    currentQuestion.difficulty === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/20 text-rose-400 border-rose-500/20'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <CardTitle className="text-xl leading-relaxed font-display">
                  <MessageSquare className="inline w-5 h-5 mr-3 text-white" />
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Input Mode Toggle */}
                <div className="flex items-center gap-2 mb-6 p-1 bg-white/5 rounded-xl w-fit border border-white/5">
                  <Button
                    variant={inputMode === 'text' ? 'hero' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('text')}
                    className="h-8 text-xs font-semibold"
                  >
                    <Keyboard className="w-3.5 h-3.5 mr-2" />
                    Text Mode
                  </Button>
                  <Button
                    variant={inputMode === 'voice' ? 'hero' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('voice')}
                    className="h-8 text-xs font-semibold"
                  >
                    <Mic className="w-3.5 h-3.5 mr-2" />
                    Voice Mode
                  </Button>
                </div>

                {inputMode === 'text' ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your answer here... Be as detailed as possible."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="min-h-[220px] bg-white/5 border-white/10 focus:border-primary/50 resize-none rounded-2xl placeholder:text-muted-foreground/30 text-base leading-relaxed"
                      disabled={isAnalyzing}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
                          {answer.length} Characters
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50">
                          {answer.split(' ').filter(Boolean).length} Words
                        </span>
                      </div>
                      <Button
                        variant="hero"
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim() || isAnalyzing}
                        className="shadow-glow"
                      >
                        {isAnalyzing ? 'Analyzing Response...' : 'Submit Answer'}
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/5">
                    <VoiceRecorder 
                      onRecordingComplete={handleVoiceRecording}
                      disabled={isAnalyzing}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feedback Section */}
            {(feedback || isAnalyzing) && (
              <div className="space-y-6">
                {isAnalyzing ? (
                  <Card variant="elevated" className="animate-pulse border-white/5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span>AI Interviewer is analyzing your response...</span>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ) : feedback && (
                  <>
                    <Card variant="glow" className="animate-fade-in border-white/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-display">
                          <div className="p-2 rounded-xl bg-primary/20">
                            <Gauge className="w-5 h-5 text-white" />
                          </div>
                          Interviewer Perception
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Confidence Score</p>
                            <p className="text-4xl font-display font-bold tracking-tight">{feedback.confidenceScore}%</p>
                          </div>
                          <div className="flex-1 w-full md:max-w-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${confidenceTone}`}>
                                {feedback.confidenceLevel} Confidence
                              </span>
                            </div>
                            <Progress value={feedback.confidenceScore} variant="gradient" className="h-2 bg-white/10" />
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-4">
                          "{feedback.confidenceExplanation}"
                        </p>
                      </CardContent>
                    </Card>

                    {/* AI Feedback Card */}
                    <Card variant="glow" className="animate-fade-in border-white/5">
                      <CardHeader>
                        <CardTitle className="text-lg font-display flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-white" />
                          Evaluation Feedback
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/90 leading-relaxed text-base">{feedback.feedback}</p>
                      </CardContent>
                    </Card>
                    
                    <AnswerComparison
                      userAnswer={answer}
                      strongAnswer={feedback.strongAnswer}
                      missingElements={feedback.missingElements}
                    />
                  </>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="glass-strong border-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-full glass-strong border border-white/5">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setAnswer('');
                      setFeedback(null);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentQuestionIndex
                        ? 'bg-primary scale-150 shadow-[0_0_8px_hsl(280_80%_60%)]'
                        : answeredQuestions.has(index)
                          ? 'bg-secondary'
                          : 'bg-white/10 hover:bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="glass-strong border-white/5"
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar - Career Readiness */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <div className="glass-strong p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                
                <div className="relative mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-white tracking-tight">AI Perception</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Real-time behavior analysis</p>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">Live</span>
                    </div>
                  </div>
                  <CameraPreview
                    className="aspect-video w-full rounded-2xl shadow-2xl"
                    onConfidenceUpdate={setWebcamConfidence}
                  />
                </div>

                {webcamConfidence && (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 animate-fade-in">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-muted-foreground font-medium">Body Language Confidence</span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        webcamConfidence.confidence === 'Confident' ? 'bg-emerald-500/20 text-emerald-400' :
                        webcamConfidence.confidence === 'Neutral' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {webcamConfidence.confidence}
                      </span>
                    </div>
                    <Progress value={webcamConfidence.probability * 100} variant="gradient" className="h-1.5 bg-white/10" />
                    <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
                      Your current posture and eye contact indicate a <span className="text-white font-bold">{Math.round(webcamConfidence.probability * 100)}%</span> level of confidence.
                    </p>
                  </div>
                )}
              </div>

              <CareerReadiness
                questionsAnswered={answeredQuestions.size}
                totalQuestions={totalQuestions}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;


