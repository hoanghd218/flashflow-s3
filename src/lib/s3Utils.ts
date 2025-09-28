import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { Deck, Flashcard, DifficultyRating } from '@/types/flashcard';

const REGION = "ap-southeast-1"; // region bucket S3
const BUCKET = "anki-data-bucket"; // thay bằng tên bucket thật
const DATA_KEY = "flashmind-data.json"; // file data lưu trữ

// ⚠️ SECURITY WARNING: In production, these credentials should be handled by a backend service
// Never expose AWS credentials in client-side code in production
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
  },
});

type AppData = {
  decks: Deck[];
  lastSync: string;
};

// --------------------- Core Data Functions ---------------------

async function loadData(): Promise<AppData> {
  try {
    const res = await s3.send(new GetObjectCommand({ 
      Bucket: BUCKET, 
      Key: DATA_KEY 
    }));
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : { decks: [], lastSync: new Date().toISOString() };
  } catch (err: any) {
    if (err.name === "NoSuchKey") {
      return { decks: [], lastSync: new Date().toISOString() };
    }
    console.error("Error loading data from S3:", err);
    throw new Error("Failed to load data from S3");
  }
}

async function saveData(data: AppData): Promise<void> {
  try {
    const dataToSave = {
      ...data,
      lastSync: new Date().toISOString()
    };
    
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: DATA_KEY,
        Body: JSON.stringify(dataToSave, null, 2),
        ContentType: "application/json",
      })
    );
  } catch (err) {
    console.error("Error saving data to S3:", err);
    throw new Error("Failed to save data to S3");
  }
}

// --------------------- Deck Management ---------------------

export async function getDecks(): Promise<Deck[]> {
  const data = await loadData();
  return data.decks;
}

export async function getDeck(deckId: string): Promise<Deck | null> {
  const data = await loadData();
  return data.decks.find(deck => deck.id === deckId) || null;
}

export async function createDeck(name: string, description?: string, color?: string): Promise<Deck> {
  const data = await loadData();
  
  const newDeck: Deck = {
    id: uuidv4(),
    name,
    description,
    cards: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color
  };
  
  data.decks.push(newDeck);
  await saveData(data);
  return newDeck;
}

export async function updateDeck(deckId: string, updates: Partial<Omit<Deck, 'id' | 'createdAt'>>): Promise<Deck> {
  const data = await loadData();
  const deckIndex = data.decks.findIndex(deck => deck.id === deckId);
  
  if (deckIndex === -1) {
    throw new Error("Deck not found");
  }
  
  data.decks[deckIndex] = {
    ...data.decks[deckIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await saveData(data);
  return data.decks[deckIndex];
}

export async function deleteDeck(deckId: string): Promise<void> {
  const data = await loadData();
  data.decks = data.decks.filter(deck => deck.id !== deckId);
  await saveData(data);
}

// --------------------- Card Management ---------------------

export async function addCard(deckId: string, cardData: Omit<Flashcard, 'id' | 'interval' | 'ease' | 'dueDate' | 'repetitions' | 'status' | 'lastReviewed'>): Promise<Flashcard> {
  const data = await loadData();
  const deck = data.decks.find(d => d.id === deckId);
  
  if (!deck) {
    throw new Error("Deck not found");
  }

  const newCard: Flashcard = {
    ...cardData,
    id: uuidv4(),
    interval: 1,
    ease: 2.5,
    dueDate: new Date().toISOString(),
    repetitions: 0,
    status: 'new'
  };

  deck.cards.push(newCard);
  deck.updatedAt = new Date().toISOString();
  await saveData(data);
  return newCard;
}

export async function updateCard(deckId: string, cardId: string, updates: Partial<Flashcard>): Promise<Flashcard> {
  const data = await loadData();
  const deck = data.decks.find(d => d.id === deckId);
  
  if (!deck) {
    throw new Error("Deck not found");
  }
  
  const cardIndex = deck.cards.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found");
  }
  
  deck.cards[cardIndex] = { ...deck.cards[cardIndex], ...updates };
  deck.updatedAt = new Date().toISOString();
  await saveData(data);
  return deck.cards[cardIndex];
}

export async function deleteCard(deckId: string, cardId: string): Promise<void> {
  const data = await loadData();
  const deck = data.decks.find(d => d.id === deckId);
  
  if (!deck) {
    throw new Error("Deck not found");
  }
  
  deck.cards = deck.cards.filter(card => card.id !== cardId);
  deck.updatedAt = new Date().toISOString();
  await saveData(data);
}

// --------------------- Study & Review Functions ---------------------

export async function getCardsForReview(): Promise<{ deckId: string; cards: Flashcard[] }[]> {
  const data = await loadData();
  const now = new Date();
  
  return data.decks.map(deck => ({
    deckId: deck.id,
    cards: deck.cards.filter(card => new Date(card.dueDate) <= now)
  })).filter(result => result.cards.length > 0);
}

export async function getNewCards(limit: number = 10): Promise<{ deckId: string; cards: Flashcard[] }[]> {
  const data = await loadData();
  
  return data.decks.map(deck => ({
    deckId: deck.id,
    cards: deck.cards.filter(card => card.status === 'new').slice(0, limit)
  })).filter(result => result.cards.length > 0);
}

export async function reviewCard(deckId: string, cardId: string, rating: DifficultyRating): Promise<Flashcard> {
  const data = await loadData();
  const deck = data.decks.find(d => d.id === deckId);
  
  if (!deck) {
    throw new Error("Deck not found");
  }
  
  const card = deck.cards.find(c => c.id === cardId);
  if (!card) {
    throw new Error("Card not found");
  }

  // Apply spaced repetition algorithm
  const now = new Date();
  let { interval, ease, repetitions } = card;
  
  if (rating === 'again') {
    // Reset to learning phase
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    repetitions = 0;
    card.status = 'learning';
    card.dueDate = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes
  } else {
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

    repetitions += 1;

    // Determine new status
    if (repetitions >= 2 && interval >= 21) {
      card.status = 'mastered';
    } else {
      card.status = 'review';
    }

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + interval);
    card.dueDate = dueDate.toISOString();
  }

  // Update card
  card.interval = interval;
  card.ease = ease;
  card.repetitions = repetitions;
  card.lastReviewed = now.toISOString();
  
  deck.updatedAt = now.toISOString();
  await saveData(data);
  return card;
}

