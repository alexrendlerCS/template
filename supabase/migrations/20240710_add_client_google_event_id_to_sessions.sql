-- Add client_google_event_id to sessions table for tracking client calendar events
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS client_google_event_id text;

-- Add a comment for clarity
COMMENT ON COLUMN sessions.client_google_event_id IS 'Google Calendar event ID for the client''s calendar, used for updating/deleting client events.'; 