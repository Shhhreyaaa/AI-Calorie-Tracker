-- Supabase Migration: Ensure all user columns exist and reload schema cache
-- 1. Add all required columns to public.users (IF NOT EXISTS prevents errors if they already exist)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height_cm NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_weight NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS goal_type TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER DEFAULT 2000;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS protein_goal INTEGER DEFAULT 150;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS carbs_goal INTEGER DEFAULT 200;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS fat_goal INTEGER DEFAULT 65;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS diet_preference TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
