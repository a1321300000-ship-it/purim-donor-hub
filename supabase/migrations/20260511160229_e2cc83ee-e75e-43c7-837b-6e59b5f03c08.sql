ALTER TABLE public.bachurim DROP COLUMN IF EXISTS phone;

-- Remove duplicates first if any, keeping lowest id
DELETE FROM public.group_members a
USING public.group_members b
WHERE a.donor_id = b.donor_id AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS group_members_donor_id_unique ON public.group_members (donor_id);