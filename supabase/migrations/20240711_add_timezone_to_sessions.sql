-- Add timezone column to sessions table for accurate calendar event creation
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN sessions.timezone IS 'IANA timezone string (e.g., America/Denver) representing the intended timezone for the session.'; 