/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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

// DELETE /api/admin/users?userId=xxx - Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // 1. Kullanıcının tekliflerini sil
    const { error: offersError } = await supabaseAdmin
      .from("offers")
      .delete()
      .eq("user_id", userId);

    if (offersError) {
      console.error("Error deleting user offers:", offersError);
    }

    // 2. Profili sil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }

    // 3. Auth kullanıcısını sil
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.warn("Auth user deletion failed:", authError.message);
      }
    } catch (e) {
      console.warn("Auth user deletion error:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
