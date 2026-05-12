/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import type { Offer } from "@/documents/offers";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering - don't pre-render at build time
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Kullanıcı token'ı ile kimlik doğrulama yapan client
function getSupabase(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// RLS'yi bypass eden admin client (sadece server-side kullanılır)
function getAdminSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

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
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase(request);

    // Get the current user from the token
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check user role from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_approved")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    let query = supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (isAdmin) {
      // Admin: tüm teklifleri görsün (Taslak dahil)
      // Filtre yok - tüm teklifler döner
    } else {
      // Customer: sadece kendi tekliflerini görsün
      query = query.eq("user_id", user.id);
    }

    const { data: offers, error } = await query;
    
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate offer
    if (!isValidOffer(body)) {
      return NextResponse.json(
        { error: "Invalid offer data structure" },
        { status: 400 }
      );
    }

    // Kullanıcı kimliğini token ile doğrula
    const authSupabase = getSupabase(request);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - geçerli bir oturum bulunamadı" },
        { status: 401 }
      );
    }

    // RLS'yi bypass eden admin client ile kaydet (user_id doğru atanır)
    const adminSupabase = getAdminSupabase();
    const newOffer = {
      ...body,
      user_id: user.id, // Token'dan gelen gerçek user_id
    } as Offer;

    const { data, error } = await adminSupabase
      .from("offers")
      .insert([newOffer] as any)
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
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase(request);
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
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabase(request);
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
      } as any)
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
