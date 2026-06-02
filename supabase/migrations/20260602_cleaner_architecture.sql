-- Supabase Migration: Cleaner Architecture Profile & Goals Upgrade
-- Target: public schema in Supabase Database

-- 1. Alter public.users table to add cleaner architecture columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS height NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_weight NUMERIC;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS diet_preference TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- 2. Alter public.goals table to add cleaner architecture columns (using id as the user reference column)
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_type TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Re-enable Row Level Security on public.goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can edit their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals." ON public.goals;

-- 5. Create clean RLS policies for public.goals using the actual user reference column: id
CREATE POLICY "Users can view their own goals."
  ON public.goals FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own goals."
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can edit their own goals."
  ON public.goals FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own goals."
  ON public.goals FOR DELETE
  USING (auth.uid() = id);
