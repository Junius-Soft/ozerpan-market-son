import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "products.json");

// GET /api/products
export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error reading products:", error);
    return NextResponse.json(
      { error: "Failed to read products" },
      { status: 500 }
    );
  }
}
