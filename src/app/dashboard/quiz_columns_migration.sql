-- Add quiz-related columns to cards table
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS multiple_choice_options JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS explanation TEXT;
