-- Add custom header configuration field to centers table
ALTER TABLE public.centers
ADD COLUMN IF NOT EXISTS header_config JSONB;

-- Comment for clarity
COMMENT ON COLUMN public.centers.header_config IS 'Stores dynamic drag-and-drop header layout configuration (elements, height, width, grid settings)';
