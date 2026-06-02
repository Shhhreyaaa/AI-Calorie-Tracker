-- Supabase Migration: Unified Users Profile & Goals Schema with Performance Indexes
-- Target: public schema in Supabase PostgreSQL Database

-- 1. Upgrade public.users table with all expected columns
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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS preferred_units TEXT DEFAULT 'metric';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Backfill full_name from display_name if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'display_name'
  ) THEN
    UPDATE public.users SET full_name = display_name WHERE full_name IS NULL;
  END IF;
END $$;

-- 3. Update the handle_new_user() trigger function to populate all columns correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users
  INSERT INTO public.users (
    id, 
    email, 
    full_name,
    daily_calorie_target,
    protein_goal,
    carbs_goal,
    fat_goal,
    onboarding_completed,
    theme_preference,
    preferred_units,
    created_at,
    updated_at
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', 'User'),
    2000,
    150,
    200,
    65,
    false,
    'dark',
    'metric',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.goals for backwards compatibility
  INSERT INTO public.goals (id, calories, protein, carbs, fat, updated_at)
  VALUES (new.id, 2000, 150, 200, 65, now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert into public.streaks
  INSERT INTO public.streaks (id, current_streak, longest_streak, updated_at)
  VALUES (new.id, 0, 0, now())
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-enable Row Level Security on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Establish clean RLS policies for public.users
DROP POLICY IF EXISTS "Users can view their own profile row." ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile row." ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile row." ON public.users;

CREATE POLICY "Users can view their own profile row."
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile row."
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile row."
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Create performance indexes for lookup optimization
CREATE INDEX IF NOT EXISTS idx_meals_user_logged ON public.meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_created ON public.weight_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_created ON public.coach_messages(user_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_diet_analyses_user_date ON public.diet_analyses(user_id, analysis_date DESC);
