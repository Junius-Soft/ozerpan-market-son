import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import dotenv from "dotenv";

dotenv.config();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
