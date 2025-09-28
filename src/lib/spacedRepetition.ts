import { Flashcard, DifficultyRating } from '@/types/flashcard';

// Spaced Repetition Algorithm based on SuperMemo 2
export function calculateNextReview(card: Flashcard, rating: DifficultyRating): Partial<Flashcard> {
  const now = new Date();
  let { interval, ease, repetitions } = card;

  if (rating === 'again') {
    // Reset to learning phase
    return {
      interval: 1,
      ease: Math.max(1.3, ease - 0.2),
      repetitions: 0,
      status: 'learning' as const,
      dueDate: new Date(now.getTime() + 10 * 60 * 1000).toISOString(), // 10 minutes
      lastReviewed: now.toISOString(),
    };
  }

  // Calculate new ease factor
  if (rating === 'hard') {
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === 'easy') {
    ease = ease + 0.15;
  }
  // 'good' rating keeps ease the same

  // Calculate new interval
  if (repetitions === 0) {
    interval = 1;
  } else if (repetitions === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * ease);
  }

  // Determine new status
  let status: Flashcard['status'] = 'review';
  if (repetitions >= 2 && interval >= 21) {
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
    return dueDate <= now;
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
  const review = cards.filter(card => new Date(card.dueDate) <= now && card.status === 'review').length;
  const mastered = cards.filter(card => card.status === 'mastered').length;

  return {
    total: cards.length,
    new: newCards,
    learning,
    review,
    mastered,
    dueToday: review + learning,
  };
}
