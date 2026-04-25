/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user approval status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, is_approved } = body;

    if (!userId || typeof is_approved !== "boolean") {
      return NextResponse.json(
        { error: "userId and is_approved are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ is_approved, updated_at: new Date().toISOString() } as any)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error("Error in PATCH /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
