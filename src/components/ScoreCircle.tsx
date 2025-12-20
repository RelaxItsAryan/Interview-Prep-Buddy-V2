import React from 'react';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'auto';
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ 
  score, 
  maxScore = 100, 
  label,
  size = 'md',
  color = 'auto'
}) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  };

  const getColor = () => {
    if (color !== 'auto') return color;
    if (percentage >= 70) return 'primary';
    if (percentage >= 40) return 'secondary';
    return 'accent';
  };

  const colorClass = getColor();
  
  const strokeColors = {
    primary: 'stroke-primary',
    secondary: 'stroke-secondary',
    accent: 'stroke-accent',
  };

  const textColors = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
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
          className={`${strokeColors[colorClass]} transition-all duration-1000 ease-out`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display font-bold ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-xl' : 'text-lg'} ${textColors[colorClass]}`}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
      </div>
    </div>
  );
};

export default ScoreCircle;
