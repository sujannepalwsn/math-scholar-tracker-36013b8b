-- Migration: Add title to broadcast_messages
-- Date: 2026-04-21

ALTER TABLE public.broadcast_messages ADD COLUMN IF NOT EXISTS title TEXT;
