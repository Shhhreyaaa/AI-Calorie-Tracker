-- Supabase Migration: Fix RLS policies for streaks table

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can insert their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can update their own streaks." ON public.streaks;
DROP POLICY IF EXISTS "Users can delete their own streaks." ON public.streaks;

-- 1. SELECT Policy
CREATE POLICY "Users can view their own streaks."
  ON public.streaks FOR SELECT
  USING (auth.uid() = id);

-- 2. INSERT Policy
CREATE POLICY "Users can insert their own streaks."
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. UPDATE Policy
CREATE POLICY "Users can update their own streaks."
  ON public.streaks FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. DELETE Policy
CREATE POLICY "Users can delete their own streaks."
  ON public.streaks FOR DELETE
  USING (auth.uid() = id);
