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
      offers: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          status: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions: Json[];
          is_dirty?: boolean;
          eurRate?: number; // EUR/TL exchange rate
        };
        Insert: {
          id: string;
          name: string;
          created_at: string;
          status: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions: Json[];
          is_dirty?: boolean;
          eurRate?: number;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          status?: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
          positions?: Json[];
          is_dirty?: boolean;
          eurRate?: number;
        };
      };
    };
  };
}
