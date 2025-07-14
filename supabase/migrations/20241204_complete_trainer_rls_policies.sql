-- Complete RLS policies for trainer functionality
-- This migration sets up comprehensive row-level security for all trainer operations

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Trainers can view all clients" ON users;
DROP POLICY IF EXISTS "Trainers can update client profiles" ON users;
DROP POLICY IF EXISTS "Trainers can delete clients" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Trainers can view all clients (for client management)
CREATE POLICY "Trainers can view all clients" ON users
    FOR SELECT
    TO authenticated
    USING (
        -- Users can always see their own profile
        auth.uid() = id
        OR
        -- Trainers can see all clients
        (
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() AND role = 'trainer'
            )
            AND role = 'client'
        )
        OR
        -- Clients can see trainers (for booking purposes)
        (
            role = 'trainer'
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() AND role = 'client'
            )
        )
    );

-- Policy: Trainers can update client profiles
CREATE POLICY "Trainers can update client profiles" ON users
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can always update their own profile
        auth.uid() = id
        OR
        -- Trainers can update client profiles
        (
            role = 'client'
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() AND role = 'trainer'
            )
        )
    )
    WITH CHECK (
        -- Users can always update their own profile
        auth.uid() = id
        OR
        -- Trainers can update client profiles
        (
            role = 'client'
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() AND role = 'trainer'
            )
        )
    );

-- Policy: Trainers can delete clients
CREATE POLICY "Trainers can delete clients" ON users
    FOR DELETE
    TO authenticated
    USING (
        -- Only trainers can delete users
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
        AND
        -- Only clients can be deleted (trainers cannot delete other trainers)
        role = 'client'
    );

-- Policy: Service role has full access for admin operations
CREATE POLICY "Service role has full access" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SESSIONS TABLE POLICIES
-- ============================================================================

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all access for service role" ON sessions;
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_service_role_policy" ON sessions;

-- Policy: Users can read sessions where they are the client or trainer
CREATE POLICY "sessions_select_policy" ON sessions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    );

-- Policy: Trainers and clients can create sessions
CREATE POLICY "sessions_insert_policy" ON sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = trainer_id OR
        auth.uid() = client_id
    );

-- Policy: Users can update sessions where they are the client or trainer
CREATE POLICY "sessions_update_policy" ON sessions
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    )
    WITH CHECK (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    );

-- Policy: Only trainers can delete sessions
CREATE POLICY "sessions_delete_policy" ON sessions
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = trainer_id
    );

-- Policy: Service role has full access
CREATE POLICY "sessions_service_role_policy" ON sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PACKAGES TABLE POLICIES
-- ============================================================================

-- Enable RLS on packages table
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "packages_select_policy" ON packages;
DROP POLICY IF EXISTS "packages_insert_policy" ON packages;
DROP POLICY IF EXISTS "packages_update_policy" ON packages;
DROP POLICY IF EXISTS "packages_delete_policy" ON packages;
DROP POLICY IF EXISTS "packages_service_role_policy" ON packages;

-- Policy: Users can read their own packages, trainers can read all packages
CREATE POLICY "packages_select_policy" ON packages
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Trainers can create packages for clients
CREATE POLICY "packages_insert_policy" ON packages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Trainers can update packages
CREATE POLICY "packages_update_policy" ON packages
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Trainers can delete packages
CREATE POLICY "packages_delete_policy" ON packages
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role has full access
CREATE POLICY "packages_service_role_policy" ON packages
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PAYMENTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
DROP POLICY IF EXISTS "payments_update_policy" ON payments;
DROP POLICY IF EXISTS "payments_delete_policy" ON payments;
DROP POLICY IF EXISTS "payments_service_role_policy" ON payments;

-- Policy: Users can read their own payments, trainers can read all payments
CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role can create payments (for Stripe webhooks)
CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Service role can update payments
CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Trainers can delete payments
CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role has full access
CREATE POLICY "payments_service_role_policy" ON payments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- CONTRACTS TABLE POLICIES
-- ============================================================================

-- Enable RLS on contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "contracts_select_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_insert_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_update_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_delete_policy" ON contracts;
DROP POLICY IF EXISTS "contracts_service_role_policy" ON contracts;

-- Policy: Users can read their own contracts, trainers can read all contracts
CREATE POLICY "contracts_select_policy" ON contracts
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role can create contracts
CREATE POLICY "contracts_insert_policy" ON contracts
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Service role can update contracts
CREATE POLICY "contracts_update_policy" ON contracts
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Trainers can delete contracts
CREATE POLICY "contracts_delete_policy" ON contracts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role has full access
CREATE POLICY "contracts_service_role_policy" ON contracts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- DISCOUNT_CODES TABLE POLICIES
-- ============================================================================

-- Enable RLS on discount_codes table
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "discount_codes_select_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_update_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete_policy" ON discount_codes;
DROP POLICY IF EXISTS "discount_codes_service_role_policy" ON discount_codes;

