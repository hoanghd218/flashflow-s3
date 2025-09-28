import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Volume2 } from 'lucide-react';
import { Flashcard, DifficultyRating } from '@/types/flashcard';
import { cn } from '@/lib/utils';

interface FlashCardProps {
  card: Flashcard;
  onRate: (rating: DifficultyRating) => void;
  isFlipped: boolean;
  onFlip: () => void;
}

const FlashCard = ({ card, onRate, isFlipped, onFlip }: FlashCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    onFlip();
    setTimeout(() => setIsAnimating(false), 300);
  };

  const difficultyButtons = [
    { rating: 'again' as DifficultyRating, label: 'Again', color: 'destructive', shortcut: '1' },
    { rating: 'hard' as DifficultyRating, label: 'Hard', color: 'secondary', shortcut: '2' },
    { rating: 'good' as DifficultyRating, label: 'Good', color: 'primary', shortcut: '3' },
    { rating: 'easy' as DifficultyRating, label: 'Easy', color: 'success', shortcut: '4' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Card */}
      <Card 
        className={cn(
          "min-h-[300px] cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl",
          isAnimating && "animate-flip",
          isFlipped ? "bg-card-back" : "bg-card-front"
        )}
        onClick={handleFlip}
      >
        <CardContent className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
          {!isFlipped ? (
            // Front of card
            <div className="space-y-4">
              <div className="text-2xl md:text-3xl font-medium leading-relaxed">
                {card.front}
              </div>
              {card.imageUrl && (
                <img 
                  src={card.imageUrl} 
                  alt="Card visual aid"
                  className="max-w-full max-h-48 object-contain rounded-lg"
                />
              )}
              <p className="text-sm text-muted-foreground">
                Click to reveal answer
              </p>
            </div>
          ) : (
            // Back of card
            <div className="space-y-6 w-full">
              <div className="text-2xl md:text-3xl font-medium leading-relaxed text-primary">
                {card.back}
              </div>
              
              {card.example && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Example:</p>
                  <p className="text-base italic">{card.example}</p>
                </div>
              )}

              {card.audioUrl && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Volume2 className="w-4 h-4" />
                  Play Audio
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Status Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div className={cn(
          "w-3 h-3 rounded-full",
          card.status === 'new' && "bg-learning-new",
          card.status === 'learning' && "bg-learning-learning",
          card.status === 'review' && "bg-learning-review",
          card.status === 'mastered' && "bg-learning-mastered"
        )} />
        <span className="text-sm text-muted-foreground capitalize">
          {card.status}
        </span>
      </div>

      {/* Difficulty Buttons - only show when flipped */}
      {isFlipped && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">How difficult was this card?</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {difficultyButtons.map(({ rating, label, color, shortcut }) => (
              <Button
                key={rating}
                variant={color as any}
                onClick={() => onRate(rating)}
                className="flex flex-col gap-1 h-auto py-3"
              >
                <span className="font-medium">{label}</span>
                <span className="text-xs opacity-75">({shortcut})</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Flip hint when not flipped */}
      {!isFlipped && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Click card or press Space to flip</span>
        </div>
      )}
    </div>
  );
};

export default FlashCard;