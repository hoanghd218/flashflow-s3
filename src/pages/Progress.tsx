import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Target, TrendingUp, BookOpen, Brain, Clock } from 'lucide-react';
import { Deck, UserProgress } from '@/types/flashcard';
import { getDeckStats } from '@/lib/spacedRepetition';
import { getDecks, getUserProgress } from '@/lib/supabaseUtils';
import { toast } from '@/hooks/use-toast';
import SpacedRepetitionDashboard from '@/components/SpacedRepetitionDashboard';

const Progress = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    totalCardsStudied: 0,
    streakDays: 0,
    sessionsHistory: []
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load decks from Supabase
        const decksData = await getDecks();
        setDecks(decksData);

        // Load user progress from Supabase
        const progressData = await getUserProgress();
        setUserProgress(progressData);
      } catch (error) {
        console.error('Error loading progress data:', error);
        toast({
          title: "Error",
          description: "Failed to load progress data",
          variant: "destructive"
        });
      }
    };

    loadData();
  }, []);

  // Calculate overall statistics
  const totalCards = decks.reduce((sum, deck) => sum + deck.cards.length, 0);
  const totalMastered = decks.reduce((sum, deck) => {
    const stats = getDeckStats(deck.cards);
    return sum + stats.mastered;
  }, 0);
  const totalDueToday = decks.reduce((sum, deck) => {
    const stats = getDeckStats(deck.cards);
    return sum + stats.dueToday;
  }, 0);

  const overallProgress = totalCards > 0 ? (totalMastered / totalCards) * 100 : 0;

  const stats = [
    {
      title: "Total Cards",
      value: totalCards,
      icon: BookOpen,
      color: "text-primary"
    },
    {
      title: "Mastered",
      value: totalMastered,
      icon: Target,
      color: "text-success"
    },
    {
      title: "Due Today",
      value: totalDueToday,
      icon: Clock,
      color: "text-destructive"
    },
    {
      title: "Study Streak",
      value: `${userProgress.streakDays} days`,
      icon: TrendingUp,
      color: "text-learning-mastered"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey and celebrate your achievements
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mastery Level</span>
            <span className="text-2xl font-bold text-primary">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <ProgressBar value={overallProgress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{totalMastered} mastered</span>
            <span>{totalCards} total cards</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Progress */}
      <Tabs defaultValue="decks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decks">Deck Progress</TabsTrigger>
          <TabsTrigger value="spaced-repetition">Spaced Repetition</TabsTrigger>
          <TabsTrigger value="calendar">Study Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="decks" className="space-y-4">
          {decks.length > 0 ? (
            <div className="space-y-4">
              {decks.map((deck) => {
                const stats = getDeckStats(deck.cards);
                const deckProgress = deck.cards.length > 0 ? (stats.mastered / deck.cards.length) * 100 : 0;
                
                return (
                  <Card key={deck.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{deck.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {deck.cards.length} cards total
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {Math.round(deckProgress)}%
                          </div>
                          {stats.dueToday > 0 && (
                            <Badge variant="destructive" className="mt-1">
                              {stats.dueToday} due
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <ProgressBar value={deckProgress} className="mb-4" />
                      
                      <div className="grid grid-cols-4 gap-4 text-center text-sm">
                        <div>
                          <div className="font-medium text-learning-new">{stats.new}</div>
                          <div className="text-muted-foreground">New</div>
                        </div>
                        <div>
                          <div className="font-medium text-learning-learning">{stats.learning}</div>
                          <div className="text-muted-foreground">Learning</div>
                        </div>
                        <div>
                          <div className="font-medium text-learning-review">{stats.review}</div>
                          <div className="text-muted-foreground">Review</div>
                        </div>
                        <div>
                          <div className="font-medium text-learning-mastered">{stats.mastered}</div>
                          <div className="text-muted-foreground">Mastered</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No decks yet</h3>
                <p className="text-muted-foreground text-center">
                  Create your first deck to start tracking progress.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="spaced-repetition">
          <SpacedRepetitionDashboard />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Study Calendar</h3>
              <p className="text-muted-foreground text-center">
                Calendar view coming soon! Track your daily study habits and streaks.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Progress;