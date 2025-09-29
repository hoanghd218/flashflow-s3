import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Flashcard } from '@/types/flashcard';

interface AICardGeneratorProps {
  deckId: string;
  onCardCreated: () => void;
}

export const AICardGenerator: React.FC<AICardGeneratorProps> = ({
  deckId,
  onCardCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sentence, setSentence] = useState('');
  const [vocab, setVocab] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<Partial<Flashcard> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!vocab.trim()) {
      toast({
        title: "Error",
        description: "Please enter a vocabulary word or phrase.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcard', {
        body: {
          sentence: sentence.trim() || undefined,
          vocab: vocab.trim(),
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedCard(data.flashcard);
      toast({
        title: "Success",
        description: "AI has generated your flashcard! Review it below.",
      });
    } catch (error) {
      console.error('Error generating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to generate flashcard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateCard = async () => {
    if (!generatedCard) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert([{
          deck_id: deckId,
          front: generatedCard.front,
          back: generatedCard.back,
          english_definition: generatedCard.englishDefinition,
          vietnamese_definition: generatedCard.vietnameseDefinition,
          example: generatedCard.example,
          example_translation: generatedCard.exampleTranslation,
          pronunciation_text: generatedCard.pronunciationText,
          front_image_url: generatedCard.frontImageUrl,
          back_image_url: generatedCard.backImageUrl,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Flashcard created successfully!",
      });

      // Reset form
      setSentence('');
      setVocab('');
      setGeneratedCard(null);
      setIsOpen(false);
      onCardCreated();
    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setSentence('');
    setVocab('');
    setGeneratedCard(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Add Card with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Flashcard with AI</DialogTitle>
          <DialogDescription>
            Enter a vocabulary word and optionally a sentence to generate a complete flashcard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sentence">Sentence (optional)</Label>
            <Textarea
              id="sentence"
              placeholder="e.g., Memories of a lifetime of troubled antics."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vocab">Vocabulary Word/Phrase *</Label>
            <Input
              id="vocab"
              placeholder="e.g., antics"
              value={vocab}
              onChange={(e) => setVocab(e.target.value)}
              required
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !vocab.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is generating your flashcard...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Flashcard
              </>
            )}
          </Button>

          {generatedCard && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Generated Flashcard Preview</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{generatedCard.front}</CardTitle>
                  <CardDescription>{generatedCard.back}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedCard.englishDefinition && (
                    <div>
                      <strong>English Definition:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {generatedCard.englishDefinition}
                      </p>
                    </div>
                  )}
                  
                  {generatedCard.vietnameseDefinition && (
                    <div>
                      <strong>Vietnamese Definition:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {generatedCard.vietnameseDefinition}
                      </p>
                    </div>
                  )}

                  {generatedCard.example && (
                    <div>
                      <strong>Example:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {generatedCard.example}
                      </p>
                      {generatedCard.exampleTranslation && (
                        <p className="text-sm text-muted-foreground italic">
                          {generatedCard.exampleTranslation}
                        </p>
                      )}
                    </div>
                  )}

                  {generatedCard.pronunciationText && (
                    <div>
                      <strong>Pronunciation:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {generatedCard.pronunciationText}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleCreateCard}
                  disabled={isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Flashcard'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedCard(null)}
                  disabled={isCreating}
                >
                  Generate Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};