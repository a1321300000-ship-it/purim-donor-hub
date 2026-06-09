REVOKE EXECUTE ON FUNCTION public.reset_donor_sequence() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_bachur_sequence() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_group_sequence() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_donor_sequence() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_bachur_sequence() TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_group_sequence() TO service_role;