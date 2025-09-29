import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, Volume2, Eye } from 'lucide-react';
import { Deck, Flashcard } from '@/types/flashcard';
import { getDeck, createFlashcard, updateFlashcard, deleteFlashcard } from '@/lib/supabaseUtils';
import { toast } from '@/hooks/use-toast';
import JsonImportCard from '@/components/JsonImportCard';
import { AICardGenerator } from '@/components/AICardGenerator';
import { FlashcardViewer } from '@/components/FlashcardViewer';
import { ImageGenerator } from '@/components/ImageGenerator';

const DeckDetails = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [viewingCard, setViewingCard] = useState<Flashcard | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
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

  useEffect(() => {
    if (!deckId) return;
    loadDeck();
  }, [deckId]);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const deckData = await getDeck(deckId!);
      if (deckData) {
        setDeck(deckData);
      } else {
        navigate('/decks');
      }
    } catch (error) {
      console.error('Error loading deck:', error);
      toast({
        title: "Error",
        description: "Failed to load deck",
        variant: "destructive"
      });
      navigate('/decks');
    } finally {
      setLoading(false);
    }
  };

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

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openViewDialog = (card: Flashcard) => {
    setViewingCard(card);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (card: Flashcard) => {
    setEditingCard(card);
    setFormData({
      front: card.front,
      back: card.back,
      englishDefinition: card.englishDefinition || '',
      vietnameseDefinition: card.vietnameseDefinition || '',
      example: card.example || '',
      exampleTranslation: card.exampleTranslation || '',
      pronunciationText: card.pronunciationText || '',
      frontImageUrl: card.frontImageUrl || '',
      backImageUrl: card.backImageUrl || '',
      audioUrl: card.audioUrl || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateCard = async () => {
    if (!formData.front.trim() || !formData.back.trim()) {
      toast({
        title: "Error",
        description: "Front and back fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await createFlashcard(deckId!, {
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
        description: "New card created successfully",
      });

      resetForm();
      setIsCreateDialogOpen(false);
      loadDeck(); // Refresh deck data
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCard = async () => {
    if (!editingCard || !formData.front.trim() || !formData.back.trim()) {
      toast({
        title: "Error",
        description: "Front and back fields are required",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateFlashcard(editingCard.id, {
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
        description: "Card updated successfully",
      });

      setEditingCard(null);
      resetForm();
      setIsEditDialogOpen(false);
      loadDeck(); // Refresh deck data
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error",
        description: "Failed to update card",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteFlashcard(cardId);
      
      toast({
        title: "Success!",
        description: "Card deleted successfully",
      });

      loadDeck(); // Refresh deck data
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'learning':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'mastered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const CardFormFields = () => (
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
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading deck...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Deck not found</h3>
            <Link to="/decks">
              <Button>Back to Decks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/decks')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Decks
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deck.name}</h1>
            {deck.description && (
              <p className="text-muted-foreground">{deck.description}</p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="w-4 h-4" />
            Add New Card
          </Button>
          <AICardGenerator deckId={deckId!} onCardCreated={loadDeck} />
          <JsonImportCard deck={deck} onCardsAdded={loadDeck} />
          <ImageGenerator onImageGenerated={(imageUrl) => {
            console.log('Generated image URL:', imageUrl);
          }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{deck.cards.length}</div>
            <div className="text-sm text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {deck.cards.filter(c => c.status === 'new').length}
            </div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {deck.cards.filter(c => c.status === 'learning').length}
            </div>
            <div className="text-sm text-muted-foreground">Learning</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {deck.cards.filter(c => c.status === 'mastered').length}
            </div>
            <div className="text-sm text-muted-foreground">Mastered</div>
          </CardContent>
        </Card>
      </div>

      {/* Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
        </CardHeader>
        <CardContent>
          {deck.cards.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No cards yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first flashcard to start learning
              </p>
              <Button onClick={openCreateDialog}>
                Add First Card
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Front</TableHead>
                    <TableHead>Back</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pronunciation</TableHead>
                    <TableHead>Media</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deck.cards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate">{card.front}</div>
                        {card.englishDefinition && (
                          <div className="text-xs text-muted-foreground truncate">
                            {card.englishDefinition}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate">{card.back}</div>
                        {card.vietnameseDefinition && (
                          <div className="text-xs text-muted-foreground truncate">
                            {card.vietnameseDefinition}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {card.pronunciationText && (
                          <div className="text-sm">{card.pronunciationText}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {card.frontImageUrl && (
                            <Badge variant="outline" className="text-xs">IMG</Badge>
                          )}
                          {card.audioUrl && (
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                       <TableCell className="text-right">
                         <div className="flex gap-1 justify-end">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => openViewDialog(card)}
                             title="View card"
                           >
                             <Eye className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => openEditDialog(card)}
                             title="Edit card"
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Card</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{card.front}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCard(card.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Card Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Card to "{deck.name}"</DialogTitle>
          </DialogHeader>
          
          <CardFormFields />

          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateCard} className="flex-1">
              Add Card
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          
          <CardFormFields />

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateCard} className="flex-1">
              Update Card
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flashcard Viewer Dialog */}
      <FlashcardViewer
        card={viewingCard}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingCard(null);
        }}
      />
    </div>
  );
};

export default DeckDetails;