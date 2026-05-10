
-- DONORS
ALTER TABLE public.donors ADD COLUMN first_name text NOT NULL DEFAULT '';
ALTER TABLE public.donors ADD COLUMN last_name text NOT NULL DEFAULT '';

UPDATE public.donors SET
  first_name = CASE WHEN position(' ' in full_name) > 0 THEN substring(full_name FROM 1 FOR position(' ' in full_name) - 1) ELSE full_name END,
  last_name = CASE WHEN position(' ' in full_name) > 0 THEN substring(full_name FROM position(' ' in full_name) + 1) ELSE '' END;

ALTER TABLE public.donors DROP COLUMN full_name;
ALTER TABLE public.donors ADD COLUMN full_name text
  GENERATED ALWAYS AS (TRIM(BOTH ' ' FROM (coalesce(first_name,'') || ' ' || coalesce(last_name,'')))) STORED;

-- BACHURIM
ALTER TABLE public.bachurim ADD COLUMN first_name text NOT NULL DEFAULT '';
ALTER TABLE public.bachurim ADD COLUMN last_name text NOT NULL DEFAULT '';

UPDATE public.bachurim SET
  first_name = CASE WHEN position(' ' in full_name) > 0 THEN substring(full_name FROM 1 FOR position(' ' in full_name) - 1) ELSE full_name END,
  last_name = CASE WHEN position(' ' in full_name) > 0 THEN substring(full_name FROM position(' ' in full_name) + 1) ELSE '' END;

ALTER TABLE public.bachurim DROP COLUMN full_name;
ALTER TABLE public.bachurim ADD COLUMN full_name text
  GENERATED ALWAYS AS (TRIM(BOTH ' ' FROM (coalesce(first_name,'') || ' ' || coalesce(last_name,'')))) STORED;
