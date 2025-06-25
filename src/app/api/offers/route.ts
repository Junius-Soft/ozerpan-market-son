import { NextResponse } from "next/server";
import type { Offer } from "@/documents/offers";
import { supabase } from "@/lib/supabase";

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
    typeof obj.created_at === "string" &&
    typeof obj.status === "string" &&
    ["Taslak", "Kaydedildi", "Revize", "Sipariş Verildi"].includes(
      obj.status
    ) &&
    Array.isArray(obj.positions)
  );
};

// GET /api/offers
export async function GET() {
  try {
    const { data: offers, error } = await supabase.from("offers").select("*");
    if (error) {
      throw error;
    }

    // Validate each offer
    if (!offers.every(isValidOffer)) {
      console.error("Invalid offer data format");
      return NextResponse.json([], { status: 400 });
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

    const { data, error } = await supabase
      .from("offers")
      .insert([newOffer])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, offer: data });
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

    const { error } = await supabase.from("offers").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/offers/:id - Update an offer's positions
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    if (!body.positions || !Array.isArray(body.positions)) {
      return NextResponse.json(
        { error: "Invalid positions data" },
        { status: 400 }
      );
    }

    // Get the current offer
    const { data: offer, error: getError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !offer) {
      throw getError || new Error("Offer not found");
    }

    // Update the offer with new positions and totals
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        positions: body.positions,
        is_dirty: true,
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/offers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
