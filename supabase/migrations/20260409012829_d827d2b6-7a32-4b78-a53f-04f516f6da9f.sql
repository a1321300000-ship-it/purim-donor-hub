CREATE OR REPLACE FUNCTION public.reset_donor_sequence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM setval(pg_get_serial_sequence('public.donors', 'id'), 1, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_bachur_sequence()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM setval(pg_get_serial_sequence('public.bachurim', 'id'), 1, false);
END;
$$;