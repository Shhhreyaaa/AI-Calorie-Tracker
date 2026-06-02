-- Migration: Fix weight_logs table column 'logged_at'
-- Targets: public.weight_logs table in Supabase PostgreSQL database

-- 1. Rename created_at to logged_at if created_at exists and logged_at does not
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'weight_logs' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'weight_logs' AND column_name = 'logged_at'
  ) THEN
    ALTER TABLE public.weight_logs RENAME COLUMN created_at TO logged_at;
    RAISE NOTICE 'Renamed created_at to logged_at on public.weight_logs table.';
  END IF;
END $$;

-- 2. Add logged_at column if it still doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'weight_logs' AND column_name = 'logged_at'
  ) THEN
    ALTER TABLE public.weight_logs ADD COLUMN logged_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    RAISE NOTICE 'Added logged_at column to public.weight_logs table.';
  END IF;
END $$;

-- 3. Enable RLS and recreate policies for public.weight_logs
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own weight logs." ON public.weight_logs;
CREATE POLICY "Users can view their own weight logs."
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own weight logs." ON public.weight_logs;
CREATE POLICY "Users can insert their own weight logs."
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weight logs." ON public.weight_logs;
CREATE POLICY "Users can update their own weight logs."
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own weight logs." ON public.weight_logs;
CREATE POLICY "Users can delete their own weight logs."
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = user_id);
