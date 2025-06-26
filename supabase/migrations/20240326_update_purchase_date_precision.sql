-- Update purchase_date column to use timestamptz with microsecond precision
ALTER TABLE packages 
ALTER COLUMN purchase_date TYPE timestamptz 
USING purchase_date::timestamptz; 