import React from 'react';

interface Geometric3DProps {
  className?: string;
  type?: 'cube' | 'sphere' | 'pyramid' | 'ring';
}

const Geometric3D: React.FC<Geometric3DProps> = ({ className = '', type = 'cube' }) => {
  const renderShape = () => {
    switch (type) {
      case 'cube':
        return (
          <div className="relative w-20 h-20 transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
            {/* Front face */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/20 border border-primary/30 backdrop-blur-sm" 
                 style={{ transform: 'translateZ(40px)' }} />
            {/* Back face */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 to-secondary/20 border border-secondary/30" 
                 style={{ transform: 'rotateY(180deg) translateZ(40px)' }} />
            {/* Right face */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-accent/20 border border-accent/30" 
                 style={{ transform: 'rotateY(90deg) translateZ(40px)' }} />
            {/* Left face */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/20 border border-primary/30" 
                 style={{ transform: 'rotateY(-90deg) translateZ(40px)' }} />
            {/* Top face */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 to-accent/20 border border-secondary/30" 
                 style={{ transform: 'rotateX(90deg) translateZ(40px)' }} />
            {/* Bottom face */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/40 to-primary/20 border border-accent/30" 
                 style={{ transform: 'rotateX(-90deg) translateZ(40px)' }} />
          </div>
        );
      case 'sphere':
        return (
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 via-secondary/30 to-accent/20 shadow-glow" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tl from-transparent via-foreground/5 to-foreground/10" />
            <div className="absolute top-3 left-4 w-6 h-4 rounded-full bg-foreground/20 blur-sm" />
          </div>
        );
      case 'pyramid':
        return (
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="pyramidGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(280, 80%, 60%)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(320, 70%, 55%)" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="pyramidGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(340, 80%, 65%)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(280, 80%, 60%)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <polygon points="50,10 90,85 10,85" fill="url(#pyramidGrad1)" stroke="hsl(280, 80%, 60%)" strokeWidth="1" strokeOpacity="0.5" />
              <polygon points="50,10 90,85 50,70" fill="url(#pyramidGrad2)" stroke="hsl(320, 70%, 55%)" strokeWidth="1" strokeOpacity="0.3" />
            </svg>
          </div>
        );
      case 'ring':
        return (
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-spin-slow" />
            <div className="absolute inset-2 rounded-full border-2 border-secondary/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
            <div className="absolute inset-4 rounded-full border border-accent/20 animate-spin-slow" style={{ animationDuration: '25s' }} />
            <div className="absolute inset-[38%] rounded-full bg-gradient-to-br from-primary/30 to-accent/20 shadow-glow-sm" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${className} animate-float`}>
      {renderShape()}
    </div>
  );
};

export default Geometric3D;
