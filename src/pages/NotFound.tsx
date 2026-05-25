import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import FloatingOrb from "@/components/FloatingOrb";
import Geometric3D from "@/components/Geometric3D";
import { Home } from "lucide-react";
import heroBg from "@/assets/background.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
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
      <FloatingOrb className="top-20 -left-20" size="lg" color="primary" />
      <FloatingOrb className="bottom-20 -right-20" size="xl" color="secondary" />

      {/* 3D Elements */}
      <Geometric3D type="sphere" className="absolute top-1/4 right-1/4 opacity-40 animate-float" />

      <div className="relative z-10 max-w-md w-full text-center glass-strong p-12 rounded-3xl border border-white/5 shadow-2xl">
        <h1 className="font-display text-8xl font-bold mb-4 gradient-text">404</h1>
        <h2 className="font-display text-2xl font-semibold mb-4 text-white">Project Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist in our space.
        </p>
        <Button 
          variant="hero" 
          size="xl" 
          onClick={() => navigate('/')}
          className="w-full"
        >
          <Home className="w-5 h-5 mr-2" />
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;

