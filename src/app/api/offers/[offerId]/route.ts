/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// GET /api/offers/:offerId - Get a single offer
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const supabase = getSupabase(request);
    const { offerId } = await context.params;
    
    if (!offerId) {
      return NextResponse.json(
        { error: "Offer ID is required" },
        { status: 400 }
      );
    }

    const { data: offer, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Offer not found" },
          { status: 404 }
        );
      }
      throw error;
    }
    
    if (!offer) {
      return NextResponse.json(
        { error: "Offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(offer);
  } catch (error) {
    console.error("Error getting offer:", error);
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
  request: NextRequest,
  context: { params: Promise<{ offerId: string }> }
) {
  try {
    const supabase = getSupabase(request);
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
    const updateData: Record<string, any> = {};
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
      .update(updateData as any)
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
