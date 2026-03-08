
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  user_id uuid NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  link text NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id IS NULL AND is_same_center(center_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR (user_id IS NULL AND is_same_center(center_id)));

CREATE POLICY "Service role full access on notifications"
  ON public.notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  user_id uuid NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NULL,
  description text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Center users can view their activity logs"
  ON public.activity_logs FOR SELECT
  USING (is_same_center(center_id));

CREATE POLICY "Center users can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (is_same_center(center_id));

CREATE POLICY "Service role full access on activity_logs"
  ON public.activity_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_center_user ON public.notifications(center_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_center ON public.activity_logs(center_id, created_at DESC);
