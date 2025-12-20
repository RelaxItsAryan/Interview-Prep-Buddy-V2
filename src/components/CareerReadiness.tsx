import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import ScoreCircle from './ScoreCircle';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';

interface CareerReadinessProps {
  overallScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  improvement: number;
}

const CareerReadiness: React.FC<CareerReadinessProps> = ({
  overallScore,
  questionsAnswered,
  totalQuestions,
  improvement,
}) => {
  const progressPercentage = (questionsAnswered / totalQuestions) * 100;

  const getReadinessLevel = (score: number) => {
    if (score >= 80) return { label: 'Interview Ready', color: 'text-primary' };
    if (score >= 60) return { label: 'Almost There', color: 'text-secondary' };
    if (score >= 40) return { label: 'Making Progress', color: 'text-accent' };
    return { label: 'Keep Practicing', color: 'text-muted-foreground' };
  };

  const readiness = getReadinessLevel(overallScore);

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-accent/20">
              <Award className="w-5 h-5 text-accent" />
            </div>
            Career Readiness
          </span>
          <span className={`text-sm font-medium ${readiness.color}`}>
            {readiness.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="flex items-center justify-center py-4">
          <ScoreCircle score={overallScore} label="Overall" size="lg" />
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Interview Progress</span>
            <span className="font-medium">{questionsAnswered}/{totalQuestions} questions</span>
          </div>
          <Progress value={progressPercentage} variant="gradient" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Questions Left</p>
              <p className="font-display font-semibold">{totalQuestions - questionsAnswered}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Improvement</p>
              <p className="font-display font-semibold text-secondary">+{improvement}%</p>
            </div>
          </div>
        </div>

        {/* Motivation */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              {overallScore < 50 
                ? "Every practice session brings you closer to your dream job!"
                : overallScore < 75
                  ? "Great progress! You're developing strong interview skills."
                  : "Excellent! You're well-prepared for real interviews."
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerReadiness;
