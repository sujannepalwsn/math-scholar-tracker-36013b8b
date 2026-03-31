-- Migration: 20260527000100_add_admin_audit_logging.sql
-- Description: Create a centralized audit log for sensitive administrative actions.

-- 1. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    actor_id UUID REFERENCES public.users(id),
    actor_role TEXT,
    action TEXT NOT NULL, -- 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ROLE_CHANGE'
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    center_id UUID REFERENCES public.centers(id)
);

-- Index for efficient audit trail lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_center_id ON public.audit_logs (center_id);

-- RLS: Only admins can view audit logs. NO ONE can update/delete them.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid() AND (users.role = 'admin' OR users.role = 'center')
    )
);

-- System can insert logs via security definer or trigger
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);


-- 2. Audit trigger function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    actor_record RECORD;
BEGIN
    -- Only audit if we have an authenticated user
    IF auth.uid() IS NOT NULL THEN
        -- Get actor details
        SELECT id, role, center_id INTO actor_record FROM public.users WHERE id = auth.uid();

        -- Auditing Logic
        IF (TG_OP = 'DELETE') THEN
            INSERT INTO public.audit_logs(actor_id, actor_role, action, table_name, record_id, old_data, center_id)
            VALUES (actor_record.id, actor_record.role, TG_OP, TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb, actor_record.center_id);
            RETURN OLD;
        ELSIF (TG_OP = 'UPDATE') THEN
            INSERT INTO public.audit_logs(actor_id, actor_role, action, table_name, record_id, old_data, new_data, center_id)
            VALUES (actor_record.id, actor_record.role, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, actor_record.center_id);
            RETURN NEW;
        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO public.audit_logs(actor_id, actor_role, action, table_name, record_id, new_data, center_id)
            VALUES (actor_record.id, actor_record.role, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb, actor_record.center_id);
            RETURN NEW;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable auditing on sensitive tables
-- Users table (crucial for role changes)
DROP TRIGGER IF EXISTS tr_audit_users ON public.users;
CREATE TRIGGER tr_audit_users
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Attendance table (integrity of records)
DROP TRIGGER IF EXISTS tr_audit_attendance ON public.attendance;
CREATE TRIGGER tr_audit_attendance
AFTER INSERT OR UPDATE OR DELETE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Students table
DROP TRIGGER IF EXISTS tr_audit_students ON public.students;
CREATE TRIGGER tr_audit_students
AFTER INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

-- Centers table
DROP TRIGGER IF EXISTS tr_audit_centers ON public.centers;
CREATE TRIGGER tr_audit_centers
AFTER INSERT OR UPDATE OR DELETE ON public.centers
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