-- Policy: Everyone can read discount codes (for validation)
CREATE POLICY "discount_codes_select_policy" ON discount_codes
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Trainers can create discount codes
CREATE POLICY "discount_codes_insert_policy" ON discount_codes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Trainers can update discount codes
CREATE POLICY "discount_codes_update_policy" ON discount_codes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Trainers can delete discount codes
CREATE POLICY "discount_codes_delete_policy" ON discount_codes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'trainer'
        )
    );

-- Policy: Service role has full access
CREATE POLICY "discount_codes_service_role_policy" ON discount_codes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- PASSWORD_RESET_TOKENS TABLE POLICIES
-- ============================================================================

-- Enable RLS on password_reset_tokens table
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users can insert their own reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users can update their own reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Users can delete their own reset tokens" ON password_reset_tokens;

-- Policy: Users can view their own reset tokens
CREATE POLICY "Users can view their own reset tokens" ON password_reset_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own reset tokens
CREATE POLICY "Users can insert their own reset tokens" ON password_reset_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reset tokens
CREATE POLICY "Users can update their own reset tokens" ON password_reset_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own reset tokens
CREATE POLICY "Users can delete their own reset tokens" ON password_reset_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- ADD COMMENTS AND VERIFICATION
-- ============================================================================

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view their own profile" ON users IS 'Users can view their own profile information';
COMMENT ON POLICY "Users can update their own profile" ON users IS 'Users can update their own profile information';
COMMENT ON POLICY "Trainers can view all clients" ON users IS 'Trainers can view all client profiles for client management';
COMMENT ON POLICY "Trainers can update client profiles" ON users IS 'Trainers can update client profile information';
COMMENT ON POLICY "Trainers can delete clients" ON users IS 'Only trainers can delete client accounts';
COMMENT ON POLICY "Service role has full access" ON users IS 'Service role has full access for admin operations (used by login API)';

COMMENT ON POLICY "sessions_select_policy" ON sessions IS 'Users can read sessions where they are the client or trainer';
COMMENT ON POLICY "sessions_insert_policy" ON sessions IS 'Trainers and clients can create sessions';
COMMENT ON POLICY "sessions_update_policy" ON sessions IS 'Users can update sessions where they are the client or trainer';
COMMENT ON POLICY "sessions_delete_policy" ON sessions IS 'Only trainers can delete sessions';
COMMENT ON POLICY "sessions_service_role_policy" ON sessions IS 'Service role has full access for admin operations';

COMMENT ON POLICY "packages_select_policy" ON packages IS 'Users can read their own packages, trainers can read all packages';
COMMENT ON POLICY "packages_insert_policy" ON packages IS 'Trainers can create packages for clients';
COMMENT ON POLICY "packages_update_policy" ON packages IS 'Trainers can update packages';
COMMENT ON POLICY "packages_delete_policy" ON packages IS 'Trainers can delete packages';
COMMENT ON POLICY "packages_service_role_policy" ON packages IS 'Service role has full access for admin operations';

COMMENT ON POLICY "payments_select_policy" ON payments IS 'Users can read their own payments, trainers can read all payments';
COMMENT ON POLICY "payments_insert_policy" ON payments IS 'Service role can create payments (for Stripe webhooks)';
COMMENT ON POLICY "payments_update_policy" ON payments IS 'Service role can update payments';
COMMENT ON POLICY "payments_delete_policy" ON payments IS 'Trainers can delete payments';
COMMENT ON POLICY "payments_service_role_policy" ON payments IS 'Service role has full access for admin operations';

COMMENT ON POLICY "contracts_select_policy" ON contracts IS 'Users can read their own contracts, trainers can read all contracts';
COMMENT ON POLICY "contracts_insert_policy" ON contracts IS 'Service role can create contracts';
COMMENT ON POLICY "contracts_update_policy" ON contracts IS 'Service role can update contracts';
COMMENT ON POLICY "contracts_delete_policy" ON contracts IS 'Trainers can delete contracts';
COMMENT ON POLICY "contracts_service_role_policy" ON contracts IS 'Service role has full access for admin operations';

COMMENT ON POLICY "discount_codes_select_policy" ON discount_codes IS 'Everyone can read discount codes (for validation)';
COMMENT ON POLICY "discount_codes_insert_policy" ON discount_codes IS 'Trainers can create discount codes';
COMMENT ON POLICY "discount_codes_update_policy" ON discount_codes IS 'Trainers can update discount codes';
COMMENT ON POLICY "discount_codes_delete_policy" ON discount_codes IS 'Trainers can delete discount codes';
COMMENT ON POLICY "discount_codes_service_role_policy" ON discount_codes IS 'Service role has full access for admin operations';

-- Verify all policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'sessions', 'packages', 'payments', 'contracts', 'discount_codes', 'password_reset_tokens')
ORDER BY tablename, policyname; 