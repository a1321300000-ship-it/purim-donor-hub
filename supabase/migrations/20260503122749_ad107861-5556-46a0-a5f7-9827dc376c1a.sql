
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['donors','bachurim','settings','select_options','donor_groups','group_members','group_bachur_assignments']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access to %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Public full access to %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public full access to %I" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.reset_donor_sequence() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_bachur_sequence() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_group_sequence() TO anon, authenticated;
