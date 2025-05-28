import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { applyProductFilters, ProductTab } from "@/lib/product-filters";

const dataFilePath = path.join(process.cwd(), "data", "product-tabs.json");

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");
  const typeId = searchParams.get("typeId");
  const optionId = searchParams.get("optionId");

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  try {
    const productTabs = JSON.parse(await fs.readFile(dataFilePath, "utf8"));
    let tabs = productTabs[
      productId as keyof typeof productTabs
    ] as ProductTab[];

    if (!tabs) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    // Apply product-specific filters
    tabs = applyProductFilters(productId, tabs, optionId, typeId);
    return NextResponse.json({ tabs });
  } catch (error) {
    console.error("Error reading products:", error);
    return NextResponse.json(
      { error: "Failed to read products" },
      { status: 500 }
    );
  }
}
