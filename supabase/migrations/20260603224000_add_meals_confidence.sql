-- Migration: Add Confidence column to meals table
-- Target: public schema in Supabase Database

ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 1.0;

-- Reload PostgREST schema cache to make it queryable immediately
NOTIFY pgrst, 'reload schema';
