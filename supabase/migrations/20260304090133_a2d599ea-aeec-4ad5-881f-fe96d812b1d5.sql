ALTER TABLE public.meetings 
  ADD COLUMN IF NOT EXISTS related_meeting_id uuid REFERENCES public.meetings(id) ON DELETE SET NULL;