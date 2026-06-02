-- Supabase Migration: Performance Optimizations Sprint

-- 1. Create or recreate the image_analysis_cache table with optimized single-column JSONB storage
DROP TABLE IF EXISTS public.image_analysis_cache CASCADE;

CREATE TABLE public.image_analysis_cache (
  image_hash TEXT PRIMARY KEY,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS for image_analysis_cache
ALTER TABLE public.image_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read analysis cache
CREATE POLICY "Users can read analysis cache"
  ON public.image_analysis_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert into analysis cache (called from api routes)
CREATE POLICY "Users can insert analysis cache"
  ON public.image_analysis_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Performance Indexes
-- Index on meals(user_id) for faster user filtering
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON public.meals(user_id);

-- Index on meals(logged_at) for faster date sorting and diary fetching
CREATE INDEX IF NOT EXISTS idx_meals_logged_at ON public.meals(logged_at DESC);

-- Index on weight_logs(user_id) for faster weight logs filtering
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_id ON public.weight_logs(user_id);

-- Index on weight_logs(created_at) for faster weight trend plotting
CREATE INDEX IF NOT EXISTS idx_weight_logs_created_at ON public.weight_logs(created_at DESC);

-- Index on streaks(id) for faster 1-to-1 profile matching
CREATE INDEX IF NOT EXISTS idx_streaks_id ON public.streaks(id);

-- Index on goals(id) for faster 1-to-1 goals matching
CREATE INDEX IF NOT EXISTS idx_goals_id ON public.goals(id);

-- 3. Streaks RLS Policy Fixes
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can update their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can delete their own streaks." ON public.streaks;

-- Set up simplified RLS policies on streaks
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

-- 4. Reload PostgREST schema cache to make the new table/structure queryable immediately
NOTIFY pgrst, 'reload schema';
