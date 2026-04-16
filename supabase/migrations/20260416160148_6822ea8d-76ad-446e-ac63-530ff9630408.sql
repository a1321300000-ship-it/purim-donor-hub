
ALTER TABLE public.donor_groups ADD COLUMN transport_type text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.reset_group_sequence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM setval(pg_get_serial_sequence('public.donor_groups', 'id'), 1, false);
END;
$$;
