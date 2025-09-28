import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { Deck } from '@/types/flashcard';
import DeckCard from '@/components/DeckCard';
import { toast } from '@/hooks/use-toast';
import { getDecks, createDeck, createFlashcard } from '@/lib/supabaseUtils';

const Decks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  // Load decks from Supabase on component mount
  useEffect(() => {
    const loadDecks = async () => {
      try {
        const decksData = await getDecks();
        setDecks(decksData);
        
        // Create sample deck if no decks exist
        if (decksData.length === 0) {
          const sampleDeck = await createDeck(
            'Spanish Basics', 
            'Essential Spanish words and phrases for beginners'
          );
          
          // Add sample cards
          await createFlashcard(sampleDeck.id, {
            front: 'Father',
            back: 'Padre',
            englishDefinition: 'A male parent; a man who has a child or children',
            vietnameseDefinition: 'Người cha; người đàn ông có con',
            example: 'My father works as a doctor in the hospital.',
            exampleTranslation: 'Bố tôi làm bác sĩ tại bệnh viện.',
            frontImageUrl: '/src/assets/father.jpg',
            backImageUrl: '/src/assets/father.jpg',
            pronunciationText: 'ˈpɑː.dɹeɪ'
          });
          
          await createFlashcard(sampleDeck.id, {
            front: 'Thank you',
            back: 'Gracias',
            englishDefinition: 'A polite expression used when acknowledging a gift, service, or compliment',
            vietnameseDefinition: 'Lời cảm ơn lịch sự khi nhận được quà, dịch vụ hoặc lời khen',
            example: 'Thank you very much for your help with the project.',
            exampleTranslation: 'Cảm ơn bạn rất nhiều vì đã giúp đỡ dự án.',
            frontImageUrl: '/src/assets/thank-you.jpg',
            backImageUrl: '/src/assets/thank-you.jpg',
            pronunciationText: 'ˈɡɾa.θjas'
          });
          
          await createFlashcard(sampleDeck.id, {
            front: 'Goodbye',
            back: 'Adiós',
            englishDefinition: 'A farewell phrase used when parting or at the end of a conversation',
            vietnameseDefinition: 'Lời chào tạm biệt khi chia tay hoặc kết thúc cuộc trò chuyện',
            example: 'Goodbye! See you tomorrow at the office.',
            exampleTranslation: 'Tạm biệt! Hẹn gặp lại bạn ngày mai tại văn phòng.',
            frontImageUrl: '/src/assets/goodbye.jpg',
            backImageUrl: '/src/assets/goodbye.jpg',
            pronunciationText: 'a.ˈðjos'
          });
          
          // Reload decks
          const updatedDecks = await getDecks();
          setDecks(updatedDecks);
        }
      } catch (error) {
        console.error('Error loading decks:', error);
        toast({
          title: "Error",
          description: "Failed to load decks",
          variant: "destructive"
        });
      }
    };
    
    loadDecks();
  }, []);

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateDeck = async () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive"
      });
      return;
    }

    try {
      const newDeck = await createDeck(
        newDeckName.trim(),
        newDeckDescription.trim() || undefined
      );

      const updatedDecks = [...decks, newDeck];
      setDecks(updatedDecks);

      setNewDeckName('');
      setNewDeckDescription('');
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Success!",
        description: `Created deck "${newDeck.name}"`,
      });
    } catch (error) {
      console.error('Error creating deck:', error);
      toast({
        title: "Error",
        description: "Failed to create deck",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Decks</h1>
          <p className="text-muted-foreground">
            Organize your learning with themed flashcard collections
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="e.g., Spanish Vocabulary"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  placeholder="What will you learn in this deck?"
                  value={newDeckDescription}
                  onChange={(e) => setNewDeckDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateDeck} className="flex-1">
                  Create Deck
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search your decks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Decks Grid */}
      {filteredDecks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      ) : searchTerm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No decks found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search or create a new deck to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No decks yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first deck to start learning with flashcards.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Your First Deck</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Decks;