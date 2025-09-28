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

const Decks = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  // Load decks from localStorage on component mount
  useEffect(() => {
    const savedDecks = localStorage.getItem('flashmind-decks');
    if (savedDecks) {
      setDecks(JSON.parse(savedDecks));
    } else {
      // Create sample deck for demo
      const sampleDeck: Deck = {
        id: 'sample-deck',
        name: 'Spanish Basics',
        description: 'Essential Spanish words and phrases for beginners',
        cards: [
          {
            id: '1',
            front: 'Hello',
            back: 'Hola',
            example: '¡Hola! ¿Cómo estás?',
            interval: 1,
            ease: 2.5,
            dueDate: new Date().toISOString(),
            repetitions: 0,
            status: 'new'
          },
          {
            id: '2',
            front: 'Thank you',
            back: 'Gracias',
            example: 'Muchas gracias por tu ayuda.',
            interval: 1,
            ease: 2.5,
            dueDate: new Date().toISOString(),
            repetitions: 0,
            status: 'new'
          },
          {
            id: '3',
            front: 'Goodbye',
            back: 'Adiós',
            example: '¡Adiós! Nos vemos mañana.',
            interval: 1,
            ease: 2.5,
            dueDate: new Date().toISOString(),
            repetitions: 0,
            status: 'new'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setDecks([sampleDeck]);
      localStorage.setItem('flashmind-decks', JSON.stringify([sampleDeck]));
    }
  }, []);

  const filteredDecks = decks.filter(deck =>
    deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deck.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createDeck = () => {
    if (!newDeckName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a deck name",
        variant: "destructive"
      });
      return;
    }

    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      name: newDeckName.trim(),
      description: newDeckDescription.trim() || undefined,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedDecks = [...decks, newDeck];
    setDecks(updatedDecks);
    localStorage.setItem('flashmind-decks', JSON.stringify(updatedDecks));

    setNewDeckName('');
    setNewDeckDescription('');
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Success!",
      description: `Created deck "${newDeck.name}"`,
    });
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
                <Button onClick={createDeck} className="flex-1">
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