-- Migration to add header customization fields to centers table
ALTER TABLE IF EXISTS public.centers
ADD COLUMN IF NOT EXISTS header_overlay_color TEXT DEFAULT 'rgba(255, 255, 255, 0.9)',
ADD COLUMN IF NOT EXISTS header_overlay_opacity INTEGER DEFAULT 90;

-- Update existing records with default values if they are null
UPDATE public.centers
SET
  header_overlay_color = COALESCE(header_overlay_color, 'rgba(255, 255, 255, 0.9)'),
  header_overlay_opacity = COALESCE(header_overlay_opacity, 90);
