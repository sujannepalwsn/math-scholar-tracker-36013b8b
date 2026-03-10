-- Consolidate Leave Management schema to ensure robustness
-- This migration handles both fresh installs and updates from partially applied states

-- 1. Ensure leave_categories table exists
CREATE TABLE IF NOT EXISTS public.leave_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID, -- Deliberately nullable for global categories
  name TEXT NOT NULL,
  applicable_to TEXT NOT NULL DEFAULT 'both' CHECK (applicable_to IN ('student', 'teacher', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_center FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE CASCADE
);

-- Robustly ensure column constraints and missing columns
ALTER TABLE public.leave_categories ALTER COLUMN center_id DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='leave_categories' AND column_name='applicable_to') THEN
        ALTER TABLE public.leave_categories ADD COLUMN applicable_to TEXT NOT NULL DEFAULT 'both' CHECK (applicable_to IN ('student', 'teacher', 'both'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='leave_categories' AND column_name='is_active') THEN
        ALTER TABLE public.leave_categories ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Ensure leave_applications table exists
CREATE TABLE IF NOT EXISTS public.leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.leave_categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT date_range_check CHECK (end_date >= start_date)
);

-- 3. Enable RLS
ALTER TABLE public.leave_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for leave_categories
DROP POLICY IF EXISTS "Users can view leave categories" ON public.leave_categories;
CREATE POLICY "Users can view leave categories" ON public.leave_categories
  FOR SELECT USING (center_id IS NULL OR is_same_center(center_id));

DROP POLICY IF EXISTS "Center admins can manage leave categories" ON public.leave_categories;
CREATE POLICY "Center admins can manage leave categories" ON public.leave_categories
  FOR ALL USING (is_same_center(center_id));

-- 5. RLS Policies for leave_applications
DROP POLICY IF EXISTS "Users can view their own leave applications" ON public.leave_applications;
CREATE POLICY "Users can view their own leave applications" ON public.leave_applications
  FOR SELECT USING (user_id = auth.uid() OR is_same_center(center_id));

DROP POLICY IF EXISTS "Users can submit leave applications" ON public.leave_applications;
CREATE POLICY "Users can submit leave applications" ON public.leave_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Center admins can update leave applications" ON public.leave_applications;
CREATE POLICY "Center admins can update leave applications" ON public.leave_applications
  FOR UPDATE USING (is_same_center(center_id));

-- 6. Add updated_at triggers
DROP TRIGGER IF EXISTS update_leave_categories_updated_at ON public.leave_categories;
CREATE TRIGGER update_leave_categories_updated_at BEFORE UPDATE ON public.leave_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_leave_applications_updated_at ON public.leave_applications;
CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Function to handle auto-attendance on leave approval
CREATE OR REPLACE FUNCTION public.handle_leave_approval()
RETURNS TRIGGER AS $$
DECLARE
  curr_date DATE;
BEGIN
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    curr_date := NEW.start_date;
    WHILE curr_date <= NEW.end_date LOOP
      -- If it's a teacher leave
      IF NEW.teacher_id IS NOT NULL THEN
        INSERT INTO public.teacher_attendance (teacher_id, center_id, date, status, notes)
        VALUES (NEW.teacher_id, NEW.center_id, curr_date, 'leave', 'Approved Leave: ' || COALESCE(NEW.reason, ''))
        ON CONFLICT (teacher_id, date) DO UPDATE
        SET status = 'leave', notes = 'Approved Leave: ' || COALESCE(NEW.reason, '');
      END IF;

      -- If it's a student leave
      IF NEW.student_id IS NOT NULL THEN
        INSERT INTO public.attendance (student_id, center_id, date, status, remarks)
        VALUES (NEW.student_id, NEW.center_id, curr_date, 'absent', 'Approved Leave: ' || COALESCE(NEW.reason, ''))
        ON CONFLICT (student_id, date) DO UPDATE
        SET status = 'absent', remarks = 'Approved Leave: ' || COALESCE(NEW.reason, '');
      END IF;

      curr_date := curr_date + 1;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_leave_approval ON public.leave_applications;
CREATE TRIGGER on_leave_approval
  AFTER UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_leave_approval();

-- 8. Create storage bucket for leave documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-documents', 'leave-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for leave documents
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'leave-documents');
DROP POLICY IF EXISTS "Authenticated users can upload leave documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload leave documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'leave-documents' AND auth.role() = 'authenticated');

-- 9. Insert default global categories
INSERT INTO public.leave_categories (name, center_id, applicable_to)
SELECT d.name, d.center_id, d.applicable_to
FROM (
  VALUES
    ('Sick Leave', NULL::UUID, 'both'),
    ('Casual Leave', NULL::UUID, 'both'),
    ('Vacation', NULL::UUID, 'both'),
    ('Emergency Leave', NULL::UUID, 'both')
) AS d(name, center_id, applicable_to)
WHERE NOT EXISTS (
  SELECT 1 FROM public.leave_categories lc
  WHERE lc.name = d.name AND lc.center_id IS NULL
);
