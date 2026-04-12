
CREATE TABLE public.donor_groups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  task_type text NOT NULL DEFAULT 'מת"א',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donor_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to donor_groups" ON public.donor_groups FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.group_members (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id bigint NOT NULL REFERENCES public.donor_groups(id) ON DELETE CASCADE,
  donor_id bigint NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, donor_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to group_members" ON public.group_members FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.group_bachur_assignments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  group_id bigint NOT NULL REFERENCES public.donor_groups(id) ON DELETE CASCADE,
  bachur_id bigint NOT NULL REFERENCES public.bachurim(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, bachur_id)
);

ALTER TABLE public.group_bachur_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to group_bachur_assignments" ON public.group_bachur_assignments FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_donor_groups_updated_at
  BEFORE UPDATE ON public.donor_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
