-- Remove the unique constraint that prevents adding sessions to existing packages
-- This constraint was causing issues when trying to update packages with additional sessions
ALTER TABLE packages 
DROP CONSTRAINT IF EXISTS packages_unique_purchase;

-- Also remove the associated index since it's no longer needed
DROP INDEX IF EXISTS idx_packages_purchase;

-- Add a comment explaining why this constraint was removed
COMMENT ON TABLE packages IS 'Packages table - unique constraint removed to allow session additions to existing packages'; 