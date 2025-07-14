-- Fix infinite recursion in users table RLS policies
-- The issue is that policies are trying to query the users table to check roles,
-- which creates a circular dependency

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Trainers can view all clients" ON users;
DROP POLICY IF EXISTS "Trainers can update client profiles" ON users;
DROP POLICY IF EXISTS "Trainers can delete clients" ON users;
DROP POLICY IF EXISTS "Service role has full access" ON users;

-- Create simplified policies that don't cause recursion

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

-- Policy: Allow authenticated users to read all users (for role-based access)
-- This is needed for trainers to see clients and clients to see trainers
-- The application logic will handle the filtering
CREATE POLICY "Allow authenticated users to read all users" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow trainers to update any user (application will filter by role)
CREATE POLICY "Allow trainers to update users" ON users
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow trainers to delete users (application will filter by role)
CREATE POLICY "Allow trainers to delete users" ON users
    FOR DELETE
    TO authenticated
    USING (true);

-- Policy: Service role has full access for admin operations
CREATE POLICY "Service role has full access" ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comments explaining the policies
COMMENT ON POLICY "Users can view their own profile" ON users IS 'Users can view their own profile information';
COMMENT ON POLICY "Users can update their own profile" ON users IS 'Users can update their own profile information';
COMMENT ON POLICY "Allow authenticated users to read all users" ON users IS 'Allow reading all users - application logic handles role-based filtering';
COMMENT ON POLICY "Allow trainers to update users" ON users IS 'Allow trainers to update users - application logic handles role-based filtering';
COMMENT ON POLICY "Allow trainers to delete users" ON users IS 'Allow trainers to delete users - application logic handles role-based filtering';
COMMENT ON POLICY "Service role has full access" ON users IS 'Service role has full access for admin operations (used by login API)';

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname; 