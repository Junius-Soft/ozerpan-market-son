export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "customer";

export interface Database {
  public: {
    Tables: {
      offers: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          status: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions: Json[];
          is_dirty?: boolean;
          eurRate?: number;
          user_id?: string;
        };
        Insert: {
          id: string;
          name: string;
          created_at: string;
          status: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions: Json[];
          is_dirty?: boolean;
          eurRate?: number;
          user_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          status?: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions?: Json[];
          is_dirty?: boolean;
          eurRate?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          phone: string | null;
          company: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          company?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          phone?: string | null;
          company?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
