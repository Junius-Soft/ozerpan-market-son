import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Offer } from "@/documents/offers";

const dataFilePath = path.join(process.cwd(), "data", "offers.json");

// Ensure the data directory exists
const ensureDataDirectory = async () => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

interface UnknownObject {
  [key: string]: unknown;
}

// Validate offer data
const isValidOffer = (offer: unknown): offer is Offer => {
  const obj = offer as UnknownObject;
  return (
    typeof offer === "object" &&
    offer !== null &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.createdAt === "string" &&
    typeof obj.total === "string" &&
    typeof obj.status === "string" &&
    ["Taslak", "Kaydedildi", "Revize"].includes(obj.status) &&
    Array.isArray(obj.positions)
  );
};

// GET /api/offers
export async function GET() {
  try {
    await ensureDataDirectory();

    let offers: unknown;
    try {
      const data = await fs.readFile(dataFilePath, "utf8");
      offers = JSON.parse(data);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        // If file doesn't exist, create with empty array
        const initialOffers: Offer[] = [];
        await fs.writeFile(
          dataFilePath,
          JSON.stringify(initialOffers, null, 2)
        );
        return NextResponse.json(initialOffers);
      }
      throw error;
    }

    // Validate data structure
    if (!Array.isArray(offers)) {
      console.error("Invalid offers data structure");
      const initialOffers: Offer[] = [];
      await fs.writeFile(dataFilePath, JSON.stringify(initialOffers, null, 2));
      return NextResponse.json(initialOffers);
    }

    // Validate each offer
    if (!offers.every(isValidOffer)) {
      console.error("Invalid offer data format");
      const initialOffers: Offer[] = [];
      await fs.writeFile(dataFilePath, JSON.stringify(initialOffers, null, 2));
      return NextResponse.json(initialOffers);
    }

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error in GET /api/offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/offers - Add a new offer
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate offer
    if (!isValidOffer(body)) {
      return NextResponse.json(
        { error: "Invalid offer data structure" },
        { status: 400 }
      );
    }

    const newOffer = body as Offer;
    await ensureDataDirectory();

    try {
      // Read existing offers
      let offers: Offer[] = [];
      try {
        const data = await fs.readFile(dataFilePath, "utf8");
        offers = JSON.parse(data);
      } catch (error) {
        if (
          !(
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
          )
        ) {
          throw error;
        }
      }

      // Add new offer
      offers.push(newOffer);
      await fs.writeFile(dataFilePath, JSON.stringify(offers, null, 2));
      return NextResponse.json({ success: true, offer: newOffer });
    } catch (error) {
      console.error("Error adding offer:", error);
      return NextResponse.json(
        { error: "Failed to add offer" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/offers/:id - Delete an offer
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    try {
      // Read existing offers
      const data = await fs.readFile(dataFilePath, "utf8");
      let offers: Offer[] = JSON.parse(data);

      // Remove offer
      offers = offers.filter((offer) => offer.id !== id);
      await fs.writeFile(dataFilePath, JSON.stringify(offers, null, 2));

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Error deleting offer:", error);
      return NextResponse.json(
        { error: "Failed to delete offer" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE /api/offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
