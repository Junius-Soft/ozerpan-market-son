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
      product_prices: {
        Row: {
          id: string;
          product_category: string;
          item_type: string;
          description: string;
          stock_code: string | null;
          uretici_kodu: string | null;
          type: string | null;
          color: string | null;
          unit: string | null;
          price: number;
          previous_price: number | null;
          currency: string;
          price_updated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_category: string;
          item_type?: string;
          description: string;
          stock_code?: string | null;
          uretici_kodu?: string | null;
          type?: string | null;
          color?: string | null;
          unit?: string | null;
          price: number;
          previous_price?: number | null;
          currency?: string;
          price_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_category?: string;
          item_type?: string;
          description?: string;
          stock_code?: string | null;
          uretici_kodu?: string | null;
          type?: string | null;
          color?: string | null;
          unit?: string | null;
          price?: number;
          previous_price?: number | null;
          currency?: string;
          price_updated_at?: string;
          updated_at?: string;
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
