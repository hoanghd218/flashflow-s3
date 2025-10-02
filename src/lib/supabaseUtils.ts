import { supabase } from '@/integrations/supabase/client';
import { Deck, Flashcard, StudySession, UserProgress, DifficultyRating } from '@/types/flashcard';

// Database types (matching Supabase schema)
export interface DbDeck {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFlashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  english_definition: string | null;
  vietnamese_definition: string | null;
  example: string | null;
  example_translation: string | null;
  front_image_url: string | null;
  back_image_url: string | null;
  audio_url: string | null;
  pronunciation_text: string | null;
  interval: number;
  ease: number;
  due_date: string;
  repetitions: number;
  status: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStudySession {
  id: string;
  deck_id: string;
  cards_studied: number;
  correct_answers: number;
  time_spent: number;
  session_date: string;
}

export interface DbUserProgress {
  id: string;
  total_cards_studied: number;
  streak_days: number;
  last_study_date: string | null;
  created_at: string;
  updated_at: string;
}

// Transform functions
function transformDbDeck(dbDeck: DbDeck): Deck {
  return {
    id: dbDeck.id,
    name: dbDeck.name,
    description: dbDeck.description || undefined,
    color: dbDeck.color || undefined,
    cards: [], // Will be populated separately
    createdAt: dbDeck.created_at,
    updatedAt: dbDeck.updated_at,
  };
}

function transformDbFlashcard(dbCard: DbFlashcard): Flashcard {
  return {
    id: dbCard.id,
    front: dbCard.front,
    back: dbCard.back,
    englishDefinition: dbCard.english_definition || undefined,
    vietnameseDefinition: dbCard.vietnamese_definition || undefined,
    example: dbCard.example || undefined,
    exampleTranslation: dbCard.example_translation || undefined,
    frontImageUrl: dbCard.front_image_url || undefined,
    backImageUrl: dbCard.back_image_url || undefined,
    audioUrl: dbCard.audio_url || undefined,
    pronunciationText: dbCard.pronunciation_text || undefined,
    interval: dbCard.interval,
    ease: dbCard.ease,
    dueDate: dbCard.due_date,
    repetitions: dbCard.repetitions,
    status: dbCard.status as Flashcard['status'],
    lastReviewed: dbCard.last_reviewed || undefined,
  };
}

// ---------- DECK OPERATIONS ----------

export async function getDecks(): Promise<Deck[]> {
  const { data: decksData, error: decksError } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (decksError) throw decksError;

  const decks: Deck[] = [];
  
  for (const dbDeck of decksData || []) {
    const { data: cardsData, error: cardsError } = await supabase
      .from('flashcards')
      .select('*')
      .eq('deck_id', dbDeck.id);

    if (cardsError) throw cardsError;

    const deck = transformDbDeck(dbDeck);
    deck.cards = (cardsData || []).map(transformDbFlashcard);
    decks.push(deck);
  }

  return decks;
}

export async function getDeck(deckId: string): Promise<Deck | null> {
  const { data: deckData, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (deckError) {
    if (deckError.code === 'PGRST116') return null; // Not found
    throw deckError;
  }

  const { data: cardsData, error: cardsError } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId);

  if (cardsError) throw cardsError;

  const deck = transformDbDeck(deckData);
  deck.cards = (cardsData || []).map(transformDbFlashcard);
  
  return deck;
}

export async function createDeck(name: string, description?: string, color?: string): Promise<Deck> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('decks')
    .insert({
      name,
      description: description || null,
      color: color || null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  const deck = transformDbDeck(data);
  deck.cards = [];
  return deck;
}

export async function updateDeck(deckId: string, updates: Partial<Pick<Deck, 'name' | 'description' | 'color'>>): Promise<void> {
  const { error } = await supabase
    .from('decks')
    .update({
      name: updates.name,
      description: updates.description || null,
      color: updates.color || null,
    })
    .eq('id', deckId);

  if (error) throw error;
}

export async function deleteDeck(deckId: string): Promise<void> {
  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (error) throw error;
}

// ---------- FLASHCARD OPERATIONS ----------

export async function createFlashcard(deckId: string, cardData: Partial<Flashcard>): Promise<Flashcard> {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      deck_id: deckId,
      front: cardData.front || '',
      back: cardData.back || '',
      english_definition: cardData.englishDefinition || null,
      vietnamese_definition: cardData.vietnameseDefinition || null,
      example: cardData.example || null,
      example_translation: cardData.exampleTranslation || null,
      front_image_url: cardData.frontImageUrl || null,
      back_image_url: cardData.backImageUrl || null,
      audio_url: cardData.audioUrl || null,
      pronunciation_text: cardData.pronunciationText || null,
    })
    .select()
    .single();

  if (error) throw error;
  
  return transformDbFlashcard(data);
}

