import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import RoleCard, { Role } from '@/components/RoleCard';
import FloatingOrb from '@/components/FloatingOrb';
import Geometric3D from '@/components/Geometric3D';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import heroBg from '@/assets/background.png';

const SelectRole: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleStartInterview = () => {
    if (selectedRole) {
      navigate(`/interview/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden py-12 px-4">
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
      <FloatingOrb className="top-20 -right-20" size="lg" color="primary" />
      <FloatingOrb className="bottom-20 -left-32" size="xl" color="secondary" />
      <FloatingOrb className="top-1/2 left-1/4" size="md" color="accent" />

      {/* 3D Elements */}
      <Geometric3D type="sphere" className="absolute top-40 left-10 opacity-30 hidden lg:block" />
      <Geometric3D type="ring" className="absolute bottom-20 right-20 opacity-30 hidden lg:block" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose Your Role
            <span className="gradient-text"> Role</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Select the position you're preparing for. We'll tailor the interview questions to match your career goals.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {(['frontend', 'backend', 'data-analyst', 'content-writing', 'graphic-designer'] as Role[]).map((role, index) => (
            <div 
              key={role}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <RoleCard
                role={role}
                isSelected={selectedRole === role}
                onSelect={setSelectedRole}
              />
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            variant="hero"
            size="xl"
            onClick={handleStartInterview}
            disabled={!selectedRole}
            className="group"
          >
            Start Interview
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-12 p-6 rounded-2xl glass-strong animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-display font-semibold mb-3">Interview Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              Take your time to think before answering — quality matters more than speed.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2" />
              Use specific examples from your experience to illustrate your points.
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
              Structure your answers clearly — consider using the STAR method for behavioral questions.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;

