-- Fix Security Issue: Function Search Path Mutable
-- The is_admin() function needs to have search_path set to prevent security vulnerabilities
-- Using CREATE OR REPLACE to avoid breaking RLS policy dependencies

-- Update function with proper search_path (using CREATE OR REPLACE to preserve dependencies)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = TRUE
  );
END;
$$;

-- Grant execute permission (idempotent)
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

