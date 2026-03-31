-- Add package_type to centers
ALTER TABLE public.centers ADD COLUMN IF NOT EXISTS package_type text DEFAULT 'Premium';

-- Add parent_portal to center_feature_permissions
ALTER TABLE public.center_feature_permissions ADD COLUMN IF NOT EXISTS parent_portal boolean DEFAULT true;

-- Add parent_portal to teacher_feature_permissions
ALTER TABLE public.teacher_feature_permissions ADD COLUMN IF NOT EXISTS parent_portal boolean DEFAULT false;

-- Update existing records to have 'Premium' as default package if not set
UPDATE public.centers SET package_type = 'Premium' WHERE package_type IS NULL;
