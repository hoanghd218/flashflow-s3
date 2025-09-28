import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock, Target } from 'lucide-react';
import { Deck } from '@/types/flashcard';
import { getDeckStats } from '@/lib/spacedRepetition';
import { Link } from 'react-router-dom';
import AddVocabCard from './AddVocabCard';

interface DeckCardProps {
  deck: Deck;
  onDeckUpdate?: () => void;
}

const DeckCard = ({ deck, onDeckUpdate }: DeckCardProps) => {
  const stats = getDeckStats(deck.cards);
  const progressPercent = deck.cards.length > 0 
    ? Math.round((stats.mastered / deck.cards.length) * 100) 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-1">{deck.name}</CardTitle>
          {stats.dueToday > 0 && (
            <Badge variant="destructive" className="ml-2">
              {stats.dueToday} due
            </Badge>
          )}
        </div>
        {deck.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {deck.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-learning-new" />
              <span className="font-semibold text-learning-new">{stats.new}</span>
            </div>
            <p className="text-xs text-muted-foreground">New</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Mastered</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{stats.mastered}/{stats.total}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button asChild className="w-full" variant={stats.dueToday > 0 ? "default" : "secondary"}>
            <Link to={`/study/${deck.id}`}>
              {stats.dueToday > 0 ? `Study ${stats.dueToday} cards` : 'Continue studying'}
            </Link>
          </Button>
          
          <AddVocabCard deck={deck} onCardAdded={onDeckUpdate || (() => {})} />
        </div>
      </CardContent>
    </Card>
  );
};

export default DeckCard;