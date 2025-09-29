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
  const { toast } = useToast();

  const searchUnsplash = async (query: string) => {
    const UNSPLASH_KEY = 'NRBXC6RJ5NmDcoJ7JUxmW1cXLijU4OTDBLe1UlEk0D8';
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } });
      const data = await res.json();
      const first = data.results?.[0];
      return first ? {
        imageUrl: first.urls.small,
        alt: first.alt_description || query,
        author: first.user?.name,
        source: first.links?.html
      } : null;
    } catch (error) {
      console.error('Error fetching from Unsplash:', error);
      return null;
    }
  };

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
      const prompt = `You are an assistant that generates English learning flashcards for Vietnamese learners.

The input will include:
A single English word or phrase (vocab): ${vocab.trim()}
${sentence.trim() ? `Optionally, a full English sentence where the vocab is used: ${sentence.trim()}` : ''}

Your task is to return a JSON object with the following structure:

Required fields:
front: (string) The English word/phrase itself.
back: (string) The Vietnamese meaning (short, concise).

Optional fields:
englishDefinition: (string) Clear and simple English definition, always include the part of speech (e.g., "verb", "noun", "adjective").
vietnameseDefinition: (string) Full Vietnamese explanation, also state clearly the part of speech (ví dụ: "Động từ chỉ hành động lau, chùi").
example: (string) An example sentence in English. ${sentence.trim() ? `Always use this sentence as the example: ${sentence.trim()}` : ''}
exampleTranslation: (string) The Vietnamese translation of the example sentence.
pronunciationText: (string) IPA pronunciation or simplified pronunciation guide.

Constraints:
Always output in valid JSON format.
Always include at least the front and back fields.
Keep definitions simple and understandable for beginner/intermediate English learners in Vietnam.
${sentence.trim() ? 'Always use the provided sentence as example.' : ''}
Always specify the part of speech in both englishDefinition and vietnameseDefinition.

Return ONLY the JSON object, no additional text.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Flashcard Generator',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1:free',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenRouter response:', data);

      const generatedContent = data.choices[0].message.content.trim();
      
      // Strip markdown code blocks if present
      let cleanedContent = generatedContent;
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to parse the JSON response
      let flashcardData;
      try {
        flashcardData = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', cleanedContent);
        throw new Error('AI response is not valid JSON');
      }

      // Validate required fields
      if (!flashcardData.front || !flashcardData.back) {
        throw new Error('Generated flashcard missing required fields');
      }

      // Search for image using Unsplash
      const imageData = await searchUnsplash(flashcardData.front);
      if (imageData) {
        flashcardData.frontImageUrl = imageData.imageUrl;
      }

      // Automatically create the flashcard
      await createFlashcardFromAI(flashcardData);
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

  const createFlashcardFromAI = async (flashcardData: Partial<Flashcard>) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert([{
          deck_id: deckId,
          front: flashcardData.front,
          back: flashcardData.back,
          english_definition: flashcardData.englishDefinition,
          vietnamese_definition: flashcardData.vietnameseDefinition,
          example: flashcardData.example,
          example_translation: flashcardData.exampleTranslation,
          pronunciation_text: flashcardData.pronunciationText,
          front_image_url: flashcardData.frontImageUrl,
          back_image_url: flashcardData.backImageUrl,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI flashcard created successfully!",
      });

      // Reset form and close dialog
      setSentence('');
      setVocab('');
      setIsOpen(false);
      onCardCreated();
    } catch (error) {
      console.error('Error creating flashcard:', error);
      toast({
        title: "Error",
        description: "Failed to create flashcard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSentence('');
    setVocab('');
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
                AI is generating and creating your flashcard...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate & Create Flashcard
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};