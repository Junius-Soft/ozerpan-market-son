import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase'den oku
async function getFromSupabase(productId: string) {
  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from("product_prices")
    .select("description, stock_code, uretici_kodu, type, color, unit, price, currency")
    .eq("product_category", productId);

  // Sineklik: panjur verilerini de dahil et
  if (productId === "sineklik") {
    query = supabase
      .from("product_prices")
      .select("description, stock_code, uretici_kodu, type, color, unit, price, currency")
      .in("product_category", ["sineklik", "panjur"]);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  // price'ı string'e çevir (mevcut frontend ile uyumlu olması için)
  return data.map((item) => ({
    ...item,
    price: String(item.price),
  }));
}

// Fallback: JSON dosyalarından oku
async function getFromJSON(productId: string) {
  const dataFilePath = path.join(process.cwd(), "data", "product-prices.json");
  const accessoriesFilePath = path.join(process.cwd(), "data", "accessories.json");

  const data = JSON.parse(await fs.readFile(dataFilePath, "utf8"));

  let accessoriesData = { accessories: {} };
  try {
    accessoriesData = JSON.parse(await fs.readFile(accessoriesFilePath, "utf8"));
  } catch (error) {
    console.error("Failed to read accessories.json:", error);
  }

  const accRecord = accessoriesData.accessories as Record<string, unknown[]>;
  let productPrices = data.product_prices[productId] ?? [];
  let productAccessories = accRecord[productId] ?? [];

  if (productId === "sineklik") {
    const panjurPrices = data.product_prices["panjur"] ?? [];
    const panjurAccessories = accRecord["panjur"] ?? [];
    productPrices = [...productPrices, ...panjurPrices];
    productAccessories = [...productAccessories, ...panjurAccessories];
  }

  return [...productPrices, ...productAccessories];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  // Önce Supabase'den dene, hata olursa JSON'a düş
  try {
    const supabaseData = await getFromSupabase(productId);
    if (supabaseData) {
      return NextResponse.json(supabaseData, { status: 200 });
    }
  } catch (error) {
    console.warn("Supabase'den okuma başarısız, JSON'a düşülüyor:", error);
  }

  // Fallback: JSON dosyalarından oku
  const jsonData = await getFromJSON(productId);
  return NextResponse.json(jsonData, { status: 200 });
}
