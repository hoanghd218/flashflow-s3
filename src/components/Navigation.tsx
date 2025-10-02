import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Settings, Brain, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/decks', icon: BookOpen, label: 'Decks' },
    { path: '/study', icon: Brain, label: 'Study' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:top-0 md:bottom-auto md:w-64 md:border-r md:border-t-0">
      <div className="flex md:flex-col">
        {/* Logo - only visible on desktop */}
        <div className="hidden md:block p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">FlashMind</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex md:flex-col md:flex-1 md:p-4">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 p-3 md:p-3 md:rounded-lg transition-colors",
                location.pathname === path
                  ? "text-primary bg-accent md:bg-primary md:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs md:text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Logout Button - Desktop only */}
        <div className="hidden md:block p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;