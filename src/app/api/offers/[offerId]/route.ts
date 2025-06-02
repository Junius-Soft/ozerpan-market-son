import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/offers/:offerId - Get a single offer
export async function GET(
  request: Request,
  { params }: { params: { offerId: string } }
) {
  try {
    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", params.offerId)
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

// PATCH /api/offers/:offerId - Update offer name
export async function PATCH(
  request: Request,
  { params }: { params: { offerId: string } }
) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: offer, error: updateError } = await supabase
      .from("offers")
      .update({ name })
      .eq("id", params.offerId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error updating offer name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
