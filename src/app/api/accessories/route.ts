import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from("product_prices")
      .select("description, stock_code, uretici_kodu, type, color, unit, price, currency")
      .eq("item_type", "accessory")
      .eq("product_category", productId);

    // Kepenk: aksesuar tiplerini product tablosundan al (önceki davranışla uyumlu)
    if (productId === "kepenk") {
      query = supabase
        .from("product_prices")
        .select("description, stock_code, uretici_kodu, type, color, unit, price, currency")
        .eq("product_category", "kepenk")
        .in("type", [
          "kepenk_alt_parca_aksesuarlari",
          "kepenk_dikme_aksesuarlari",
          "kepenk_lamel_aksesuarlari",
          "kepenk_tambur_aksesuarlari",
          "kepenk_kutu_aksesuarlari",
        ]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase accessories query error:", error);
      return NextResponse.json([], { status: 200 });
    }

    // price'ı string'e çevir (mevcut frontend ile uyumlu olması için)
    const result = (data || []).map((item) => ({
      ...item,
      price: String(item.price),
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Accessories API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
