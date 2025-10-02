-- Add user_id column to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing rows to have a null user_id (will need manual assignment)
-- For new apps, this would be handled by the application

-- Drop the existing public access policy
DROP POLICY IF EXISTS "Public access to user progress" ON public.user_progress;

-- Create user-specific RLS policies
CREATE POLICY "Users can view their own progress"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
ON public.user_progress
FOR DELETE
USING (auth.uid() = user_id);