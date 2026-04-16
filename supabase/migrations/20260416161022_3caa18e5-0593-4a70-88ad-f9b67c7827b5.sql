
-- Fix RLS policies: require authenticated role

-- donors
DROP POLICY IF EXISTS "Allow full access to donors" ON public.donors;
CREATE POLICY "Authenticated full access to donors" ON public.donors FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- bachurim
DROP POLICY IF EXISTS "Allow full access to bachurim" ON public.bachurim;
CREATE POLICY "Authenticated full access to bachurim" ON public.bachurim FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- settings
DROP POLICY IF EXISTS "Allow full access to settings" ON public.settings;
CREATE POLICY "Authenticated full access to settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- select_options
DROP POLICY IF EXISTS "Allow full access to select_options" ON public.select_options;
CREATE POLICY "Authenticated full access to select_options" ON public.select_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- donor_groups
DROP POLICY IF EXISTS "Allow full access to donor_groups" ON public.donor_groups;
CREATE POLICY "Authenticated full access to donor_groups" ON public.donor_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- group_members
DROP POLICY IF EXISTS "Allow full access to group_members" ON public.group_members;
CREATE POLICY "Authenticated full access to group_members" ON public.group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- group_bachur_assignments
DROP POLICY IF EXISTS "Allow full access to group_bachur_assignments" ON public.group_bachur_assignments;
CREATE POLICY "Authenticated full access to group_bachur_assignments" ON public.group_bachur_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Restrict RPC functions to authenticated users only
REVOKE EXECUTE ON FUNCTION public.reset_donor_sequence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_donor_sequence() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_bachur_sequence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_bachur_sequence() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reset_group_sequence() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_group_sequence() TO authenticated;
