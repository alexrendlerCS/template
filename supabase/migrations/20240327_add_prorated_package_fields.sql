-- Add columns for prorated package support
ALTER TABLE packages
  -- Original number of sessions before proration
  ADD COLUMN IF NOT EXISTS original_sessions INTEGER,
  -- Flag to identify if this package was prorated
  ADD COLUMN IF NOT EXISTS is_prorated BOOLEAN DEFAULT false,
  -- Explicit expiry date for the package
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
  -- Add a check constraint to ensure original_sessions is greater than or equal to sessions_included
  ADD CONSTRAINT check_original_sessions CHECK (original_sessions >= sessions_included);

-- Update existing records to set original_sessions equal to sessions_included
UPDATE packages 
SET 
  original_sessions = sessions_included,
  is_prorated = false
WHERE original_sessions IS NULL;

-- Make original_sessions NOT NULL after setting default values
ALTER TABLE packages
  ALTER COLUMN original_sessions SET NOT NULL;

-- Add an index on expiry_date for faster queries
CREATE INDEX IF NOT EXISTS idx_packages_expiry_date ON packages(expiry_date);

-- Add comment descriptions to the new columns
COMMENT ON COLUMN packages.original_sessions IS 'The original number of sessions in the package before any proration';
COMMENT ON COLUMN packages.is_prorated IS 'Flag indicating whether this package was prorated due to mid-month purchase';
COMMENT ON COLUMN packages.expiry_date IS 'The date when this package expires (typically end of month + grace period)';

-- Create a function to automatically set is_prorated based on sessions comparison
CREATE OR REPLACE FUNCTION set_is_prorated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_prorated := CASE 
    WHEN NEW.original_sessions > NEW.sessions_included THEN true
    ELSE false
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set is_prorated
DROP TRIGGER IF EXISTS trigger_set_is_prorated ON packages;
CREATE TRIGGER trigger_set_is_prorated
  BEFORE INSERT OR UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION set_is_prorated(); 