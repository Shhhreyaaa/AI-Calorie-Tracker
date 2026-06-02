-- Migration: Fix Goals Table Schema & RLS Policies
-- Target: public schema in Supabase Database

-- 1. Ensure columns exist on public.goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS calorie_target INTEGER DEFAULT 2000;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS protein_target INTEGER DEFAULT 150;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS carb_target INTEGER DEFAULT 200;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS fat_target INTEGER DEFAULT 65;

-- 2. Backfill user_id and targets from existing columns if they are null
UPDATE public.goals SET user_id = id WHERE user_id IS NULL;
UPDATE public.goals SET calorie_target = calories WHERE calorie_target IS NULL AND calories IS NOT NULL;
UPDATE public.goals SET protein_target = protein WHERE protein_target IS NULL AND protein IS NOT NULL;
UPDATE public.goals SET carb_target = carbs WHERE carb_target IS NULL AND carbs IS NOT NULL;
UPDATE public.goals SET fat_target = fat WHERE fat_target IS NULL AND fat IS NOT NULL;

-- 3. Set up primary/unique constraints if user_id is the primary target
-- First check if a unique constraint exists on user_id, if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
      AND table_name = 'goals' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'goals_user_id_key'
  ) THEN
    ALTER TABLE public.goals ADD CONSTRAINT goals_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Re-enable Row Level Security on public.goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can edit their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;

-- 6. Create clean RLS policies using user_id
CREATE POLICY "Users can view their own goals."
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can edit their own goals."
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals."
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
