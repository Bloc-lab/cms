-- Oprava triggeru handle_new_user – použití public.profiles
-- Spusť v Supabase SQL Editoru, pokud registrace uživatelů selhává s "profiles does not exist"

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 'EDITOR');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
