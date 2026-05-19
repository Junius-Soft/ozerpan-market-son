/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// RLS bypass eden admin client - service role key ile doğrudan bağlantı
function getAdminClient() {
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY env değişkeni eksik!");
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Sitenin gerçek URL'ini al (localhost yerine production URL)
function getSiteUrl(request: Request): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const origin = request.headers.get("origin") || request.headers.get("host");
  if (origin) {
    return origin.startsWith("http") ? origin : `https://${origin}`;
  }
  return "http://localhost:3000";
}

// GET /api/admin/users - Tüm kullanıcıları getir (admin only)
export async function GET() {
  try {
    const adminClient = getAdminClient();
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    console.log(`[admin/users] GET: ${users?.length ?? 0} kullanıcı bulundu`);
    return NextResponse.json(users || []);
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Yeni kullanıcıyı e-posta ile davet et
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role = "user" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminClient();
    const siteUrl = getSiteUrl(request);
    const redirectTo = `${siteUrl}/`;

    // Supabase admin ile kullanıcıyı davet et
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { role },
    });

    if (error) {
      console.error("Error inviting user:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log(`[admin/users] POST: ${email} adresine davet gönderildi, redirectTo: ${redirectTo}`);
    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    console.error("Error in POST /api/admin/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Kullanıcı onay durumunu güncelle
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

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
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

// DELETE /api/admin/users?userId=xxx - Kullanıcıyı sil
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

    const adminClient = getAdminClient();

    // 1. Kullanıcının tekliflerini sil
    const { error: offersError } = await adminClient
      .from("offers")
      .delete()
      .eq("user_id", userId);

    if (offersError) {
      console.error("Error deleting user offers:", offersError);
    }

    // 2. Profili sil
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw profileError;
    }

    // 3. Auth kullanıcısını sil
    try {
      const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
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
