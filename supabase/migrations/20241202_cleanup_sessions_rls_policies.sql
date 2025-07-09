-- Clean up duplicate and conflicting RLS policies on sessions table
-- This will remove all existing policies and create clean, non-conflicting ones

-- Drop ALL existing policies on sessions table to start fresh
DROP POLICY IF EXISTS "Allow all authenticated users to read all sessions" ON sessions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all access for service role" ON sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Sessions: Client read" ON sessions;
DROP POLICY IF EXISTS "Sessions: Trainer access" ON sessions;

-- Create clean, non-conflicting policies

-- Policy for reading sessions (users can read their own sessions)
CREATE POLICY "sessions_select_policy" ON sessions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    );

-- Policy for inserting sessions (trainers and clients can create sessions)
CREATE POLICY "sessions_insert_policy" ON sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = trainer_id OR
        auth.uid() = client_id
    );

-- Policy for updating sessions (users can update their own sessions, including Google Calendar IDs)
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

-- Policy for deleting sessions (only trainers can delete sessions)
CREATE POLICY "sessions_delete_policy" ON sessions
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = trainer_id
    );

-- Policy for service role to have full access
CREATE POLICY "sessions_service_role_policy" ON sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Verify the policies were created correctly
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
WHERE tablename = 'sessions' AND schemaname = 'public'
ORDER BY policyname;

-- Add comments explaining the policies
COMMENT ON POLICY "sessions_select_policy" ON sessions IS 'Users can read sessions where they are the client or trainer';
COMMENT ON POLICY "sessions_insert_policy" ON sessions IS 'Trainers and clients can create sessions';
COMMENT ON POLICY "sessions_update_policy" ON sessions IS 'Users can update sessions where they are the client or trainer (allows Google Calendar ID updates)';
COMMENT ON POLICY "sessions_delete_policy" ON sessions IS 'Only trainers can delete sessions';
COMMENT ON POLICY "sessions_service_role_policy" ON sessions IS 'Service role has full access for admin operations'; 