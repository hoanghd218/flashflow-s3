import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileJson, Upload } from 'lucide-react';
import { Deck } from '@/types/flashcard';
import { createFlashcard } from '@/lib/supabaseUtils';
import { toast } from '@/hooks/use-toast';

interface JsonImportCardProps {
  deck: Deck;
  onCardsAdded: () => void;
}

interface JsonFlashcard {
  front: string;
  back: string;
  englishDefinition?: string;
  vietnameseDefinition?: string;
  example?: string;
  exampleTranslation?: string;
  pronunciationText?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  audioUrl?: string;
}

const JsonImportCard = ({ deck, onCardsAdded }: JsonImportCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const validateFlashcard = (card: any): card is JsonFlashcard => {
    return (
      typeof card === 'object' &&
      card !== null &&
      typeof card.front === 'string' &&
      card.front.trim() !== '' &&
      typeof card.back === 'string' &&
      card.back.trim() !== ''
    );
  };

  const resetForm = () => {
    setJsonInput('');
  };

  const handleSubmit = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter JSON data",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      let parsedData;
      
      try {
        parsedData = JSON.parse(jsonInput);
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "Please check your JSON syntax",
          variant: "destructive"
        });
        return;
      }

      // Convert single object to array for uniform processing
      const cards = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      // Validate all cards
      const validCards: JsonFlashcard[] = [];
      const errors: string[] = [];

      cards.forEach((card, index) => {
        if (validateFlashcard(card)) {
          validCards.push(card);
        } else {
          errors.push(`Card at index ${index}: Missing required fields (front and back)`);
        }
      });

      if (errors.length > 0) {
        toast({
          title: "Validation Errors",
          description: `${errors.length} card(s) have errors. Check console for details.`,
          variant: "destructive"
        });
        console.error("Validation errors:", errors);
        return;
      }

      if (validCards.length === 0) {
        toast({
          title: "No Valid Cards",
          description: "No valid cards found in the JSON data",
          variant: "destructive"
        });
        return;
      }

      // Create all cards
      let successCount = 0;
      let failCount = 0;

      for (const card of validCards) {
        try {
          await createFlashcard(deck.id, {
            front: card.front.trim(),
            back: card.back.trim(),
            englishDefinition: card.englishDefinition?.trim() || undefined,
            vietnameseDefinition: card.vietnameseDefinition?.trim() || undefined,
            example: card.example?.trim() || undefined,
            exampleTranslation: card.exampleTranslation?.trim() || undefined,
            pronunciationText: card.pronunciationText?.trim() || undefined,
            frontImageUrl: card.frontImageUrl?.trim() || undefined,
            backImageUrl: card.backImageUrl?.trim() || undefined,
            audioUrl: card.audioUrl?.trim() || undefined,
          });
          successCount++;
        } catch (error) {
          console.error('Error creating card:', error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Successful!",
          description: `${successCount} card(s) imported successfully${failCount > 0 ? `. ${failCount} failed.` : ''}`,
        });
        resetForm();
        setIsOpen(false);
        onCardsAdded();
      } else {
        toast({
          title: "Import Failed",
          description: "All cards failed to import",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error importing cards:', error);
      toast({
        title: "Error",
        description: "Failed to import cards",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleJson = `{
  "front": "Father",
  "back": "Padre",
  "englishDefinition": "A male parent",
  "vietnameseDefinition": "Người cha",
  "example": "My father works as a doctor",
  "exampleTranslation": "Bố tôi làm bác sĩ"
}

// Or for multiple cards:
[
  {
    "front": "Father",
    "back": "Padre",
    "englishDefinition": "A male parent"
  },
  {
    "front": "Mother",
    "back": "Madre",
    "englishDefinition": "A female parent"
  }
]`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileJson className="w-4 h-4" />
          Import JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Cards from JSON - "{deck.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jsonInput">JSON Data *</Label>
              <Textarea
                id="jsonInput"
                placeholder="Paste your JSON data here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Required fields:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>front</code> - Front side of the card (string)</li>
                <li><code>back</code> - Back side of the card (string)</li>
              </ul>
              
              <p className="font-medium mt-4 mb-2">Optional fields:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><code>englishDefinition</code> - English definition</li>
                <li><code>vietnameseDefinition</code> - Vietnamese definition</li>
                <li><code>example</code> - Example sentence</li>
                <li><code>exampleTranslation</code> - Example translation</li>
                <li><code>pronunciationText</code> - Pronunciation guide</li>
                <li><code>frontImageUrl</code> - Front image URL</li>
                <li><code>backImageUrl</code> - Back image URL</li>
                <li><code>audioUrl</code> - Audio file URL</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-4">
            <details className="space-y-2">
              <summary className="cursor-pointer font-medium text-sm">
                Show JSON Examples
              </summary>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                {exampleJson}
              </pre>
            </details>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSubmit} 
              className="flex-1 gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Cards
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JsonImportCard;