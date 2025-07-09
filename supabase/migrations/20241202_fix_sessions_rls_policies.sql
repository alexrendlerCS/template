-- Fix RLS policies for sessions table to allow clients to update their own sessions
-- This is needed for clients to update google_event_id and client_google_event_id fields

-- First, let's see what policies currently exist on the sessions table
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
WHERE tablename = 'sessions' AND schemaname = 'public';

-- Drop existing policies on sessions table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all access for service role" ON sessions;
DROP POLICY IF EXISTS "Allow service role full access" ON sessions;

-- Create new policies that allow proper access

-- Policy for reading sessions (users can read their own sessions)
CREATE POLICY "Enable read access for authenticated users" ON sessions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    );

-- Policy for inserting sessions (trainers can create sessions for clients)
CREATE POLICY "Enable insert for authenticated users" ON sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = trainer_id OR
        auth.uid() = client_id
    );

-- Policy for updating sessions (users can update their own sessions, including Google Calendar IDs)
CREATE POLICY "Enable update for authenticated users" ON sessions
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

-- Policy for deleting sessions (trainers can delete sessions they created)
CREATE POLICY "Enable delete for authenticated users" ON sessions
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = trainer_id
    );

-- Policy for service role to have full access
CREATE POLICY "Enable all access for service role" ON sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

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
WHERE tablename = 'sessions' AND schemaname = 'public'
ORDER BY policyname;

-- Add comments explaining the policies
COMMENT ON POLICY "Enable read access for authenticated users" ON sessions IS 'Users can read sessions where they are the client or trainer';
COMMENT ON POLICY "Enable insert for authenticated users" ON sessions IS 'Trainers and clients can create sessions';
COMMENT ON POLICY "Enable update for authenticated users" ON sessions IS 'Users can update sessions where they are the client or trainer (allows Google Calendar ID updates)';
COMMENT ON POLICY "Enable delete for authenticated users" ON sessions IS 'Only trainers can delete sessions';
COMMENT ON POLICY "Enable all access for service role" ON sessions IS 'Service role has full access for admin operations'; 