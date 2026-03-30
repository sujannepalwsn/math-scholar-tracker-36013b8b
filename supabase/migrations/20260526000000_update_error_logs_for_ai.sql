-- Migration: 20260526000000_update_error_logs_for_ai.sql
-- Description: Refine error_logs and set up AI Debugger Webhook

-- Ensure the error_logs table has the exact requested columns
ALTER TABLE public.error_logs
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Ensure required columns exist (they were partly created in previous migration, but we normalize here)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'error_logs' AND column_name = 'error_type') THEN
        ALTER TABLE public.error_logs ADD COLUMN error_type TEXT NOT NULL DEFAULT 'runtime';
    END IF;
    -- message, stack, module, component, user_context already exist from previous step or were added
END $$;

-- Enable pg_net extension if it's not enabled (needed for outbound HTTP from DB)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a function to trigger the AI Debugger Webhook
CREATE OR REPLACE FUNCTION public.trigger_ai_debugger_webhook()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://api.google.com/v1/ai-studio/debugger-webhook',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := row_to_json(NEW)::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_error_logs_webhook ON public.error_logs;
CREATE TRIGGER tr_error_logs_webhook
AFTER INSERT ON public.error_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_ai_debugger_webhook();
