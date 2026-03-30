
-- Add yeshiva and shiur columns to bachurim
ALTER TABLE public.bachurim ADD COLUMN IF NOT EXISTS yeshiva text NOT NULL DEFAULT '';
ALTER TABLE public.bachurim ADD COLUMN IF NOT EXISTS shiur text NOT NULL DEFAULT '';

-- Create select_options table for managing dropdown lists
CREATE TABLE IF NOT EXISTS public.select_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_name text NOT NULL,
  value text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(list_name, value)
);

ALTER TABLE public.select_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to select_options"
  ON public.select_options
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add donation_notes jsonb column to donors for per-year notes
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS donation_notes jsonb NOT NULL DEFAULT '{}'::jsonb;
