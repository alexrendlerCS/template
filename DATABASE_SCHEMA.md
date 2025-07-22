# Database Schema Documentation

## Overview

This document describes the complete database schema for the fitness training application, including all tables, relationships, and security policies.

## Core Tables

### 1. `users` Table

**Purpose**: Stores user profiles for both clients and trainers.

**Key Fields**:

- `id` (uuid, PK): Unique user identifier
- `full_name` (text): User's full name
- `email` (text): User's email address
- `role` (text): Either "client" or "trainer"
- `avatar_url` (text, nullable): URL to user's avatar image
- `bio` (text, nullable): User's bio/description
- `credentials` (text, nullable): Trainer's credentials
- `specialties` (text, nullable): Trainer's specialties
- `status` (text, nullable): User status
- `assigned_trainer_id` (uuid, nullable): For clients, their assigned trainer
- `contract_accepted` (boolean, nullable): Whether user has accepted terms
- `google_account_connected` (boolean, nullable): Google Calendar connection status
- `google_calendar_id` (text, nullable): User's Google Calendar ID
- `google_access_token` (text, nullable): Google OAuth access token
- `google_refresh_token` (text, nullable): Google OAuth refresh token
- `stripe_customer_id` (text, nullable): Stripe customer ID for payments

**Relationships**:

- Referenced by `sessions` (as client_id and trainer_id)
- Referenced by `packages` (as client_id)
- Referenced by `payments` (as client_id and trainer_id)
- Referenced by `trainer_availability` (as trainer_id)
- Referenced by `trainer_unavailable_slots` (as trainer_id)

### 2. `sessions` Table

**Purpose**: Stores individual training sessions between clients and trainers.

**Key Fields**:

- `id` (uuid, PK): Unique session identifier
- `client_id` (uuid, FK): Reference to client in users table
- `trainer_id` (uuid, FK): Reference to trainer in users table
- `date` (date): Session date
- `start_time` (time): Session start time
- `end_time` (time, nullable): Session end time
- `duration_minutes` (int, nullable): Session duration in minutes
- `type` (text): Session type - "In-Person Training", "Virtual Training", or "Partner Training"
- `status` (text): Session status (e.g., "confirmed", "pending", "cancelled")
- `notes` (text, nullable): General session notes
- `session_notes` (text, nullable): Trainer's session notes
- `is_recurring` (boolean): Whether session is part of recurring series
- `google_event_id` (text, nullable): Google Calendar event ID for trainer
- `client_google_event_id` (text, nullable): Google Calendar event ID for client
- `timezone` (text, nullable): Session timezone (defaults to "America/Denver")

**Reschedule Fields**:

- `reschedule_requested_at` (timestamp, nullable): When reschedule was requested
- `reschedule_requested_by` (uuid, nullable): Who requested reschedule
- `reschedule_reason` (text, nullable): Reason for reschedule request
- `reschedule_proposed_date` (date, nullable): Proposed new date
- `reschedule_proposed_start_time` (time, nullable): Proposed new start time
- `reschedule_proposed_end_time` (time, nullable): Proposed new end time
- `reschedule_status` (text): "none", "pending", "approved", or "denied"
- `reschedule_responded_at` (timestamp, nullable): When reschedule was responded to
- `reschedule_responded_by` (uuid, nullable): Who responded to reschedule
- `reschedule_response_note` (text, nullable): Response note from trainer

**Relationships**:

- References `users` (client_id and trainer_id)
- Referenced by `session_payments` (as session_id)

### 3. `packages` Table

**Purpose**: Manages session packages purchased by clients.

**Key Fields**:

- `id` (uuid, PK): Unique package identifier
- `client_id` (uuid, FK): Reference to client in users table
- `package_type` (text): Package type - "In-Person Training", "Virtual Training", or "Partner Training"
- `sessions_included` (int): Total sessions in package
- `sessions_used` (int): Number of sessions used
- `price` (numeric, nullable): Package price
- `purchase_date` (date): When package was purchased
- `expiry_date` (date, nullable): When package expires
- `status` (text): "active", "completed", "expired", or "cancelled"
- `transaction_id` (text, nullable): Stripe transaction ID
- `original_sessions` (int): Original session count before proration
- `is_prorated` (boolean): Whether package was prorated

**Relationships**:

- References `users` (client_id)
- Referenced by `payments` (as package_id)

### 4. `payments` Table

**Purpose**: Records payment transactions.

