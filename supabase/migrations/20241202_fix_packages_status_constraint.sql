-- Fix the packages status constraint to allow 'active' and 'completed' values
-- Drop the existing constraint if it exists
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

-- Add the correct constraint that allows the values used by increment_sessions_used function
ALTER TABLE packages ADD CONSTRAINT packages_status_check 
CHECK (status IN ('active', 'completed', 'expired', 'cancelled'));

-- Add a comment explaining the constraint
COMMENT ON CONSTRAINT packages_status_check ON packages IS 'Status must be one of: active, completed, expired, cancelled'; 