// --------------------- File Upload Functions ---------------------

export async function uploadFile(file: File, folder: 'images' | 'audio' = 'images'): Promise<string> {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: fileName,
        Body: file,
        ContentType: file.type,
      })
    );
    
    // Return the S3 URL
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fileName}`;
  } catch (err) {
    console.error("Error uploading file to S3:", err);
    throw new Error("Failed to upload file to S3");
  }
}

// --------------------- Statistics ---------------------

export async function getDeckStats(deckId: string) {
  const deck = await getDeck(deckId);
  if (!deck) return null;

  const now = new Date();
  const newCards = deck.cards.filter(card => card.status === 'new').length;
  const learning = deck.cards.filter(card => card.status === 'learning').length;
  const review = deck.cards.filter(card => 
    new Date(card.dueDate) <= now && card.status === 'review'
  ).length;
  const mastered = deck.cards.filter(card => card.status === 'mastered').length;

  return {
    total: deck.cards.length,
    new: newCards,
    learning,
    review,
    mastered,
    dueToday: review + learning,
  };
}

// --------------------- Sync Functions ---------------------

export async function syncWithLocalStorage(): Promise<void> {
  try {
    // Get data from S3
    const s3Data = await loadData();
    
    // Get data from localStorage
    const localData = localStorage.getItem('flashmind-decks');
    const localDecks: Deck[] = localData ? JSON.parse(localData) : [];
    
    // Simple merge strategy: use the most recently updated decks
    const mergedDecks = [...s3Data.decks];
    
    for (const localDeck of localDecks) {
      const s3DeckIndex = mergedDecks.findIndex(deck => deck.id === localDeck.id);
      
      if (s3DeckIndex === -1) {
        // Deck only exists locally, add to S3
        mergedDecks.push(localDeck);
      } else {
        // Deck exists in both, use the most recent
        const s3Deck = mergedDecks[s3DeckIndex];
        if (new Date(localDeck.updatedAt) > new Date(s3Deck.updatedAt)) {
          mergedDecks[s3DeckIndex] = localDeck;
        }
      }
    }
    
    // Save merged data to S3
    await saveData({ decks: mergedDecks, lastSync: new Date().toISOString() });
    
    // Update localStorage
    localStorage.setItem('flashmind-decks', JSON.stringify(mergedDecks));
    
  } catch (err) {
    console.error("Error syncing data:", err);
    throw new Error("Failed to sync data");
  }
}
