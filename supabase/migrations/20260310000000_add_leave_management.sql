-- Create leave_categories table
CREATE TABLE public.leave_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.centers(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_applications table
CREATE TABLE public.leave_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  center_id UUID NOT NULL REFERENCES public.centers(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  student_id UUID REFERENCES public.students(id),
  teacher_id UUID REFERENCES public.teachers(id),
  category_id UUID REFERENCES public.leave_categories(id),
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

-- Enable RLS
ALTER TABLE public.leave_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_categories
CREATE POLICY "Users can view leave categories of their center" ON public.leave_categories
  FOR SELECT USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Center admins can manage leave categories" ON public.leave_categories
  FOR ALL USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid() AND role = 'center'));

-- RLS Policies for leave_applications
CREATE POLICY "Users can view their own leave applications" ON public.leave_applications
  FOR SELECT USING (user_id = auth.uid() OR center_id = (SELECT center_id FROM public.users WHERE id = auth.uid() AND role = 'center'));

CREATE POLICY "Users can submit leave applications" ON public.leave_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Center admins can update leave applications" ON public.leave_applications
  FOR UPDATE USING (center_id = (SELECT center_id FROM public.users WHERE id = auth.uid() AND role = 'center'));

-- Add updated_at triggers
CREATE TRIGGER update_leave_categories_updated_at BEFORE UPDATE ON public.leave_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leave_applications_updated_at BEFORE UPDATE ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle auto-attendance on leave approval
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

CREATE TRIGGER on_leave_approval
  AFTER UPDATE ON public.leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_leave_approval();

-- Create storage bucket for leave documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-documents', 'leave-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for leave documents
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'leave-documents');
CREATE POLICY "Authenticated users can upload leave documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'leave-documents' AND auth.role() = 'authenticated');
