-- Create a table to track individual card progress per user
CREATE TABLE IF NOT EXISTS public.user_card_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE,
  deck_id UUID REFERENCES public.decks(id) ON DELETE CASCADE,
  consecutive_correct INTEGER DEFAULT 0,
  last_answered_correct BOOLEAN,
  status TEXT DEFAULT 'new', -- 'new', 'learning', 'almost_done', 'mastered'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_card_progress_user_deck ON public.user_card_progress(user_id, deck_id);
