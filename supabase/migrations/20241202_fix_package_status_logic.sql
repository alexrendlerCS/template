-- Fix the package status logic to ensure packages with remaining sessions are marked as active
-- Update the increment_sessions_used function to properly handle status

CREATE OR REPLACE FUNCTION public.increment_sessions_used(package_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.packages
  SET 
    sessions_used = coalesce(sessions_used, 0) + 1,
    status = case 
      when (coalesce(sessions_used, 0) + 1) >= sessions_included then 'completed'
      else 'active'
    end
  WHERE id = package_id;
END;
$$;

-- Create a function to fix package statuses that should be active
CREATE OR REPLACE FUNCTION public.fix_package_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update packages that have remaining sessions but are marked as completed
  UPDATE public.packages
  SET status = 'active'
  WHERE status = 'completed' 
    AND (sessions_included - sessions_used) > 0;
    
  -- Update packages that have no remaining sessions but are marked as active
  UPDATE public.packages
  SET status = 'completed'
  WHERE status = 'active' 
    AND (sessions_included - sessions_used) <= 0;
END;
$$;

-- Run the fix function to correct any existing packages
SELECT public.fix_package_statuses();

-- Add a comment explaining the fix
COMMENT ON FUNCTION public.fix_package_statuses() IS 'Fixes package statuses to ensure packages with remaining sessions are marked as active'; 