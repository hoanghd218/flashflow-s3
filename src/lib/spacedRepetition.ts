import { Flashcard, DifficultyRating } from '@/types/flashcard';

// Enhanced Spaced Repetition Algorithm based on SuperMemo 2
export function calculateNextReview(card: Flashcard, rating: DifficultyRating): Partial<Flashcard> {
  const now = new Date();
  let { interval, ease, repetitions } = card;

  if (rating === 'again') {
    // Reset to learning phase with shorter intervals for failed cards
    return {
      interval: 1,
      ease: Math.max(1.3, ease - 0.2),
      repetitions: 0,
      status: 'learning' as const,
      dueDate: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 minutes
      lastReviewed: now.toISOString(),
    };
  }

  // Calculate new ease factor based on performance
  const originalEase = ease;
  if (rating === 'hard') {
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === 'easy') {
    ease = Math.min(2.5, ease + 0.15); // Cap ease factor to prevent overly long intervals
  }
  // 'good' rating keeps ease the same

  // Enhanced interval calculation
  if (repetitions === 0) {
    interval = 1; // First review: 1 day
  } else if (repetitions === 1) {
    interval = rating === 'easy' ? 4 : 6; // Second review: 4-6 days based on difficulty
  } else {
    // Apply ease factor with some randomization to avoid cramming
    const baseInterval = Math.round(interval * ease);
    const variation = Math.floor(baseInterval * 0.1); // ±10% variation
    interval = baseInterval + Math.floor(Math.random() * (variation * 2 + 1)) - variation;
    interval = Math.max(1, interval); // Minimum 1 day
  }

  // Determine new status based on performance and interval
  let status: Flashcard['status'] = 'learning';
  if (repetitions >= 1 && interval >= 6) {
    status = 'review';
  }
  if (repetitions >= 3 && interval >= 21 && ease >= 2.0) {
    status = 'mastered';
  }

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    interval,
    ease,
    repetitions: repetitions + 1,
    status,
    dueDate: dueDate.toISOString(),
    lastReviewed: now.toISOString(),
  };
}

export function getCardsForReview(cards: Flashcard[]): Flashcard[] {
  const now = new Date();
  return cards.filter(card => {
    const dueDate = new Date(card.dueDate);
    return dueDate <= now && (card.status === 'learning' || card.status === 'review');
  });
}

export function getNewCards(cards: Flashcard[], limit: number = 10): Flashcard[] {
  return cards
    .filter(card => card.status === 'new')
    .slice(0, limit);
}

export function getDeckStats(cards: Flashcard[]) {
  const now = new Date();
  const newCards = cards.filter(card => card.status === 'new').length;
  const learning = cards.filter(card => card.status === 'learning').length;
  const review = cards.filter(card => {
    const dueDate = new Date(card.dueDate);
    return dueDate <= now && card.status === 'review';
  }).length;
  const mastered = cards.filter(card => card.status === 'mastered').length;
  
  // Calculate overdue cards (cards that should have been reviewed earlier)
  const overdue = cards.filter(card => {
    const dueDate = new Date(card.dueDate);
    const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 0 && (card.status === 'review' || card.status === 'learning');
  }).length;

  return {
    total: cards.length,
    new: newCards,
    learning,
    review,
    mastered,
    overdue,
    dueToday: review + learning,
  };
}

// Get cards scheduled for specific day
export function getCardsDueOnDate(cards: Flashcard[], date: Date): Flashcard[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return cards.filter(card => {
    const dueDate = new Date(card.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === targetDate.getTime();
  });
}

// Calculate retention rate for a deck
export function calculateRetentionRate(cards: Flashcard[]): number {
  const reviewedCards = cards.filter(card => card.lastReviewed);
  if (reviewedCards.length === 0) return 0;
  
  const masteredCards = cards.filter(card => card.status === 'mastered' || card.status === 'review');
  return Math.round((masteredCards.length / reviewedCards.length) * 100);
}

// Get upcoming review schedule
export function getUpcomingReviews(cards: Flashcard[], days: number = 7): Array<{date: string, count: number}> {
  const schedule = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dueCards = getCardsDueOnDate(cards, date);
    
    schedule.push({
      date: date.toISOString().split('T')[0],
      count: dueCards.length
    });
  }
  
  return schedule;
}

// Check if a card is overdue
export function isCardOverdue(card: Flashcard): boolean {
  const now = new Date();
  const dueDate = new Date(card.dueDate);
  return now > dueDate && (card.status === 'learning' || card.status === 'review');
}

// Get difficulty rating description
export function getDifficultyDescription(rating: DifficultyRating): string {
  switch (rating) {
    case 'again':
      return 'Forgot completely - Will see again in 10 minutes';
    case 'hard':
      return 'Difficult to remember - Shorter interval';
    case 'good':
      return 'Remembered correctly - Normal interval';
    case 'easy':
      return 'Very easy - Longer interval';
    default:
      return '';
  }
}
