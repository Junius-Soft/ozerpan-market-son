import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Build time'da environment variable'lar yoksa dummy değerler kullan
// Runtime'da gerçek değerler kullanılacak
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Runtime'da kontrol - eğer gerçek değerler yoksa uyarı ver
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "⚠️ Supabase environment variables are not set. API routes may not work correctly."
    );
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Server-side admin client (RLS bypass) - sadece API route'larında kullanılmalı
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = serviceRoleKey
  ? createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // fallback: service key yoksa normal client kullan
