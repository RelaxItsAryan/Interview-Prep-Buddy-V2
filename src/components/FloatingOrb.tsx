import React from 'react';

interface FloatingOrbProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent';
}

const FloatingOrb: React.FC<FloatingOrbProps> = ({ 
  className = '', 
  size = 'md',
  color = 'primary' 
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96',
  };

  const colorClasses = {
    primary: 'from-primary/30 via-primary/10 to-transparent',
    secondary: 'from-secondary/30 via-secondary/10 to-transparent',
    accent: 'from-accent/30 via-accent/10 to-transparent',
  };

  return (
    <div 
      className={`absolute rounded-full bg-gradient-radial ${sizeClasses[size]} ${colorClasses[color]} blur-3xl animate-float pointer-events-none ${className}`}
    />
  );
};

export default FloatingOrb;
