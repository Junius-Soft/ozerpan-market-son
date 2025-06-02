import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export type OfferContext = {
  params: {
    offerId: string;
  };
};

// GET /api/offers/:offerId - Get a single offer
export async function GET(request: NextRequest, context: OfferContext) {
  try {
    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", context.params.offerId)
      .single();

    if (error) throw error;
    if (!offer)
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error getting offer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/offers/:offerId - Update offer name or status
export async function PATCH(request: NextRequest, context: OfferContext) {
  try {
    const body = await request.json();
    if (!body.name && !body.status) {
      return NextResponse.json(
        { error: "Name or status is required" },
        { status: 400 }
      );
    }

    // If status is provided, validate it
    if (
      body.status &&
      !["Taslak", "Kaydedildi", "Revize"].includes(body.status)
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object based on provided fields
    const updateData: {
      name?: string;
      status?: string;
      is_dirty?: boolean;
      eurRate?: number;
    } = {};
    if (body.name) updateData.name = body.name;
    if (body.status) {
      updateData.status = body.status;
      // When saving a draft, mark it as not dirty
      if (body.status === "Kaydedildi") {
        updateData.is_dirty = false;
        updateData.eurRate = body.eurRate; // Save EUR rate if provided
      }
    }

    const { data: offer, error: updateError } = await supabase
      .from("offers")
      .update(updateData)
      .eq("id", context.params.offerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
