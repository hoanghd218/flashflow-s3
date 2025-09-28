import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, TrendingUp, Brain, Target, BarChart3 } from 'lucide-react';
import { Deck } from '@/types/flashcard';
import { getUpcomingReviews, calculateRetentionRate, getDeckStats, isCardOverdue } from '@/lib/spacedRepetition';
import { getDecks } from '@/lib/supabaseUtils';
import { toast } from '@/hooks/use-toast';

const SpacedRepetitionDashboard = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const decksData = await getDecks();
      setDecks(decksData);
    } catch (error) {
      console.error('Error loading decks:', error);
      toast({
        title: "Error",
        description: "Failed to load spaced repetition data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall statistics
  const allCards = decks.flatMap(deck => deck.cards);
  const overallRetention = calculateRetentionRate(allCards);
  const upcomingReviews = getUpcomingReviews(allCards, 7);
  const overdueCards = allCards.filter(isCardOverdue);
  
  const totalDueToday = allCards.filter(card => {
    const dueDate = new Date(card.dueDate);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dueDate.getTime() <= today.getTime() && (card.status === 'learning' || card.status === 'review');
  }).length;

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCardsByInterval = () => {
    const intervals = new Map<number, number>();
    allCards.forEach(card => {
      const count = intervals.get(card.interval) || 0;
      intervals.set(card.interval, count + 1);
    });
    
    return Array.from(intervals.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 10); // Top 10 intervals
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Spaced Repetition Dashboard</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Spaced Repetition Dashboard</h2>
      </div>
      
      <p className="text-muted-foreground">
        Track your learning progress with the SM-2 algorithm. Cards you find difficult will appear more frequently, 
        while easy cards will have longer intervals between reviews.
      </p>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Due Today</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{totalDueToday}</div>
            <div className="text-xs text-muted-foreground">Cards to review</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{overdueCards.length}</div>
            <div className="text-xs text-muted-foreground">Cards past due</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Retention</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{overallRetention}%</div>
            <div className="text-xs text-muted-foreground">Success rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total Cards</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{allCards.length}</div>
            <div className="text-xs text-muted-foreground">In all decks</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reviews Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Review Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingReviews.map((day, index) => (
              <div key={day.date} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-red-500' : 
                    index === 1 ? 'bg-orange-500' : 
                    'bg-muted-foreground'
                  }`} />
                  <span className="font-medium">{getDayName(day.date)}</span>
                </div>
                <Badge variant={day.count > 50 ? "destructive" : day.count > 20 ? "secondary" : "outline"}>
                  {day.count} cards
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interval Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Interval Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getCardsByInterval().map(([interval, count]) => (
              <div key={interval} className="flex items-center gap-3">
                <div className="w-16 text-sm text-muted-foreground">
                  {interval === 0 ? 'New' : `${interval}d`}
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(count / Math.max(...getCardsByInterval().map(i => i[1]))) * 100}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-right">{count}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Cards distributed by review interval (days). Longer intervals indicate better retention.
          </div>
        </CardContent>
      </Card>

      {/* Deck Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Deck Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {decks.map(deck => {
              const stats = getDeckStats(deck.cards);
              const retention = calculateRetentionRate(deck.cards);
              const avgEase = deck.cards.length > 0 
                ? deck.cards.reduce((sum, card) => sum + card.ease, 0) / deck.cards.length 
                : 2.5;
              
              return (
                <div key={deck.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{deck.name}</h3>
                    <Badge variant={stats.dueToday > 10 ? "destructive" : "outline"}>
                      {stats.dueToday} due
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Retention</div>
                      <div className="font-semibold text-green-600">{retention}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Ease</div>
                      <div className="font-semibold">{avgEase.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Mastered</div>
                      <div className="font-semibold text-blue-600">{stats.mastered}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Learning</div>
                      <div className="font-semibold text-yellow-600">{stats.learning}</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deck.cards.length > 0 ? (stats.mastered / deck.cards.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpacedRepetitionDashboard;