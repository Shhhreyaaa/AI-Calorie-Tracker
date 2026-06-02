-- Supabase Migration: Add INSERT policies for public.users, public.goals, and public.streaks
-- Enables client-side auto-profile creation fallback during signup/login when trigger execution lags.

-- 1. Insert Policy for Users
CREATE POLICY "Users can insert their own profile row."
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Insert Policy for Goals
CREATE POLICY "Users can insert their own goals."
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Insert Policy for Streaks
CREATE POLICY "Users can insert their own streaks."
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = id);
