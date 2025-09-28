export interface Flashcard {
  id: string;
  front: string;
  back: string;
  example?: string;
  imageUrl?: string;
  audioUrl?: string;
  // Spaced repetition data
  interval: number;
  ease: number;
  dueDate: string;
  repetitions: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  lastReviewed?: string;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
  color?: string;
}

export interface StudySession {
  deckId: string;
  cardsStudied: number;
  correctAnswers: number;
  timeSpent: number; // in minutes
  date: string;
}

export interface UserProgress {
  totalCardsStudied: number;
  streakDays: number;
  lastStudyDate?: string;
  sessionsHistory: StudySession[];
}

export type DifficultyRating = 'again' | 'hard' | 'good' | 'easy';