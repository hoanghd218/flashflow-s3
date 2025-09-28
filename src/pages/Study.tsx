import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, CheckCircle } from 'lucide-react';
import { Deck, Flashcard, DifficultyRating } from '@/types/flashcard';
import { getNewCards } from '@/lib/spacedRepetition';
import EnhancedFlashCard from '@/components/EnhancedFlashCard';
import { toast } from '@/hooks/use-toast';
import { getDeck, getCardsForReview, updateCardReview, createStudySession } from '@/lib/supabaseUtils';

const Study = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    studied: 0,
    correct: 0,
    startTime: new Date()
  });

  useEffect(() => {
    if (!deckId) return;

    const loadStudySession = async () => {
      try {
        const foundDeck = await getDeck(deckId);
        
        if (foundDeck) {
          setDeck(foundDeck);
          
          // Get cards for study (due for review + new cards)
          const reviewCards = await getCardsForReview();
          const deckReviewCards = reviewCards.filter(card => 
            foundDeck.cards.some(deckCard => deckCard.id === card.id)
          );
          const newCards = getNewCards(foundDeck.cards, 10);
          const cardsToStudy = [...deckReviewCards, ...newCards];
          
          if (cardsToStudy.length === 0) {
            toast({
              title: "All caught up!",
              description: "No cards due for review right now. Come back later!",
            });
            navigate('/decks');
            return;
          }
          
          setStudyCards(cardsToStudy);
        } else {
          navigate('/decks');
        }
      } catch (error) {
        console.error('Error loading study session:', error);
        toast({
          title: "Error",
          description: "Failed to load study session",
          variant: "destructive"
        });
        navigate('/decks');
      }
    };

    loadStudySession();
  }, [deckId, navigate]);

  const handleCardRate = async (rating: DifficultyRating) => {
    if (!deck || !studyCards[currentCardIndex]) return;

    const currentCard = studyCards[currentCardIndex];
    
    try {
      // Update card in Supabase
      await updateCardReview(currentCard.id, rating);

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        studied: prev.studied + 1,
        correct: prev.correct + (rating === 'good' || rating === 'easy' ? 1 : 0)
      }));

      // Move to next card or finish session
      if (currentCardIndex < studyCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        finishSession();
      }
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error",
        description: "Failed to update card progress",
        variant: "destructive"
      });
    }
  };

  const finishSession = async () => {
    const sessionDuration = Math.round((new Date().getTime() - sessionStats.startTime.getTime()) / 60000);
    
    try {
      // Save study session to Supabase
      if (deck) {
        await createStudySession({
          deckId: deck.id,
          cardsStudied: sessionStats.studied,
          correctAnswers: sessionStats.correct,
          timeSpent: sessionDuration
        });
      }
      
      toast({
        title: "Session Complete! 🎉",
        description: `Studied ${sessionStats.studied} cards in ${sessionDuration} minutes`,
      });
    } catch (error) {
      console.error('Error saving study session:', error);
      toast({
        title: "Session Complete! 🎉",
        description: `Studied ${sessionStats.studied} cards in ${sessionDuration} minutes`,
      });
    }
    
    navigate('/decks');
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isFlipped) {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(true);
      }
    } else {
      switch (e.key) {
        case '1':
          handleCardRate('again');
          break;
        case '2':
          handleCardRate('hard');
          break;
        case '3':
          handleCardRate('good');
          break;
        case '4':
          handleCardRate('easy');
          break;
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFlipped, currentCardIndex]);

  if (!deck || studyCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading study session...</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = studyCards[currentCardIndex];
  const progress = ((currentCardIndex) / studyCards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/decks')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Decks
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-semibold">{deck.name}</h1>
          <p className="text-sm text-muted-foreground">
            Card {currentCardIndex + 1} of {studyCards.length}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium">{sessionStats.studied}/{studyCards.length}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Enhanced Flashcard with Spaced Repetition */}
      <EnhancedFlashCard
        card={currentCard}
        onRate={handleCardRate}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
      />

      {/* Session Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span>Accuracy: {sessionStats.studied > 0 ? Math.round((sessionStats.correct / sessionStats.studied) * 100) : 0}%</span>
            </div>
            <span className="text-muted-foreground">
              {Math.round((new Date().getTime() - sessionStats.startTime.getTime()) / 60000)} min
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Study;