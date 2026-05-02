/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Position } from "@/documents/offers";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseKey);
}

// DELETE /api/offers/:offerId/positions - Delete multiple positions
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const supabase = getSupabase(request);
    const { offerId } = await context.params;
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
    const updatedPositions = (offer.positions as any[]).filter(
      (pos: Position) => !positionIds.includes(pos.id)
    );

    // Update the offer with remaining positions
    const { error: updateError } = await supabase
      .from("offers")
      .update({
        positions: updatedPositions,
        is_dirty: true,
      } as any)
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
