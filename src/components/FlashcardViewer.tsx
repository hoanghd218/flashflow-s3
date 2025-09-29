import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Volume2, RotateCcw, Clock, Target, TrendingUp } from 'lucide-react';
import { Flashcard } from '@/types/flashcard';
import { cn } from '@/lib/utils';
import fatherImage from '@/assets/father.jpg';
import thankYouImage from '@/assets/thank-you.jpg';
import goodbyeImage from '@/assets/goodbye.jpg';

interface FlashcardViewerProps {
  card: Flashcard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FlashcardViewer = ({ card, isOpen, onClose }: FlashcardViewerProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when dialog opens/closes or card changes
  useEffect(() => {
    if (isOpen && card) {
      setIsFlipped(false);
    }
  }, [card, isOpen]);

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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsFlipped(false);
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Flashcard Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Info */}
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
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>Reviews: {card.repetitions}</span>
            </div>
          </div>

          {/* Main Card */}
          <Card 
            className={cn(
              "min-h-[300px] cursor-pointer transition-all duration-300 transform hover:shadow-lg",
              isFlipped ? "bg-gradient-to-br from-primary/5 to-secondary/5" : "bg-gradient-to-br from-background to-muted/20"
            )}
            onClick={handleFlip}
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
                      <span>Click to see answer</span>
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
                    
                    {(card.frontImageUrl || card.backImageUrl) && (
                      <div className="flex justify-center">
                        <img 
                          src={getImageSrc(card.frontImageUrl || card.backImageUrl)} 
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
                  
                  <div className="pt-6">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <RotateCcw className="w-4 h-4" />
                      <span>Click to see front</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Flip Button */}
          <div className="flex justify-center">
            <Button onClick={handleFlip} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              {isFlipped ? 'Show Front' : 'Show Back'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};