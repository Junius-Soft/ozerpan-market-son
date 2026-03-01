import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "product-prices.json");
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }

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

  const combinedData = [...productPrices, ...productAccessories];

  return NextResponse.json(combinedData, {
    status: 200,
  });
}
