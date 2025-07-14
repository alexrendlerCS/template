-- Add RLS policies for users table to support trainer operations
-- This enables trainers to view, update, and delete client records

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
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

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view their own profile" ON users IS 'Users can view their own profile information';
COMMENT ON POLICY "Users can update their own profile" ON users IS 'Users can update their own profile information';
COMMENT ON POLICY "Trainers can view all clients" ON users IS 'Trainers can view all client profiles for client management';
COMMENT ON POLICY "Trainers can update client profiles" ON users IS 'Trainers can update client profile information';
COMMENT ON POLICY "Trainers can delete clients" ON users IS 'Only trainers can delete client accounts';
COMMENT ON POLICY "Service role has full access" ON users IS 'Service role has full access for admin operations (used by login API)';

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname; 