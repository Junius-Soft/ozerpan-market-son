import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Position } from "@/documents/offers";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

// GET /api/offers/:offerId - Get a single offer
export async function GET(
  request: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await context.params;
    
    if (!offerId) {
      console.error("GET /api/offers/[offerId]: offerId is missing");
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    console.log(`GET /api/offers/${offerId}: Fetching offer...`);
    
    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error) {
      console.error(`GET /api/offers/${offerId}: Supabase error:`, error);
      
      // Handle specific Supabase errors
      if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json(
          { error: "Offer not found" },
          { status: 404 }
        );
      }
      
      throw error;
    }
    
    if (!offer) {
      console.warn(`GET /api/offers/${offerId}: Offer not found`);
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    console.log(`GET /api/offers/${offerId}: Success`);
    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error getting offer:", error);
    
    // Return more specific error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/offers/:offerId - Update offer name or status
export async function PATCH(
  request: Request,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const { offerId } = await context.params;
    const body = await request.json();
    if (!body.name && !body.status && !body.positions) {
      return NextResponse.json(
        { error: "Name, status, or positions is required" },
        { status: 400 }
      );
    }

    // If status is provided, validate it
    if (
      body.status &&
      !["Taslak", "Kaydedildi", "Revize", "Sipariş Verildi"].includes(
        body.status
      )
    ) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Build update object based on provided fields
    const updateData: {
      name?: string;
      status?: string;
      is_dirty?: boolean;
      eurRate?: number;
      positions?: Position[];
    } = {};
    if (body.name) updateData.name = body.name;
    if (body.positions) updateData.positions = body.positions;
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
      .eq("id", offerId)
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
