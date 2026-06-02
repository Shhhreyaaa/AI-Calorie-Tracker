-- Supabase Migration: Image Analysis Caching and API Auditing

-- 1. Create image_analysis_cache table
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

-- Enable RLS for image_analysis_cache
ALTER TABLE public.image_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert into cache (so API route can insert using user context)
CREATE POLICY "Users can insert analysis cache"
  ON public.image_analysis_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to read from cache
CREATE POLICY "Users can read analysis cache"
  ON public.image_analysis_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. Create gemini_api_logs table
CREATE TABLE IF NOT EXISTS public.gemini_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_hash TEXT,
  model_used TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for gemini_api_logs
ALTER TABLE public.gemini_api_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
CREATE POLICY "Users can insert api logs"
  ON public.gemini_api_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only service role can read all logs natively, users only their own
CREATE POLICY "Users can read their own api logs"
  ON public.gemini_api_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_image_analysis_cache_hash ON public.image_analysis_cache(image_hash);
CREATE INDEX IF NOT EXISTS idx_gemini_api_logs_status ON public.gemini_api_logs(status);
CREATE INDEX IF NOT EXISTS idx_gemini_api_logs_user ON public.gemini_api_logs(user_id);
