import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Globe, Volume2, Download, Upload, Trash2, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  dailyGoal: number;
  soundEnabled: boolean;
  autoAdvance: boolean;
  newCardsPerDay: number;
}

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    language: 'en',
    dailyGoal: 20,
    soundEnabled: true,
    autoAdvance: false,
    newCardsPerDay: 10
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('flashmind-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('flashmind-settings', JSON.stringify(newSettings));
    
    if (key === 'theme') {
      setTheme(value as string);
    }
  };

  const exportData = () => {
    const decks = localStorage.getItem('flashmind-decks');
    const progress = localStorage.getItem('flashmind-progress');
    
    const exportData = {
      decks: decks ? JSON.parse(decks) : [],
      progress: progress ? JSON.parse(progress) : {},
      settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashmind-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported successfully",
      description: "Your backup file has been downloaded",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.decks) {
          localStorage.setItem('flashmind-decks', JSON.stringify(data.decks));
        }
        if (data.progress) {
          localStorage.setItem('flashmind-progress', JSON.stringify(data.progress));
        }
        if (data.settings) {
          setSettings(data.settings);
          localStorage.setItem('flashmind-settings', JSON.stringify(data.settings));
        }

        toast({
          title: "Data imported successfully",
          description: "Please refresh the page to see your imported data",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Please check your backup file format",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      localStorage.removeItem('flashmind-decks');
      localStorage.removeItem('flashmind-progress');
      localStorage.removeItem('flashmind-settings');
      
      toast({
        title: "All data cleared",
        description: "Please refresh the page",
        variant: "destructive"
      });
    }
  };

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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your learning experience
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Theme</label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <Select value={settings.theme} onValueChange={(value: any) => updateSetting('theme', value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Study Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Study Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Daily Goal</label>
              <p className="text-sm text-muted-foreground">
                Number of cards to study each day
              </p>
            </div>
            <Select 
              value={settings.dailyGoal.toString()} 
              onValueChange={(value) => updateSetting('dailyGoal', parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">New Cards Per Day</label>
              <p className="text-sm text-muted-foreground">
                Maximum new cards to introduce daily
              </p>
            </div>
            <Select 
              value={settings.newCardsPerDay.toString()} 
              onValueChange={(value) => updateSetting('newCardsPerDay', parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Sound Effects</label>
              <p className="text-sm text-muted-foreground">
                Play sounds for interactions
              </p>
            </div>
            <Switch 
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Auto Advance</label>
              <p className="text-sm text-muted-foreground">
                Automatically show next card after rating
              </p>
            </div>
            <Switch 
              checked={settings.autoAdvance}
              onCheckedChange={(checked) => updateSetting('autoAdvance', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Export Data</label>
              <p className="text-sm text-muted-foreground">
                Download a backup of your decks and progress
              </p>
            </div>
            <Button onClick={exportData} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Import Data</label>
              <p className="text-sm text-muted-foreground">
                Restore from a backup file
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Import
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-destructive">Clear All Data</label>
              <p className="text-sm text-muted-foreground">
                Permanently delete all decks and progress
              </p>
            </div>
            <Button onClick={clearAllData} variant="destructive" className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account - Mobile Logout */}
      <Card className="md:hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} variant="destructive" className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">FlashMind</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Smart spaced repetition for accelerated learning
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">Version 1.0.0</Badge>
            <Badge variant="outline">Beta</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;