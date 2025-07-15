-- Fix sessions table RLS policies and ensure proper security
-- This migration enables RLS on sessions table with proper policies for trainers and clients

-- First, enable RLS on sessions table if not already enabled
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "sessions_select_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_policy" ON sessions;
DROP POLICY IF EXISTS "sessions_service_role_policy" ON sessions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sessions;
DROP POLICY IF EXISTS "Enable all access for service role" ON sessions;
DROP POLICY IF EXISTS "trainers_view_all_sessions" ON sessions;

-- Create comprehensive RLS policies for sessions table

-- Policy: Users can read sessions where they are the client or trainer
CREATE POLICY "sessions_select_policy" ON sessions
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR 
        auth.uid() = trainer_id
    );

-- Policy: Trainers can create sessions for any client
CREATE POLICY "sessions_insert_policy" ON sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = trainer_id
    );

-- Policy: Users can update sessions where they are the client or trainer
-- This allows both clients and trainers to update session details
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

-- Policy: Service role has full access for admin operations
CREATE POLICY "sessions_service_role_policy" ON sessions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comments explaining the policies
COMMENT ON POLICY "sessions_select_policy" ON sessions IS 'Users can read sessions where they are the client or trainer';
COMMENT ON POLICY "sessions_insert_policy" ON sessions IS 'Only trainers can create sessions';
COMMENT ON POLICY "sessions_update_policy" ON sessions IS 'Users can update sessions where they are the client or trainer (allows Google Calendar ID updates)';
COMMENT ON POLICY "sessions_delete_policy" ON sessions IS 'Only trainers can delete sessions';
COMMENT ON POLICY "sessions_service_role_policy" ON sessions IS 'Service role has full access for admin operations';

-- Set default timezone for sessions table
-- Update existing sessions to have America/Denver timezone if not set
UPDATE sessions 
SET timezone = 'America/Denver' 
WHERE timezone IS NULL;

-- Add a default value for new sessions
ALTER TABLE sessions 
ALTER COLUMN timezone SET DEFAULT 'America/Denver';

-- Add comment to timezone column
COMMENT ON COLUMN sessions.timezone IS 'IANA timezone string (e.g., America/Denver) representing the intended timezone for the session. Defaults to America/Denver.';

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

-- Add indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer_id ON sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_date_start_time ON sessions(date, start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

-- Add comments for the indexes
COMMENT ON INDEX idx_sessions_client_id IS 'Index for querying sessions by client';
COMMENT ON INDEX idx_sessions_trainer_id IS 'Index for querying sessions by trainer';
COMMENT ON INDEX idx_sessions_date IS 'Index for querying sessions by date';
COMMENT ON INDEX idx_sessions_date_start_time IS 'Composite index for date and time queries';
COMMENT ON INDEX idx_sessions_status IS 'Index for filtering by session status';
COMMENT ON INDEX idx_sessions_type IS 'Index for filtering by session type'; 