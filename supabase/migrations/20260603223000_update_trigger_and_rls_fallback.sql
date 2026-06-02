-- Migration: Update Trigger Function & Goals RLS Fallbacks
-- Target: public schema in Supabase Database

-- 1. Update the database trigger to populate user_id upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert Profile
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'User')
  );

  -- Insert Default Goals (populating user_id and target columns)
  INSERT INTO public.goals (id, user_id, calories, calorie_target, protein, protein_target, carbs, carb_target, fat, fat_target)
  VALUES (new.id, new.id, 2000, 2000, 150, 150, 200, 200, 65, 65);

  -- Insert Empty Streak log
  INSERT INTO public.streaks (id, current_streak, longest_streak)
  VALUES (new.id, 0, 0);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill any existing goals rows where user_id is null
UPDATE public.goals SET user_id = id WHERE user_id IS NULL;

-- 3. Update RLS policies on public.goals to check for user_id OR id as fallback
DROP POLICY IF EXISTS "Users can view their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can edit their own goals." ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals." ON public.goals;

CREATE POLICY "Users can view their own goals."
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can edit their own goals."
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

CREATE POLICY "Users can delete their own goals."
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = id);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
