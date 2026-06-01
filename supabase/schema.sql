-- Supabase Database Schema - AI Calorie Tracker 🥗📸

-- ==========================================
-- 1. Tables Creation
-- ==========================================

-- A. Users Profile Table (references auth.users in Supabase Auth schema)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
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

CREATE POLICY "Users can update their own streaks." 
  ON public.streaks FOR UPDATE 
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