**Key Fields**:

- `id` (uuid, PK): Unique payment identifier
- `client_id` (uuid, FK): Reference to client in users table
- `trainer_id` (uuid, FK): Reference to trainer in users table
- `amount` (numeric): Payment amount
- `session_count` (int): Number of sessions purchased
- `method` (text): Payment method
- `status` (text): Payment status
- `transaction_id` (text, nullable): Stripe transaction ID
- `paid_at` (timestamp): When payment was made
- `package_type` (text, nullable): Type of package purchased
- `package_id` (uuid, nullable): Reference to package in packages table

**Relationships**:

- References `users` (client_id and trainer_id)
- References `packages` (package_id)
- Referenced by `session_payments` (as payment_id)

## Supporting Tables

### 5. `trainer_availability` Table

**Purpose**: Defines general availability of trainers.

**Key Fields**:

- `id` (uuid, PK): Unique availability record identifier
- `trainer_id` (uuid, FK): Reference to trainer in users table
- `weekday` (int): Day of week (0=Sunday, 1=Monday, etc.)
- `start_time` (time): Available start time
- `end_time` (time): Available end time
- `created_at` (timestamp): When record was created

### 6. `trainer_unavailable_slots` Table

**Purpose**: Records specific times when trainers are unavailable.

**Key Fields**:

- `id` (uuid, PK): Unique unavailable slot identifier
- `trainer_id` (uuid, FK): Reference to trainer in users table
- `date` (date): Date of unavailability
- `start_time` (time): Start time of unavailability
- `end_time` (time): End time of unavailability
- `reason` (text, nullable): Reason for unavailability
- `created_at` (timestamp): When record was created

### 7. `availability` Table

**Purpose**: Alternative availability tracking (appears to be legacy).

**Key Fields**:

- `id` (uuid, PK): Unique availability record identifier
- `trainer_id` (uuid, FK): Reference to trainer in users table
- `day_of_week` (text): Day of week as text
- `start_time` (time): Available start time
- `end_time` (time): Available end time
- `is_available` (boolean): Whether trainer is available

### 8. `notifications` Table

**Purpose**: Stores user notifications.

**Key Fields**:

- `id` (uuid, PK): Unique notification identifier
- `user_id` (uuid, FK): Reference to user in users table
- `type` (text): Notification type
- `content` (text): Notification content
- `is_read` (boolean): Whether notification has been read
- `created_at` (timestamp): When notification was created

### 9. `messages` Table

**Purpose**: Stores messages between users.

**Key Fields**:

- `id` (uuid, PK): Unique message identifier
- `sender_id` (uuid, FK): Reference to sender in users table
- `receiver_id` (uuid, FK): Reference to receiver in users table
- `content` (text): Message content
- `is_read` (boolean): Whether message has been read
- `sent_at` (timestamp): When message was sent

### 10. `session_payments` Table

**Purpose**: Links sessions to payments (many-to-many relationship).

**Key Fields**:

- `session_id` (uuid, FK): Reference to session in sessions table
- `payment_id` (uuid, FK): Reference to payment in payments table

### 11. `discount_codes` Table

**Purpose**: Manages discount codes for packages.

**Key Fields**:

- `id` (uuid, PK): Unique discount code identifier
- `code` (text): Discount code
- `stripe_coupon_id` (text, nullable): Stripe coupon ID
- `stripe_promotion_code_id` (text, nullable): Stripe promotion code ID
- `percent_off` (int, nullable): Percentage discount
- `amount_off` (numeric, nullable): Fixed amount discount
- `currency` (text, nullable): Currency for amount discount
- `max_redemptions` (int, nullable): Maximum number of redemptions
- `expires_at` (timestamp, nullable): When discount expires
- `created_by` (uuid, FK): Reference to creator in users table
- `created_at` (timestamp): When discount was created

### 12. `password_reset_tokens` Table

**Purpose**: Stores tokens for password reset functionality.

**Key Fields**:

- `id` (uuid, PK): Unique token identifier
- `user_id` (uuid, FK): Reference to user in users table
- `token` (text): Reset token
- `expires_at` (timestamp): When token expires
- `used` (boolean): Whether token has been used
- `created_at` (timestamp): When token was created
- `updated_at` (timestamp): When token was last updated

### 13. `activity_log` Table

**Purpose**: Logs various activities within the system.

**Key Fields**:

