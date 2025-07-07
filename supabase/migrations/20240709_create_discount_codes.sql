-- Create discount_codes table for trainer-created promo codes
CREATE TABLE discount_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    stripe_coupon_id text NOT NULL,
    stripe_promotion_code_id text NOT NULL,
    percent_off int,
    amount_off int,
    currency text,
    max_redemptions int,
    expires_at timestamp,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Index for quick lookup by code
CREATE UNIQUE INDEX idx_discount_codes_code ON discount_codes(code); 