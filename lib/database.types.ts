export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: "client" | "trainer";
          avatar_url: string | null;
          bio: string | null;
          credentials: string | null;
          specialties: string | null;
          status: string | null;
          assigned_trainer_id: string | null;
          membership_start_d: string | null;
          contract_signed_at: string | null;
          google_account_connected: boolean | null;
          stripe_customer_id: string | null;
          created_at: string;
          google_access_token: string | null;
          google_refresh_token: string | null;
          google_token_expiry: string | null;
          google_calendar_id: string | null;
          contract_accepted: boolean | null;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role: "client" | "trainer";
          avatar_url?: string | null;
          bio?: string | null;
          credentials?: string | null;
          specialties?: string | null;
          status?: string | null;
          assigned_trainer_id?: string | null;
          membership_start_d?: string | null;
          contract_signed_at?: string | null;
          google_account_connected?: boolean | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          google_calendar_id?: string | null;
          contract_accepted?: boolean | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: "client" | "trainer";
          avatar_url?: string | null;
          bio?: string | null;
          credentials?: string | null;
          specialties?: string | null;
          status?: string | null;
          assigned_trainer_id?: string | null;
          membership_start_d?: string | null;
          contract_signed_at?: string | null;
          google_account_connected?: boolean | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          google_calendar_id?: string | null;
          contract_accepted?: boolean | null;
        };
      };
      sessions: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string;
          date: string;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          type: "In-Person Training" | "Virtual Training" | "Partner Training";
          status: string;
          notes: string | null;
          is_recurring: boolean;
          google_event_id: string | null;
          created_at: string;
          session_notes: string | null;
          reschedule_requested_at: string | null;
          reschedule_requested_by: string | null;
          reschedule_reason: string | null;
          reschedule_proposed_date: string | null;
          reschedule_proposed_start_time: string | null;
          reschedule_proposed_end_time: string | null;
          reschedule_status: "none" | "pending" | "approved" | "denied";
          reschedule_responded_at: string | null;
          reschedule_responded_by: string | null;
          reschedule_response_note: string | null;
          client_google_event_id: string | null;
          timezone: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id: string;
          date: string;
          start_time: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          type: "In-Person Training" | "Virtual Training" | "Partner Training";
          status?: string;
          notes?: string | null;
          is_recurring?: boolean;
          google_event_id?: string | null;
          created_at?: string;
          session_notes?: string | null;
          reschedule_requested_at?: string | null;
          reschedule_requested_by?: string | null;
          reschedule_reason?: string | null;
          reschedule_proposed_date?: string | null;
          reschedule_proposed_start_time?: string | null;
          reschedule_proposed_end_time?: string | null;
          reschedule_status?: "none" | "pending" | "approved" | "denied";
          reschedule_responded_at?: string | null;
          reschedule_responded_by?: string | null;
          reschedule_response_note?: string | null;
          client_google_event_id?: string | null;
          timezone?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          trainer_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          type?: "In-Person Training" | "Virtual Training" | "Partner Training";
          status?: string;
          notes?: string | null;
          is_recurring?: boolean;
          google_event_id?: string | null;
          created_at?: string;
          session_notes?: string | null;
          reschedule_requested_at?: string | null;
          reschedule_requested_by?: string | null;
          reschedule_reason?: string | null;
          reschedule_proposed_date?: string | null;
          reschedule_proposed_start_time?: string | null;
          reschedule_proposed_end_time?: string | null;
          reschedule_status?: "none" | "pending" | "approved" | "denied";
          reschedule_responded_at?: string | null;
          reschedule_responded_by?: string | null;
          reschedule_response_note?: string | null;
          client_google_event_id?: string | null;
          timezone?: string | null;
        };
      };
      packages: {
        Row: {
          id: string;
          client_id: string;
          package_type:
            | "In-Person Training"
            | "Virtual Training"
            | "Partner Training";
          sessions_included: number;
          sessions_used: number;
          price: number | null;
          purchase_date: string;
          expiry_date: string | null;
          status: "active" | "completed" | "expired" | "cancelled";
          transaction_id: string | null;
          original_sessions: number;
          is_prorated: boolean;
        };
        Insert: {
          id?: string;
          client_id: string;
          package_type:
            | "In-Person Training"
            | "Virtual Training"
            | "Partner Training";
          sessions_included: number;
          sessions_used?: number;
          price?: number | null;
          purchase_date: string;
          expiry_date?: string | null;
          status?: "active" | "completed" | "expired" | "cancelled";
          transaction_id?: string | null;
          original_sessions: number;
          is_prorated?: boolean;
        };
        Update: {
          id?: string;
          client_id?: string;
          package_type?:
            | "In-Person Training"
            | "Virtual Training"
            | "Partner Training";
          sessions_included?: number;
          sessions_used?: number;
          price?: number | null;
          purchase_date?: string;
          expiry_date?: string | null;
          status?: "active" | "completed" | "expired" | "cancelled";
          transaction_id?: string | null;
          original_sessions?: number;
          is_prorated?: boolean;
        };
      };
      payments: {
        Row: {
          id: string;
          client_id: string;
          trainer_id: string;
          amount: number;
          session_count: number;
          method: string;
          status: string;
          transaction_id: string | null;
          paid_at: string;
          package_type: string | null;
          package_id: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          trainer_id: string;
          amount: number;
          session_count: number;
          method: string;
          status: string;
          transaction_id?: string | null;
          paid_at?: string;
          package_type?: string | null;
          package_id?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          trainer_id?: string;
          amount?: number;
          session_count?: number;
          method?: string;
          status?: string;
          transaction_id?: string | null;
          paid_at?: string;
          package_type?: string | null;
          package_id?: string | null;
        };
      };
      trainer_availability: {
        Row: {
          id: string;
          trainer_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
      };
      trainer_unavailable_slots: {
        Row: {
          id: string;
          trainer_id: string;
          date: string;
          start_time: string;
          end_time: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          date: string;
          start_time: string;
          end_time: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          sent_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          sent_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          sent_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          trainer_id: string;
          day_of_week: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
        };
        Insert: {
          id?: string;
          trainer_id: string;
          day_of_week: string;
          start_time: string;
          end_time: string;
          is_available?: boolean;
        };
        Update: {
          id?: string;
          trainer_id?: string;
          day_of_week?: string;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
        };
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          stripe_coupon_id: string | null;
          stripe_promotion_code_id: string | null;
          percent_off: number | null;
          amount_off: number | null;
          currency: string | null;
          max_redemptions: number | null;
          expires_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          stripe_coupon_id?: string | null;
          stripe_promotion_code_id?: string | null;
          percent_off?: number | null;
          amount_off?: number | null;
          currency?: string | null;
          max_redemptions?: number | null;
          expires_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          stripe_coupon_id?: string | null;
          stripe_promotion_code_id?: string | null;
          percent_off?: number | null;
          amount_off?: number | null;
          currency?: string | null;
          max_redemptions?: number | null;
          expires_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          used: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata: Json | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          target_type: string;
          target_id: string;
          metadata?: Json | null;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          metadata?: Json | null;
          timestamp?: string;
        };
      };
      client_welcome_status: {
        Row: {
          id: string;
          user_id: string;
          has_dismissed: boolean;
          dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          has_dismissed?: boolean;
          dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          has_dismissed?: boolean;
          dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          user_id: string;
          pdf_url: string | null;
          signed_at: string | null;
          contract_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pdf_url?: string | null;
          signed_at?: string | null;
          contract_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pdf_url?: string | null;
          signed_at?: string | null;
          contract_version?: number;
          created_at?: string;
        };
      };
      session_payments: {
        Row: {
          session_id: string;
          payment_id: string;
        };
        Insert: {
          session_id: string;
          payment_id: string;
        };
        Update: {
          session_id?: string;
          payment_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
