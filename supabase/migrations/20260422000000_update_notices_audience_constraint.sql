-- Migration: Update notices target_audience check constraint
-- Date: 2026-04-22

ALTER TABLE public.notices DROP CONSTRAINT IF EXISTS notices_target_audience_check;
ALTER TABLE public.notices ADD CONSTRAINT notices_target_audience_check CHECK (target_audience IN ('All', 'Teachers', 'Students', 'Parents', 'Grade', 'Center'));
