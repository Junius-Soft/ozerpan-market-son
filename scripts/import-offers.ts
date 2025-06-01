import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function importOffers() {
  try {
    // Read the offers.json file
    const offersPath = path.join(__dirname, "..", "data", "offers.json");
    const offersData = JSON.parse(fs.readFileSync(offersPath, "utf8"));

    // Insert data into Supabase
    const { data, error } = await supabase
      .from("offers")
      .insert(offersData)
      .select();

    if (error) {
      throw error;
    }

    console.log("Successfully imported offers:", data);
  } catch (error) {
    console.error("Error importing offers:", error);
  }
}

// Run the import
importOffers();
