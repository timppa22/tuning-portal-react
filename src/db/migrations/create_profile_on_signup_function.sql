-- Create the create_profile_on_signup function with secure search_path
CREATE OR REPLACE FUNCTION public.create_profile_on_signup()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Lock to safe search_path for the duration of this function call
  PERFORM set_config('search_path', 'pg_catalog, public', true);

  -- Use schema-qualified names where appropriate
  INSERT INTO public.profiles(user_id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
END;
$$;
