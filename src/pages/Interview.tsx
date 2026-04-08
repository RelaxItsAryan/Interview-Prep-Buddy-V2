import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AnswerComparison from '@/components/AnswerComparison';
import CareerReadiness from '@/components/CareerReadiness';
import VoiceRecorder from '@/components/VoiceRecorder';
import FloatingOrb from '@/components/FloatingOrb';
import { evaluateAnswer, isGroqConfigured, transcribeAudio, generateInterviewQuestions, GeneratedQuestion } from '@/lib/groqService';
import { ArrowLeft, ArrowRight, Send, Mic, Keyboard, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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
  } | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

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
      <div className="min-h-screen relative overflow-hidden py-8 px-4">
        <FloatingOrb className="top-10 -right-20" size="lg" color="secondary" />
        <FloatingOrb className="bottom-40 -left-32" size="xl" color="primary" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="font-display text-xl font-bold">Generating Interview Questions...</h2>
          <p className="text-muted-foreground">AI is preparing personalized questions for {getRoleTitle(role || '')} role</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden py-8 px-4">
      {/* Background Elements */}
      <FloatingOrb className="top-10 -right-20" size="lg" color="secondary" />
      <FloatingOrb className="bottom-40 -left-32" size="xl" color="primary" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/select-role')}
            className="group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Change Role
          </Button>
          
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold">
              {getRoleTitle(role || '')} Interview
            </h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>

          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Interview Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Card */}
            <Card variant="elevated" className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/20 text-primary">
                    {currentQuestion.category}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>
                <CardTitle className="text-xl leading-relaxed">
                  <MessageSquare className="inline w-5 h-5 mr-2 text-primary" />
                  {currentQuestion.text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Input Mode Toggle */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant={inputMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('text')}
                  >
                    <Keyboard className="w-4 h-4 mr-2" />
                    Type
                  </Button>
                  <Button
                    variant={inputMode === 'voice' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setInputMode('voice')}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Voice
                  </Button>
                </div>

                {inputMode === 'text' ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Type your answer here... Take your time to structure your response clearly."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="min-h-[180px] bg-muted/30 border-border/50 focus:border-primary/50 resize-none"
                      disabled={isAnalyzing}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {answer.length} characters • {answer.split(' ').filter(Boolean).length} words
                      </span>
                      <Button
                        variant="hero"
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim() || isAnalyzing}
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Submit Answer'}
                        <Send className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <VoiceRecorder 
                    onRecordingComplete={handleVoiceRecording}
                    disabled={isAnalyzing}
                  />
                )}
              </CardContent>
            </Card>

            {/* Feedback Section */}
            {(feedback || isAnalyzing) && (
              <div className="space-y-6">
                {isAnalyzing ? (
                  <Card variant="glow" className="animate-pulse">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing your response...</span>
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ) : feedback && (
                  <>
                    {/* AI Feedback Card */}
                    <Card variant="glow" className="animate-fade-in">
                      <CardHeader>
                        <CardTitle className="text-lg">AI Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground leading-relaxed">{feedback.feedback}</p>
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
            <div className="flex items-center justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setAnswer('');
                      setFeedback(null);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-primary scale-125'
                        : answeredQuestions.has(index)
                          ? 'bg-secondary'
                          : 'bg-muted hover:bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Sidebar - Career Readiness */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
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
