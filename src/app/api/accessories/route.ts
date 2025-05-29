import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "accessories.json");
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    );
  }
  const data = JSON.parse(await fs.readFile(dataFilePath, "utf8"));
  // For now, we're returning all accessories since the JSON structure doesn't have productId mapping
  // You can implement filtering logic based on productId when needed
  const productAccessories = data.accessories.panjur;
  return NextResponse.json({ productAccessories });
}
