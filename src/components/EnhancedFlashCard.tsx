import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Volume2, RotateCcw, Clock, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Flashcard, DifficultyRating } from '@/types/flashcard';
import { getDifficultyDescription, isCardOverdue } from '@/lib/spacedRepetition';
import { cn } from '@/lib/utils';
import fatherImage from '@/assets/father.jpg';
import thankYouImage from '@/assets/thank-you.jpg';
import goodbyeImage from '@/assets/goodbye.jpg';

interface FlashCardProps {
  card: Flashcard;
  onRate: (rating: DifficultyRating) => void;
  isFlipped: boolean;
  onFlip: () => void;
}

const FlashCard = ({ card, onRate, isFlipped, onFlip }: FlashCardProps) => {
  const [selectedRating, setSelectedRating] = useState<DifficultyRating | null>(null);

  // Helper function to get the correct image
  const getImageSrc = (imageUrl?: string) => {
    if (!imageUrl) return undefined;
    switch (imageUrl) {
      case '/src/assets/father.jpg':
        return fatherImage;
      case '/src/assets/thank-you.jpg':
        return thankYouImage;
      case '/src/assets/goodbye.jpg':
        return goodbyeImage;
      default:
        return imageUrl;
    }
  };

  const handleRate = (rating: DifficultyRating) => {
    setSelectedRating(rating);
    setTimeout(() => {
      onRate(rating);
      setSelectedRating(null);
    }, 200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'learning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'mastered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextReviewText = () => {
    const dueDate = new Date(card.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (isCardOverdue(card)) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`,
        isOverdue: true
      };
    }
    
    if (diffDays === 0) return { text: 'Due today', isOverdue: false };
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false };
    if (diffDays > 0) return { text: `Due in ${diffDays} days`, isOverdue: false };
    return { text: 'Past due', isOverdue: true };
  };

  const getRatingButtonStyle = (rating: DifficultyRating) => {
    const baseStyle = "flex-1 transition-all duration-200 transform hover:scale-105";
    const isSelected = selectedRating === rating;
    
    switch (rating) {
      case 'again':
        return `${baseStyle} ${isSelected ? 'bg-red-600 scale-105' : 'bg-red-500 hover:bg-red-600'} text-white`;
      case 'hard':
        return `${baseStyle} ${isSelected ? 'bg-orange-600 scale-105' : 'bg-orange-500 hover:bg-orange-600'} text-white`;
      case 'good':
        return `${baseStyle} ${isSelected ? 'bg-green-600 scale-105' : 'bg-green-500 hover:bg-green-600'} text-white`;
      case 'easy':
        return `${baseStyle} ${isSelected ? 'bg-blue-600 scale-105' : 'bg-blue-500 hover:bg-blue-600'} text-white`;
    }
  };

  const reviewInfo = getNextReviewText();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Card Info Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(card.status)}>
            {card.status}
          </Badge>
          {card.interval > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Interval: {card.interval} days</span>
            </div>
          )}
          {card.ease && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Ease: {card.ease.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1",
          reviewInfo.isOverdue ? "text-red-600" : "text-muted-foreground"
        )}>
          {reviewInfo.isOverdue && <AlertTriangle className="w-3 h-3" />}
          <Target className="w-3 h-3" />
          <span>{reviewInfo.text}</span>
        </div>
      </div>

      {/* Progress Indicator for Spaced Repetition */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Reviews: {card.repetitions}</span>
        <div className="flex-1 bg-muted rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((card.repetitions / 5) * 100, 100)}%` }}
          />
        </div>
        <span>5+ = Mastered</span>
      </div>

      {/* Main Card */}
      <Card 
        className={cn(
          "min-h-[400px] cursor-pointer transition-all duration-300 transform hover:shadow-lg",
          isFlipped ? "bg-gradient-to-br from-primary/5 to-secondary/5" : "bg-gradient-to-br from-background to-muted/20",
          reviewInfo.isOverdue && "ring-2 ring-red-200"
        )}
        onClick={onFlip}
      >
        <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
          {!isFlipped ? (
            // Front side
            <div className="space-y-6 w-full">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">{card.front}</h2>
                
                {card.pronunciationText && (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-lg">/{card.pronunciationText}/</span>
                  </div>
                )}
                
                {card.englishDefinition && (
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {card.englishDefinition}
                  </p>
                )}
                
                {card.frontImageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={getImageSrc(card.frontImageUrl)} 
                      alt={card.front}
                      className="max-w-xs max-h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
              
              <div className="pt-6">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Click to reveal answer</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Or press Spacebar
                </div>
              </div>
            </div>
          ) : (
            // Back side
            <div className="space-y-6 w-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xl text-muted-foreground">{card.front}</div>
                  <h2 className="text-3xl font-bold text-primary">{card.back}</h2>
                </div>
                
                {card.vietnameseDefinition && (
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {card.vietnameseDefinition}
                  </p>
                )}
                
                {card.backImageUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={getImageSrc(card.backImageUrl)} 
                      alt={card.back}
                      className="max-w-xs max-h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
                
                {card.example && (
                  <div className="space-y-2 max-w-lg mx-auto">
                    <div className="text-sm font-medium text-muted-foreground">Example:</div>
                    <blockquote className="text-base italic border-l-4 border-primary/30 pl-4">
                      {card.example}
                    </blockquote>
                    {card.exampleTranslation && (
                      <div className="text-sm text-muted-foreground">
                        {card.exampleTranslation}
                      </div>
                    )}
                  </div>
                )}
                
                {card.audioUrl && (
                  <div className="flex justify-center">
                    <audio controls className="w-full max-w-xs">
                      <source src={card.audioUrl} type="audio/mpeg" />
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating Buttons - Only show when flipped */}
      {isFlipped && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Rate your recall quality for spaced repetition:</p>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-2">
              <Button
                className={getRatingButtonStyle('again')}
                onClick={() => handleRate('again')}
                disabled={!!selectedRating}
              >
                Again
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Press 1
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                className={getRatingButtonStyle('hard')}
                onClick={() => handleRate('hard')}
                disabled={!!selectedRating}
              >
                Hard
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Press 2
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                className={getRatingButtonStyle('good')}
                onClick={() => handleRate('good')}
                disabled={!!selectedRating}
              >
                Good
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Press 3
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                className={getRatingButtonStyle('easy')}
                onClick={() => handleRate('easy')}
                disabled={!!selectedRating}
              >
                Easy
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                Press 4
              </div>
            </div>
          </div>
          
          {/* Rating Descriptions */}
          <div className="space-y-1 text-xs text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
            <div><strong>Again:</strong> {getDifficultyDescription('again')}</div>
            <div><strong>Hard:</strong> {getDifficultyDescription('hard')}</div>
            <div><strong>Good:</strong> {getDifficultyDescription('good')}</div>
            <div><strong>Easy:</strong> {getDifficultyDescription('easy')}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashCard;