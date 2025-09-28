-- Create decks table
CREATE TABLE public.decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  english_definition TEXT,
  vietnamese_definition TEXT,
  example TEXT,
  example_translation TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  audio_url TEXT,
  pronunciation_text TEXT,
  interval INTEGER NOT NULL DEFAULT 1,
  ease DECIMAL NOT NULL DEFAULT 2.5,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  repetitions INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create study sessions table
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  cards_studied INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table (global progress tracking)
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  total_cards_studied INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_study_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making all data public since no user auth)
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public access to decks" ON public.decks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to flashcards" ON public.flashcards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to study sessions" ON public.study_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access to user progress" ON public.user_progress FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_decks_updated_at
  BEFORE UPDATE ON public.decks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX idx_flashcards_due_date ON public.flashcards(due_date);
CREATE INDEX idx_flashcards_status ON public.flashcards(status);
CREATE INDEX idx_study_sessions_deck_id ON public.study_sessions(deck_id);
CREATE INDEX idx_study_sessions_date ON public.study_sessions(session_date);

-- Insert initial user progress record
INSERT INTO public.user_progress (id) VALUES (gen_random_uuid());