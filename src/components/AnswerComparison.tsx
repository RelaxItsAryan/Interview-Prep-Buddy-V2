import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';

interface AnswerComparisonProps {
  userAnswer: string;
  strongAnswer: string;
  missingElements: string[];
  isLoading?: boolean;
}

const AnswerComparison: React.FC<AnswerComparisonProps> = ({
  userAnswer,
  strongAnswer,
  missingElements,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card variant="glass" className="animate-pulse">
        <CardHeader>
          <CardTitle>Generating improvement suggestions...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 rounded-xl bg-muted animate-shimmer" />
            <div className="h-24 rounded-xl bg-muted animate-shimmer" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-xl bg-secondary/20">
            <Lightbulb className="w-5 h-5 text-secondary" />
          </div>
          Answer Improvement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* User's Answer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="p-1 rounded-lg bg-accent/20">
                <X className="w-3 h-3 text-accent" />
              </div>
              Your Answer
            </div>
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 min-h-[120px]">
              <p className="text-sm leading-relaxed text-muted-foreground">{userAnswer}</p>
            </div>
          </div>

          {/* Strong Answer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="p-1 rounded-lg bg-primary/20">
                <Check className="w-3 h-3 text-primary" />
              </div>
              Strong Candidate Answer
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 min-h-[120px]">
              <p className="text-sm leading-relaxed text-foreground">{strongAnswer}</p>
            </div>
          </div>
        </div>

        {/* Missing Elements */}
        {missingElements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              What was missing
            </h4>
            <div className="flex flex-wrap gap-2">
              {missingElements.map((element, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary border border-secondary/30"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnswerComparison;
