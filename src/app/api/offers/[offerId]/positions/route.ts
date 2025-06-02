import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Position } from "@/documents/offers";

// DELETE /api/offers/:offerId/positions - Delete multiple positions
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const offerId = url.searchParams.get("id");
    // Get position IDs from request body
    const { positionIds } = await request.json();
    if (!Array.isArray(positionIds) || positionIds.length === 0) {
      return NextResponse.json(
        { error: "Position IDs array is required" },
        { status: 400 }
      );
    }

    // Get current offer
    const { data: offer, error: getError } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (getError || !offer) {
      throw getError || new Error("Offer not found");
    }

    // Filter out the positions to be deleted
    const updatedPositions = offer.positions.filter(
      (pos: Position) => !positionIds.includes(pos.id)
    );

    // Update the offer with remaining positions
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        positions: updatedPositions,
        is_dirty: true,
      })
      .eq("id", offerId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting positions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
