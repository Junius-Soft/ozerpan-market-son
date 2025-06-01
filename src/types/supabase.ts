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
          total: string;
          status: "Taslak" | "Kaydedildi" | "Revize";
          positions: Json[];
          is_dirty?: boolean;
        };
        Insert: {
          id: string;
          name: string;
          created_at: string;
          total: string;
          status: "Taslak" | "Kaydedildi" | "Revize";
          positions: Json[];
          is_dirty?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          total?: string;
          status?: "Taslak" | "Kaydedildi" | "Revize";
          positions?: Json[];
          is_dirty?: boolean;
        };
      };
    };
  };
}
