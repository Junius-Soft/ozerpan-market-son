import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const accessoriesFilePath = path.join(process.cwd(), "data", "accessories.json");
const productPricesFilePath = path.join(process.cwd(), "data", "product-prices.json");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

  // Kepenk için product-prices.json'dan aksesuarları çek
  if (productId === "kepenk") {
    try {
      const productPricesData = JSON.parse(
        await fs.readFile(productPricesFilePath, "utf8")
      );
      const kepenkProducts = productPricesData.product_prices?.kepenk || [];
      
      // Sadece aksesuar tiplerini filtrele
      const accessories = kepenkProducts.filter(
        (item: { type?: string }) =>
          item.type === "kepenk_alt_parca_aksesuarlari" ||
          item.type === "kepenk_dikme_aksesuarlari" ||
          item.type === "kepenk_lamel_aksesuarlari" ||
          item.type === "kepenk_tambur_aksesuarlari"
      );

      return NextResponse.json(accessories, { status: 200 });
    } catch (error) {
      console.error("Error reading product-prices.json:", error);
      return NextResponse.json([], { status: 200 });
    }
  }

  // Diğer ürünler için accessories.json'dan çek
  try {
    const data = JSON.parse(await fs.readFile(accessoriesFilePath, "utf8"));
    return NextResponse.json(data.accessories[productId] ?? [], { status: 200 });
  } catch (error) {
    console.error("Error reading accessories.json:", error);
    return NextResponse.json([], { status: 200 });
  }
}
