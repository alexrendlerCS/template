-- Create a function to safely increment sessions_used
create or replace function public.increment_sessions_used(package_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.packages
  set 
    sessions_used = coalesce(sessions_used, 0) + 1,
    status = case 
      when (coalesce(sessions_used, 0) + 1) >= sessions_included then 'completed'
      else 'active'
    end
  where id = package_id;
end;
$$;

-- Add transaction_id column to packages table if it doesn't exist
ALTER TABLE packages ADD COLUMN IF NOT EXISTS transaction_id text;

-- Add unique constraint on transaction_id
ALTER TABLE packages ADD CONSTRAINT packages_transaction_id_key UNIQUE (transaction_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_packages_transaction_id ON packages(transaction_id); 