import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ScoreCircle from './ScoreCircle';
import { Sparkles, Brain, Target, MessageSquare } from 'lucide-react';

interface PerceptionData {
  confidence: number;
  clarity: number;
  depth: number;
  relevance: number;
  feedback: string;
}

interface InterviewMirrorProps {
  perception: PerceptionData;
  isLoading?: boolean;
}

const InterviewMirror: React.FC<InterviewMirrorProps> = ({ perception, isLoading = false }) => {
  const metrics = [
    { key: 'confidence', label: 'Confidence', icon: Sparkles, score: perception.confidence },
    { key: 'clarity', label: 'Clarity', icon: MessageSquare, score: perception.clarity },
    { key: 'depth', label: 'Depth', icon: Brain, score: perception.depth },
    { key: 'relevance', label: 'Relevance', icon: Target, score: perception.relevance },
  ];

  if (isLoading) {
    return (
      <Card variant="glow" className="animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-muted animate-shimmer" />
            <span>Analyzing your response...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-muted animate-shimmer" />
                <div className="w-16 h-3 rounded bg-muted animate-shimmer" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glow" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-xl bg-primary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          Interviewer Perception
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div 
              key={metric.key} 
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <ScoreCircle 
                score={metric.score} 
                label={metric.label}
                size="sm"
              />
            </div>
          ))}
        </div>
        
        <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">How an interviewer would perceive this:</h4>
          <p className="text-foreground leading-relaxed">{perception.feedback}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InterviewMirror;
