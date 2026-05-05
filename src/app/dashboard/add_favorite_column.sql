-- Add is_favorite column to decks table
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
