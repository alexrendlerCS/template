-- First, add transaction_id column if it doesn't exist
ALTER TABLE packages ADD COLUMN IF NOT EXISTS transaction_id text;

-- First, let's identify and keep only the most recent package for each combination
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id, package_type, purchase_date::date, sessions_included
      ORDER BY 
        created_at DESC NULLS LAST,  -- Keep the most recent
        id DESC                      -- If created_at is the same, keep the latest ID
    ) as rn
  FROM packages
)
DELETE FROM packages
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Now clean up any orphaned payments
DELETE FROM payments
WHERE package_id IS NOT NULL 
AND package_id NOT IN (SELECT id FROM packages);

-- Update remaining payments to link to the correct package
UPDATE payments p
SET 
  package_type = pkg.package_type,
  package_id = pkg.id
FROM packages pkg
WHERE p.client_id = pkg.client_id
  AND p.session_count = pkg.sessions_included
  AND p.paid_at::date = pkg.purchase_date::date
  AND p.package_type IS NULL;

-- Now we can safely add the unique constraint
ALTER TABLE packages 
  ADD CONSTRAINT packages_unique_purchase 
  UNIQUE (client_id, package_type, purchase_date, sessions_included);

-- And add the index for better performance
CREATE INDEX IF NOT EXISTS idx_packages_purchase 
  ON packages(client_id, package_type, purchase_date, sessions_included); 