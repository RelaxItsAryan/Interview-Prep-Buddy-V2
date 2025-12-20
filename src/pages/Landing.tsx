import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import FloatingOrb from '@/components/FloatingOrb';
import Geometric3D from '@/components/Geometric3D';
import { ArrowRight, Sparkles, Target, Brain, Users, Zap } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'AI Interview Mirror',
      description: 'See how real interviewers perceive your answers with instant feedback on confidence, clarity, and depth.',
    },
    {
      icon: Target,
      title: 'Role-Specific Practice',
      description: 'Practice with curated questions for Frontend, Backend, and Data Analyst positions.',
    },
    {
      icon: Sparkles,
      title: 'Answer Improvement',
      description: 'Compare your answers with strong candidate responses and learn what makes them stand out.',
    },
    {
      icon: Users,
      title: 'Inclusive Design',
      description: 'Beginner-friendly feedback with simple explanations, designed for first-time job seekers.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background Image */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Background Elements */}
      <FloatingOrb className="top-20 -left-32" size="xl" color="primary" />
      <FloatingOrb className="top-1/3 -right-20" size="lg" color="secondary" />
      <FloatingOrb className="bottom-20 left-1/4" size="md" color="accent" />
      
      {/* 3D Elements */}
      <Geometric3D type="sphere" className="absolute top-32 right-20 opacity-60 hidden lg:block" />
      <Geometric3D type="ring" className="absolute bottom-40 right-1/3 opacity-50 hidden lg:block" />
      <Geometric3D type="pyramid" className="absolute top-1/2 left-20 opacity-40 hidden lg:block animate-float-delayed" />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Interview Prep</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
            Interview Prep
            <span className="block gradient-text">Buddy</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Practice with AI that shows you exactly how interviewers perceive your answers. 
            Get personalized feedback and boost your career readiness.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              variant="hero" 
              size="xl"
              onClick={() => navigate('/select-role')}
              className="group"
            >
              Start Practicing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { value: '100%', label: 'Improvement Guaranteed' },
              { value: '85%', label: 'AI Success Rate' },
              { value: '50+', label: 'Question Types' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to
              <span className="gradient-text"> Succeed</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our AI-powered platform gives you the tools and feedback you need to ace your next interview.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-2xl glass hover:shadow-glow transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-8 md:p-12 rounded-3xl glass-strong overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10" />
            
            <div className="relative z-10 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Ace Your Interview?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of candidates who transformed their interview skills with AI-powered practice.
              </p>
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => navigate('/select-role')}
                className="group"
              >
                Start Free Practice
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Interview Prep Buddy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for students & early-career professionals
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
