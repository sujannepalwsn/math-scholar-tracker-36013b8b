-- Migration to add header customization fields to centers table
ALTER TABLE IF EXISTS public.centers
ADD COLUMN IF NOT EXISTS header_overlay_color TEXT DEFAULT 'rgba(255, 255, 255, 0.9)',
ADD COLUMN IF NOT EXISTS header_overlay_opacity INTEGER DEFAULT 90,
ADD COLUMN IF NOT EXISTS header_font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS header_font_color TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS header_font_size TEXT DEFAULT 'normal';

-- Update existing records with default values if they are null
UPDATE public.centers
SET
  header_overlay_color = COALESCE(header_overlay_color, 'rgba(255, 255, 255, 0.9)'),
  header_overlay_opacity = COALESCE(header_overlay_opacity, 90),
  header_font_family = COALESCE(header_font_family, 'Inter'),
  header_font_color = COALESCE(header_font_color, '#1e293b'),
  header_font_size = COALESCE(header_font_size, 'normal');
