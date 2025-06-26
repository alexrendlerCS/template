-- Add package_type column to payments table
ALTER TABLE payments 
ADD COLUMN package_type text;

-- Update existing payment records with package type from packages table
UPDATE payments p
SET package_type = pkg.package_type
FROM packages pkg
WHERE p.client_id = pkg.client_id
AND p.paid_at = pkg.purchase_date; 