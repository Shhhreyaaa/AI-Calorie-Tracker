-- Supabase Migration: Weight Tracking & Diet Analyses
-- Target: public schema in Supabase Database

-- 1. Create Weight Logs Table
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  weight NUMERIC NOT NULL CHECK (weight > 0),
  logged_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view their own weight logs."
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert their own weight logs."
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete their own weight logs."
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast sorting by date
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_logged ON public.weight_logs(user_id, logged_at DESC);


-- 2. Create Diet Analyses Table
CREATE TABLE IF NOT EXISTS public.diet_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  analysis_date DATE DEFAULT CURRENT_DATE NOT NULL,
  strengths TEXT[] NOT NULL,
  weaknesses TEXT[] NOT NULL,
  macro_assessment TEXT NOT NULL,
  calorie_assessment TEXT NOT NULL,
  next_meal_recommendation TEXT NOT NULL,
  actionable_plan TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, analysis_date)
);

-- Enable RLS
ALTER TABLE public.diet_analyses ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users can view their own diet analyses."
  ON public.diet_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users can insert their own diet analyses."
  ON public.diet_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete their own diet analyses."
  ON public.diet_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Index for searching history
CREATE INDEX IF NOT EXISTS idx_diet_analyses_user_date ON public.diet_analyses(user_id, analysis_date DESC);
