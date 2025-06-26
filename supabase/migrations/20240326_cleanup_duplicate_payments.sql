-- Clean up duplicate payments, keeping only the ones with package information
DELETE FROM payments p1
USING payments p2
WHERE p1.transaction_id = p2.transaction_id  -- Same transaction
  AND p1.client_id = p2.client_id           -- Same client
  AND p1.amount = p2.amount                 -- Same amount
  AND p1.session_count = p2.session_count   -- Same session count
  AND p1.package_type IS NULL               -- p1 has no package type
  AND p2.package_type IS NOT NULL           -- p2 has package type
  AND p1.id != p2.id;                       -- Different records

-- Add a unique constraint to prevent future duplicates
ALTER TABLE payments
ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id); 