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
          email: string;
          full_name: string;
          role: "client" | "trainer";
          contract_accepted: boolean;
          google_account_connected: boolean;
          created_at: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: "client" | "trainer";
          contract_accepted?: boolean;
          google_account_connected?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "client" | "trainer";
          contract_accepted?: boolean;
          google_account_connected?: boolean;
          created_at?: string;
          updated_at?: string;
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
