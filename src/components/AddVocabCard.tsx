import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { Deck } from '@/types/flashcard';
import { createFlashcard } from '@/lib/supabaseUtils';
import { toast } from '@/hooks/use-toast';

interface AddVocabCardProps {
  deck: Deck;
  onCardAdded: () => void;
}

const AddVocabCard = ({ deck, onCardAdded }: AddVocabCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    front: '',
    back: '',
    englishDefinition: '',
    vietnameseDefinition: '',
    example: '',
    exampleTranslation: '',
    pronunciationText: '',
    frontImageUrl: '',
    backImageUrl: '',
    audioUrl: ''
  });

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      front: '',
      back: '',
      englishDefinition: '',
      vietnameseDefinition: '',
      example: '',
      exampleTranslation: '',
      pronunciationText: '',
      frontImageUrl: '',
      backImageUrl: '',
      audioUrl: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.front.trim() || !formData.back.trim()) {
      toast({
        title: "Error",
        description: "Front and back fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await createFlashcard(deck.id, {
        front: formData.front.trim(),
        back: formData.back.trim(),
        englishDefinition: formData.englishDefinition.trim() || undefined,
        vietnameseDefinition: formData.vietnameseDefinition.trim() || undefined,
        example: formData.example.trim() || undefined,
        exampleTranslation: formData.exampleTranslation.trim() || undefined,
        pronunciationText: formData.pronunciationText.trim() || undefined,
        frontImageUrl: formData.frontImageUrl.trim() || undefined,
        backImageUrl: formData.backImageUrl.trim() || undefined,
        audioUrl: formData.audioUrl.trim() || undefined,
      });

      toast({
        title: "Success!",
        description: "New card added to deck",
      });

      resetForm();
      setIsOpen(false);
      onCardAdded();
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Cards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Card to "{deck.name}"</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Required Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="front">Front *</Label>
                <Input
                  id="front"
                  placeholder="e.g., Father"
                  value={formData.front}
                  onChange={handleInputChange('front')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="back">Back *</Label>
                <Input
                  id="back"
                  placeholder="e.g., Padre"
                  value={formData.back}
                  onChange={handleInputChange('back')}
                />
              </div>
            </div>
          </div>

          {/* Definitions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Definitions</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="englishDefinition">English Definition</Label>
                <Textarea
                  id="englishDefinition"
                  placeholder="e.g., A male parent; a man who has a child or children"
                  value={formData.englishDefinition}
                  onChange={handleInputChange('englishDefinition')}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vietnameseDefinition">Vietnamese Definition</Label>
                <Textarea
                  id="vietnameseDefinition"
                  placeholder="e.g., Người cha; người đàn ông có con"
                  value={formData.vietnameseDefinition}
                  onChange={handleInputChange('vietnameseDefinition')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Examples */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Examples</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="example">Example Sentence</Label>
                <Textarea
                  id="example"
                  placeholder="e.g., My father works as a doctor in the hospital."
                  value={formData.example}
                  onChange={handleInputChange('example')}
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exampleTranslation">Example Translation</Label>
                <Textarea
                  id="exampleTranslation"
                  placeholder="e.g., Bố tôi làm bác sĩ tại bệnh viện."
                  value={formData.exampleTranslation}
                  onChange={handleInputChange('exampleTranslation')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Media (Optional)</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pronunciationText">Pronunciation</Label>
                <Input
                  id="pronunciationText"
                  placeholder="e.g., ˈpɑː.dɹeɪ"
                  value={formData.pronunciationText}
                  onChange={handleInputChange('pronunciationText')}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frontImageUrl">Front Image URL</Label>
                  <Input
                    id="frontImageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.frontImageUrl}
                    onChange={handleInputChange('frontImageUrl')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backImageUrl">Back Image URL</Label>
                  <Input
                    id="backImageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.backImageUrl}
                    onChange={handleInputChange('backImageUrl')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audioUrl">Audio URL</Label>
                <Input
                  id="audioUrl"
                  placeholder="https://example.com/audio.mp3"
                  value={formData.audioUrl}
                  onChange={handleInputChange('audioUrl')}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              Add Card
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVocabCard;