-- Supabase Database Schema - AI Calorie Tracker 🥗📸

-- ==========================================
-- 1. Tables Creation
-- ==========================================

-- A. Users Profile Table (references auth.users in Supabase Auth schema)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT 'User',
  full_name TEXT,
  avatar_url TEXT,
  age INTEGER,
  gender TEXT,
  height_cm NUMERIC,
  current_weight NUMERIC,
  target_weight NUMERIC,
  activity_level TEXT,
  goal_type TEXT,
  daily_calorie_target INTEGER DEFAULT 2000,
  protein_goal INTEGER DEFAULT 150,
  carbs_goal INTEGER DEFAULT 200,
  fat_goal INTEGER DEFAULT 65,
  diet_preference TEXT,
  medical_conditions TEXT[] DEFAULT '{}',
  coach_memory JSONB DEFAULT '{}'::jsonb,
  theme_preference TEXT DEFAULT 'dark',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- B. Daily Nutrition Goals (1-to-1 relationship with users)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  calories INTEGER DEFAULT 2000 NOT NULL CHECK (calories > 0),
  protein INTEGER DEFAULT 150 NOT NULL CHECK (protein >= 0),
  carbs INTEGER DEFAULT 200 NOT NULL CHECK (carbs >= 0),
  fat INTEGER DEFAULT 65 NOT NULL CHECK (fat >= 0),
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- C. Tracking Streaks (1-to-1 relationship with users)
CREATE TABLE IF NOT EXISTS public.streaks (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0 NOT NULL CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 NOT NULL CHECK (longest_streak >= 0),
  last_logged_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- D. Meal Logs Diary (Many-to-1 relationship with users)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  image_url TEXT,
  meal_type TEXT DEFAULT 'Snack' NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein INTEGER NOT NULL CHECK (protein >= 0),
  carbs INTEGER NOT NULL CHECK (carbs >= 0),
  fat INTEGER NOT NULL CHECK (fat >= 0),
  logged_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 2. Performance Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_meals_user_logged ON public.meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON public.meals(logged_at);

-- ==========================================
-- 3. Row Level Security (RLS) Policies
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- A. Users Table Policies
CREATE POLICY "Users can view their own profile row." 
  ON public.users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile row." 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- B. Goals Table Policies
CREATE POLICY "Users can view their own goals." 
  ON public.goals FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can edit their own goals." 
  ON public.goals FOR UPDATE 
  USING (auth.uid() = id);

-- C. Streaks Table Policies
CREATE POLICY "Users can view their own streaks." 
  ON public.streaks FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own streaks." 
  ON public.streaks FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own streaks." 
  ON public.streaks FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own streaks." 
  ON public.streaks FOR DELETE 
  USING (auth.uid() = id);

-- D. Meals Table Policies
CREATE POLICY "Users can view their own logged meals." 
  ON public.meals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log new meals." 
  ON public.meals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals." 
  ON public.meals FOR DELETE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can modify their own meals." 
  ON public.meals FOR UPDATE 
  USING (auth.uid() = user_id);

-- ==========================================
-- 4. Automatic Onboarding Triggers
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert Profile
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'User')
  );

  -- 2. Insert Default Goals
  INSERT INTO public.goals (id, calories, protein, carbs, fat)
  VALUES (new.id, 2000, 150, 200, 65);

  -- 3. Insert Empty Streak log
  INSERT INTO public.streaks (id, current_streak, longest_streak)
  VALUES (new.id, 0, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Link
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. Retroactive backfill for existing auth users
-- ==========================================
INSERT INTO public.users (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'full_name', 'User')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.goals (id, calories, protein, carbs, fat)
SELECT id, 2000, 150, 200, 65
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.streaks (id, current_streak, longest_streak)
SELECT id, 0, 0
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. Coach Messages Conversation Memory (Upgrade)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.coach_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  reactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Users can view their own coach messages."
  ON public.coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coach messages."
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coach messages."
  ON public.coach_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coach messages."
  ON public.coach_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_created ON public.coach_messages(user_id, created_at ASC);

-- ==========================================
-- 7. Image Analysis Cache & Logs
-- ==========================================

-- A. Image Analysis Cache
CREATE TABLE IF NOT EXISTS public.image_analysis_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_hash TEXT UNIQUE NOT NULL,
  meal_name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  confidence NUMERIC,
  ingredients JSONB,
  health_score INTEGER,
  good_for TEXT,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.image_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert analysis cache"
  ON public.image_analysis_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can read analysis cache"
  ON public.image_analysis_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- B. Gemini API Logs
CREATE TABLE IF NOT EXISTS public.gemini_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_hash TEXT,
  model_used TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.gemini_api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert api logs"
  ON public.gemini_api_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can read their own api logs"
  ON public.gemini_api_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_image_analysis_cache_hash ON public.image_analysis_cache(image_hash);
CREATE INDEX IF NOT EXISTS idx_gemini_api_logs_status ON public.gemini_api_logs(status);
CREATE INDEX IF NOT EXISTS idx_gemini_api_logs_user ON public.gemini_api_logs(user_id);

