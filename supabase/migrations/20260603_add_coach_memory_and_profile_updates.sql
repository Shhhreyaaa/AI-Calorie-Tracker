-- Supabase Migration: Add diet_preference, medical_conditions, coach_memory, and update coach_messages with reactions and update policy

-- 1. Alter public.users table to support new fields
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS diet_preference TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS medical_conditions TEXT[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coach_memory JSONB DEFAULT '{}'::jsonb;

-- 2. Alter public.coach_messages to support user message reactions
ALTER TABLE public.coach_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb;

-- 3. Add UPDATE RLS policy to public.coach_messages so users can save message reactions
DROP POLICY IF EXISTS "Users can update their own coach messages." ON public.coach_messages;
CREATE POLICY "Users can update their own coach messages."
  ON public.coach_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
