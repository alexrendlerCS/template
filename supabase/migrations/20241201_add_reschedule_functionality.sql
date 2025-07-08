-- Add reschedule functionality to sessions table
-- This migration adds fields to track reschedule requests and their status

-- Add reschedule request fields to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reschedule_requested_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reschedule_reason TEXT,
ADD COLUMN IF NOT EXISTS reschedule_proposed_date DATE,
ADD COLUMN IF NOT EXISTS reschedule_proposed_start_time TIME,
ADD COLUMN IF NOT EXISTS reschedule_proposed_end_time TIME,
ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT 'none' CHECK (reschedule_status IN ('none', 'pending', 'approved', 'denied')),
ADD COLUMN IF NOT EXISTS reschedule_responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reschedule_responded_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS reschedule_response_note TEXT;

-- Add indexes for better performance on reschedule queries
CREATE INDEX IF NOT EXISTS idx_sessions_reschedule_status ON sessions(reschedule_status);
CREATE INDEX IF NOT EXISTS idx_sessions_reschedule_requested_at ON sessions(reschedule_requested_at);
CREATE INDEX IF NOT EXISTS idx_sessions_reschedule_proposed_date ON sessions(reschedule_proposed_date);

-- Add comments to explain the new fields
COMMENT ON COLUMN sessions.reschedule_requested_at IS 'Timestamp when reschedule was requested';
COMMENT ON COLUMN sessions.reschedule_requested_by IS 'User ID who requested the reschedule';
COMMENT ON COLUMN sessions.reschedule_reason IS 'Reason provided for reschedule request';
COMMENT ON COLUMN sessions.reschedule_proposed_date IS 'Proposed new date for the session';
COMMENT ON COLUMN sessions.reschedule_proposed_start_time IS 'Proposed new start time for the session';
COMMENT ON COLUMN sessions.reschedule_proposed_end_time IS 'Proposed new end time for the session';
COMMENT ON COLUMN sessions.reschedule_status IS 'Status of reschedule request: none, pending, approved, denied';
COMMENT ON COLUMN sessions.reschedule_responded_at IS 'Timestamp when reschedule was responded to';
COMMENT ON COLUMN sessions.reschedule_responded_by IS 'User ID who responded to the reschedule';
COMMENT ON COLUMN sessions.reschedule_response_note IS 'Note from trainer when responding to reschedule request';

-- Create a function to handle reschedule approval
CREATE OR REPLACE FUNCTION approve_reschedule(session_id UUID, trainer_id UUID, response_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions 
  SET 
    date = reschedule_proposed_date,
    start_time = reschedule_proposed_start_time,
    end_time = reschedule_proposed_end_time,
    reschedule_status = 'approved',
    reschedule_responded_at = NOW(),
    reschedule_responded_by = trainer_id,
    reschedule_response_note = response_note,
    updated_at = NOW()
  WHERE id = session_id;
END;
$$;

-- Create a function to handle reschedule denial
CREATE OR REPLACE FUNCTION deny_reschedule(session_id UUID, trainer_id UUID, response_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions 
  SET 
    reschedule_status = 'denied',
    reschedule_responded_at = NOW(),
    reschedule_responded_by = trainer_id,
    reschedule_response_note = response_note,
    updated_at = NOW()
  WHERE id = session_id;
END;
$$;

-- Create a function to request reschedule
CREATE OR REPLACE FUNCTION request_reschedule(
  session_id UUID, 
  client_id UUID, 
  proposed_date DATE, 
  proposed_start_time TIME, 
  proposed_end_time TIME, 
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions 
  SET 
    reschedule_requested_at = NOW(),
    reschedule_requested_by = client_id,
    reschedule_reason = reason,
    reschedule_proposed_date = proposed_date,
    reschedule_proposed_start_time = proposed_start_time,
    reschedule_proposed_end_time = proposed_end_time,
    reschedule_status = 'pending',
    status = 'pending',
    updated_at = NOW()
  WHERE id = session_id AND client_id = client_id;
END;
$$; 