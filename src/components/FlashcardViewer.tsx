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


  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* Front and Back Cards Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Front Card */}
            <Card className="bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Front
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground text-center">{card.front}</h2>
                  
                  {card.pronunciationText && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Volume2 className="w-4 h-4" />
                      <span className="text-base">/{card.pronunciationText}/</span>
                    </div>
                  )}
                  
                  {card.englishDefinition && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">📖 English Definition:</p>
                      <p className="text-sm">{card.englishDefinition}</p>
                    </div>
                  )}
                  
                  {card.frontImageUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={getImageSrc(card.frontImageUrl)} 
                        alt={card.front}
                        className="max-w-full max-h-40 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Back Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Back
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-primary text-center">{card.back}</h2>
                  
                  {card.vietnameseDefinition && (
                    <div className="p-3 bg-accent rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">🇻🇳 Nghĩa tiếng Việt:</p>
                      <p className="text-sm">{card.vietnameseDefinition}</p>
                    </div>
                  )}
                  
                  {(card.frontImageUrl || card.backImageUrl) && (
                    <div className="flex justify-center">
                      <img 
                        src={getImageSrc(card.frontImageUrl || card.backImageUrl)} 
                        alt={card.back}
                        className="max-w-full max-h-40 object-cover rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Example Section - Full Width */}
          {card.example && (
            <Card className="bg-card-front">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground">💭 Example:</div>
                  <blockquote className="text-base italic border-l-4 border-primary/30 pl-4">
                    {card.example}
                  </blockquote>
                  {card.exampleTranslation && (
                    <div className="text-sm text-muted-foreground pl-4">
                      {card.exampleTranslation}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio Section */}
          {card.audioUrl && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-sm font-medium text-muted-foreground mb-3">🔊 Audio Pronunciation:</div>
                  <audio controls className="w-full max-w-xs mx-auto">
                    <source src={card.audioUrl} type="audio/mpeg" />
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};