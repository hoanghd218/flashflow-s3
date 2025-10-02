-- Add user_id to decks table
ALTER TABLE public.decks 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to study_sessions table
ALTER TABLE public.study_sessions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing public policies
DROP POLICY IF EXISTS "Public access to decks" ON public.decks;
DROP POLICY IF EXISTS "Public access to flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Public access to study sessions" ON public.study_sessions;

-- Create user-specific policies for decks
CREATE POLICY "Users can view their own decks"
ON public.decks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
ON public.decks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
ON public.decks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
ON public.decks
FOR DELETE
USING (auth.uid() = user_id);

-- Create user-specific policies for flashcards (based on deck ownership)
CREATE POLICY "Users can view flashcards in their decks"
ON public.flashcards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create flashcards in their decks"
ON public.flashcards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update flashcards in their decks"
ON public.flashcards
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete flashcards in their decks"
ON public.flashcards
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.decks
    WHERE decks.id = flashcards.deck_id
    AND decks.user_id = auth.uid()
  )
);

-- Create user-specific policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
ON public.study_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
ON public.study_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
ON public.study_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
ON public.study_sessions
FOR DELETE
USING (auth.uid() = user_id);