export async function updateFlashcard(cardId: string, updates: Partial<Flashcard>): Promise<void> {
  const dbUpdates: any = {};
  
  if (updates.front !== undefined) dbUpdates.front = updates.front;
  if (updates.back !== undefined) dbUpdates.back = updates.back;
  if (updates.englishDefinition !== undefined) dbUpdates.english_definition = updates.englishDefinition;
  if (updates.vietnameseDefinition !== undefined) dbUpdates.vietnamese_definition = updates.vietnameseDefinition;
  if (updates.example !== undefined) dbUpdates.example = updates.example;
  if (updates.exampleTranslation !== undefined) dbUpdates.example_translation = updates.exampleTranslation;
  if (updates.frontImageUrl !== undefined) dbUpdates.front_image_url = updates.frontImageUrl;
  if (updates.backImageUrl !== undefined) dbUpdates.back_image_url = updates.backImageUrl;
  if (updates.audioUrl !== undefined) dbUpdates.audio_url = updates.audioUrl;
  if (updates.pronunciationText !== undefined) dbUpdates.pronunciation_text = updates.pronunciationText;
  if (updates.interval !== undefined) dbUpdates.interval = updates.interval;
  if (updates.ease !== undefined) dbUpdates.ease = updates.ease;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.repetitions !== undefined) dbUpdates.repetitions = updates.repetitions;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.lastReviewed !== undefined) dbUpdates.last_reviewed = updates.lastReviewed;

  const { error } = await supabase
    .from('flashcards')
    .update(dbUpdates)
    .eq('id', cardId);

  if (error) throw error;
}

export async function deleteFlashcard(cardId: string): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

// ---------- STUDY OPERATIONS ----------

export async function getCardsForReview(): Promise<Flashcard[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .lte('due_date', now)
    .order('due_date');

  if (error) throw error;
  
  return (data || []).map(transformDbFlashcard);
}

export async function getNewCards(limit: number = 10): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('status', 'new')
    .limit(limit);

  if (error) throw error;
  
  return (data || []).map(transformDbFlashcard);
}

export async function createStudySession(sessionData: Omit<StudySession, 'date'> & { date?: string }): Promise<void> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('study_sessions')
    .insert({
      deck_id: sessionData.deckId,
      cards_studied: sessionData.cardsStudied,
      correct_answers: sessionData.correctAnswers,
      time_spent: sessionData.timeSpent,
      session_date: sessionData.date || new Date().toISOString(),
      user_id: user.id,
    });

  if (error) throw error;
}

// ---------- USER PROGRESS OPERATIONS ----------

export async function getUserProgress(): Promise<UserProgress> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no progress exists, create one for the current user
    const { data: newData, error: createError } = await supabase
      .from('user_progress')
      .insert({ user_id: user.id })
      .select()
      .single();
    
    if (createError) throw createError;
    
    return {
      totalCardsStudied: newData.total_cards_studied,
      streakDays: newData.streak_days,
      lastStudyDate: newData.last_study_date || undefined,
      sessionsHistory: [],
    };
  }

  // Get sessions history
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('study_sessions')
    .select('*')
    .order('session_date', { ascending: false });

  if (sessionsError) throw sessionsError;

  const sessionsHistory: StudySession[] = (sessionsData || []).map((session: DbStudySession) => ({
    deckId: session.deck_id,
    cardsStudied: session.cards_studied,
    correctAnswers: session.correct_answers,
    timeSpent: session.time_spent,
    date: session.session_date,
  }));

  return {
    totalCardsStudied: data.total_cards_studied,
    streakDays: data.streak_days,
    lastStudyDate: data.last_study_date || undefined,
    sessionsHistory,
  };
}

export async function updateUserProgress(updates: Partial<UserProgress>): Promise<void> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const dbUpdates: any = {};
  
  if (updates.totalCardsStudied !== undefined) dbUpdates.total_cards_studied = updates.totalCardsStudied;
  if (updates.streakDays !== undefined) dbUpdates.streak_days = updates.streakDays;
  if (updates.lastStudyDate !== undefined) dbUpdates.last_study_date = updates.lastStudyDate;

  const { error } = await supabase
    .from('user_progress')
    .update(dbUpdates)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ---------- SPACED REPETITION ----------

export async function updateCardReview(cardId: string, rating: DifficultyRating): Promise<void> {
  // Get current card data
  const { data: cardData, error: getError } = await supabase
    .from('flashcards')
    .select('*')
    .eq('id', cardId)
    .single();

  if (getError) throw getError;

  const card = transformDbFlashcard(cardData);
  
  // Calculate next review using existing spaced repetition logic
  const now = new Date();
  let { interval, ease, repetitions } = card;

  if (rating === 'again') {
    // Reset to learning phase
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    repetitions = 0;
    const dueDate = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
    
    await updateFlashcard(cardId, {
      interval,
      ease,
      repetitions,
      status: 'learning',
      dueDate: dueDate.toISOString(),
      lastReviewed: now.toISOString(),
    });
    return;
  }

  // Calculate new ease factor
  if (rating === 'hard') {
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === 'easy') {
    ease = ease + 0.15;
  }

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

  await updateFlashcard(cardId, {
    interval,
    ease,
    repetitions: repetitions + 1,
    status,
    dueDate: dueDate.toISOString(),
    lastReviewed: now.toISOString(),
  });
}