- `id` (uuid, PK): Unique log entry identifier
- `user_id` (uuid, FK): Reference to user in users table
- `action` (text): Action performed
- `target_type` (text): Type of target (e.g., "session", "package")
- `target_id` (uuid): ID of target object
- `metadata` (jsonb, nullable): Additional metadata
- `timestamp` (timestamp): When action occurred

### 14. `client_welcome_status` Table

**Purpose**: Tracks client welcome process status.

**Key Fields**:

- `id` (uuid, PK): Unique status record identifier
- `user_id` (uuid, FK): Reference to user in users table
- `has_dismissed` (boolean): Whether welcome was dismissed
- `dismissed_at` (timestamp, nullable): When welcome was dismissed
- `created_at` (timestamp): When record was created
- `updated_at` (timestamp): When record was last updated

### 15. `contracts` Table

**Purpose**: Stores information about user contracts.

**Key Fields**:

- `id` (uuid, PK): Unique contract identifier
- `user_id` (uuid, FK): Reference to user in users table
- `pdf_url` (text, nullable): URL to contract PDF
- `signed_at` (timestamp, nullable): When contract was signed
- `contract_version` (int): Contract version number
- `created_at` (timestamp): When contract was created

## Row Level Security (RLS) Policies

### Sessions Table RLS

The sessions table has comprehensive RLS policies:

1. **sessions_select_policy**: Users can read sessions where they are the client or trainer
2. **sessions_insert_policy**: Trainers and clients can create sessions
   
   ```sql
   CREATE POLICY "sessions_insert_policy" ON sessions
       FOR INSERT
       TO authenticated
       WITH CHECK (
           auth.uid() = trainer_id OR auth.uid() = client_id
       );
   ```
3. **sessions_update_policy**: Users can update sessions where they are the client or trainer
4. **sessions_delete_policy**: Only trainers can delete sessions
5. **sessions_service_role_policy**: Service role has full access for admin operations

### Other Tables

All other tables have appropriate RLS policies based on their purpose and access patterns.

## Indexes

### Sessions Table Indexes

- `idx_sessions_client_id`: For querying sessions by client
- `idx_sessions_trainer_id`: For querying sessions by trainer
- `idx_sessions_date`: For querying sessions by date
- `idx_sessions_date_start_time`: Composite index for date and time queries
- `idx_sessions_status`: For filtering by session status
- `idx_sessions_type`: For filtering by session type

## Default Values

### Sessions Table

- `timezone`: Defaults to "America/Denver"
- `reschedule_status`: Defaults to "none"
- `is_recurring`: Defaults to false

### Packages Table

- `sessions_used`: Defaults to 0
- `status`: Defaults to "active"
- `is_prorated`: Defaults to false

## Common Queries

### Get Sessions by Date

```sql
SELECT
    s.id,
    s.client_id,
    s.trainer_id,
    s.date,
    s.start_time,
    s.end_time,
    s.type,
    s.status,
    s.timezone,
    c.full_name as client_name,
    t.full_name as trainer_name
FROM sessions s
LEFT JOIN users c ON s.client_id = c.id
LEFT JOIN users t ON s.trainer_id = t.id
WHERE s.date = '2025-07-15'
ORDER BY s.start_time ASC;
```

### Get Client's Remaining Sessions

```sql
SELECT
    p.package_type,
    p.sessions_included,
    p.sessions_used,
    (p.sessions_included - p.sessions_used) as remaining
FROM packages p
WHERE p.client_id = 'client-uuid-here'
  AND p.status = 'active'
ORDER BY p.purchase_date DESC;
```

### Get Trainer's Today's Sessions

```sql
SELECT
    s.id,
    s.start_time,
    s.end_time,
    s.type,
    s.status,
    c.full_name as client_name
FROM sessions s
LEFT JOIN users c ON s.client_id = c.id
WHERE s.trainer_id = 'trainer-uuid-here'
  AND s.date = CURRENT_DATE
ORDER BY s.start_time ASC;
```

## Notes

1. **Timezone Handling**: All sessions default to "America/Denver" timezone
2. **Session Types**: Only three types are supported: "In-Person Training", "Virtual Training", "Partner Training"
3. **Package Status**: Four statuses: "active", "completed", "expired", "cancelled"
4. **User Roles**: Only two roles: "client" and "trainer"
5. **Google Calendar Integration**: Both users and sessions tables store Google Calendar related fields
6. **Security**: RLS is enabled on all tables with appropriate policies for data protection
