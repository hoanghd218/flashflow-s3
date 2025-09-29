import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageGenerator } from '@/components/ImageGenerator';
import { toast } from '@/hooks/use-toast';

interface AIFlashcardGeneratorProps {
  deckId: string;
  onCardCreated: () => void;
}

export const AIFlashcardGenerator: React.FC<AIFlashcardGeneratorProps> = ({
  deckId,
  onCardCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [imageMode, setImageMode] = useState<'front' | 'back' | null>(null);

  const resetForm = () => {
    setFront('');
    setBack('');
    setImageMode(null);
  };

  const handleImageGenerated = () => {
    // Refresh the deck when image is generated and flashcard is created
    onCardCreated();
    setIsOpen(false);
    resetForm();
  };

  const validateForm = () => {
    if (!front.trim() || !back.trim()) {
      toast({
        title: "Error",
        description: "Both front and back text are required.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          <ImageIcon className="h-4 w-4" />
          Create Card with AI Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Flashcard with AI-Generated Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Flashcard Content Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="front">Front Text *</Label>
              <Input
                id="front"
                placeholder="e.g., entrepreneur"
                value={front}
                onChange={(e) => setFront(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="back">Back Text *</Label>
              <Textarea
                id="back"
                placeholder="e.g., doanh nhân"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Image Generation Options */}
          {front && back && (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground">
                Generate an AI image for:
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <ImageGenerator
                  mode="flashcard-front"
                  deckId={deckId}
                  cardData={{ front, back }}
                  onImageGenerated={handleImageGenerated}
                />
                
                <ImageGenerator
                  mode="flashcard-back"
                  deckId={deckId}
                  cardData={{ front, back }}
                  onImageGenerated={handleImageGenerated}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm">
              <div className="font-medium mb-2">How to use:</div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Enter the front and back text for your flashcard</li>
                <li>Choose whether to generate an image for the front or back</li>
                <li>Describe what image you want to generate</li>
                <li>The flashcard will be automatically created with the generated image</li>
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};