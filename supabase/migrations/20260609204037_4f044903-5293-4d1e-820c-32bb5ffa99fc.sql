-- 1) Private credentials table for the shared kiosk user (service-role only)
CREATE TABLE IF NOT EXISTS public.auth_kiosk (
  id integer PRIMARY KEY DEFAULT 1,
  email text NOT NULL,
  password text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_kiosk_singleton CHECK (id = 1)
);
GRANT ALL ON public.auth_kiosk TO service_role;
ALTER TABLE public.auth_kiosk ENABLE ROW LEVEL SECURITY;
-- No policies = no anon/authenticated access. service_role bypasses RLS.

-- 2) Tighten RLS on all data tables: require an authenticated session
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['donors','bachurim','donor_groups','group_members','group_bachur_assignments','select_options','settings'];
  pol record;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop ALL existing policies on the table
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, t);
    END LOOP;

    -- Ensure RLS enabled
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    -- Grant Data API access to authenticated only (revoke anon)
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);

    -- Create authenticated-only policy
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      t
    );
  END LOOP;
END $$;