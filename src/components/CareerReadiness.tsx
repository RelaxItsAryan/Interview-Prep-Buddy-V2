import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Target, Zap, CheckCircle } from 'lucide-react';

interface CareerReadinessProps {
  questionsAnswered: number;
  totalQuestions: number;
}

const CareerReadiness: React.FC<CareerReadinessProps> = ({
  questionsAnswered,
  totalQuestions,
}) => {
  const progressPercentage = (questionsAnswered / totalQuestions) * 100;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-accent/20">
              <Award className="w-5 h-5 text-accent" />
            </div>
            Interview Progress
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Circle */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
                className="opacity-30"
              />
              <circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className="stroke-primary transition-all duration-1000 ease-out"
                style={{
                  strokeDasharray: 2 * Math.PI * 45,
                  strokeDashoffset: 2 * Math.PI * 45 * (1 - progressPercentage / 100),
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-2xl text-primary">
                {questionsAnswered}
              </span>
              <span className="text-xs text-muted-foreground">of {totalQuestions}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Questions Completed</span>
            <span className="font-medium">{questionsAnswered}/{totalQuestions}</span>
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
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="font-display font-semibold">{totalQuestions - questionsAnswered}</p>
            </div>
          </div>
          
          <div className="p-3 rounded-xl bg-muted/30 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/20">
              <CheckCircle className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="font-display font-semibold text-secondary">{questionsAnswered}</p>
            </div>
          </div>
        </div>

        {/* Motivation */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm text-foreground">
              {questionsAnswered === 0 
                ? "Start answering questions to practice!"
                : questionsAnswered < totalQuestions / 2
                  ? "Great start! Keep going to complete the interview."
                  : questionsAnswered < totalQuestions
                    ? "Almost there! Just a few more questions."
                    : "Excellent! You've completed all questions!"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerReadiness;
