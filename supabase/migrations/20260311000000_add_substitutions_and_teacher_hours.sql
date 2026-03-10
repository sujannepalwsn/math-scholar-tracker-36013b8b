-- Add attendance boundary columns to teachers table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='expected_check_in') THEN
    ALTER TABLE public.teachers ADD COLUMN expected_check_in TIME DEFAULT '09:00:00';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teachers' AND column_name='expected_check_out') THEN
    ALTER TABLE public.teachers ADD COLUMN expected_check_out TIME DEFAULT '17:00:00';
  END IF;
END $$;

-- Create class_substitutions table for temporary assignments
CREATE TABLE IF NOT EXISTS public.class_substitutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.centers(id),
  period_schedule_id UUID NOT NULL REFERENCES public.period_schedules(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  substitute_teacher_id UUID NOT NULL REFERENCES public.teachers(id),
  original_teacher_id UUID REFERENCES public.teachers(id),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(period_schedule_id, date)
);

-- Enable RLS
ALTER TABLE public.class_substitutions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_substitutions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view substitutions of their center') THEN
        CREATE POLICY "Users can view substitutions of their center" ON public.class_substitutions
          FOR SELECT USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Center admins can manage substitutions') THEN
        CREATE POLICY "Center admins can manage substitutions" ON public.class_substitutions
          FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid() AND role = 'center'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Teachers can view substitutions assigned to them') THEN
        CREATE POLICY "Teachers can view substitutions assigned to them" ON public.class_substitutions
          FOR SELECT USING (substitute_teacher_id = (SELECT id FROM public.teachers WHERE user_id = auth.uid()));
    END IF;
END $$;

-- Add updated_at trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_class_substitutions_updated_at') THEN
        CREATE TRIGGER update_class_substitutions_updated_at
        BEFORE UPDATE ON public.class_substitutions
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
