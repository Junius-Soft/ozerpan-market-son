import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Fiyatı her zaman 2 basamağa yuvarla
function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

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

// GET: Fiyat listesini getir (filtreleme, arama, sayfalama)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const itemType = searchParams.get("itemType");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const sortBy = searchParams.get("sortBy") || "description";
  const sortOrder = searchParams.get("sortOrder") || "asc";

  const supabase = getSupabase(request);

  let query = supabase
    .from("product_prices")
    .select("*", { count: "exact" });

  // Filtreler
  if (category && category !== "all") {
    query = query.eq("product_category", category);
  }
  if (itemType && itemType !== "all") {
    query = query.eq("item_type", itemType);
  }
  if (type && type !== "all") {
    query = query.eq("type", type);
  }
  if (search) {
    query = query.or(
      `description.ilike.%${search}%,stock_code.ilike.%${search}%,uretici_kodu.ilike.%${search}%`
    );
  }

  // Sıralama
  const ascending = sortOrder === "asc";
  query = query.order(sortBy, { ascending });

  // Sayfalama
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}

// PATCH: Fiyat güncelle (tek ürün)
export async function PATCH(request: NextRequest) {
  const supabase = getSupabase(request);
  const body = await request.json();
  const { id, price, description, stock_code, uretici_kodu, color, unit, currency } = body;

  if (!id) {
    return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (price !== undefined) updateData.price = roundPrice(parseFloat(price));
  if (description !== undefined) updateData.description = description;
  if (stock_code !== undefined) updateData.stock_code = stock_code;
  if (uretici_kodu !== undefined) updateData.uretici_kodu = uretici_kodu;
  if (color !== undefined) updateData.color = color;
  if (unit !== undefined) updateData.unit = unit;
  if (currency !== undefined) updateData.currency = currency;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("product_prices")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Toplu fiyat güncelleme (yüzde bazlı artırma/azaltma)
export async function POST(request: NextRequest) {
  const supabase = getSupabase(request);
  const body = await request.json();
  const { action, ids, percentage } = body;

  if (action === "bulk_update") {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids dizisi gerekli" }, { status: 400 });
    }
    if (percentage === undefined || isNaN(percentage)) {
      return NextResponse.json({ error: "percentage gerekli" }, { status: 400 });
    }

    // Önce mevcut fiyatları al
    const { data: currentPrices, error: fetchError } = await supabase
      .from("product_prices")
      .select("id, price")
      .in("id", ids);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Her birini güncelle
    const multiplier = 1 + percentage / 100;
    let successCount = 0;
    let errorCount = 0;

    for (const item of currentPrices || []) {
      const newPrice = roundPrice(item.price * multiplier);
      const { error: updateError } = await supabase
        .from("product_prices")
        .update({ price: newPrice })
        .eq("id", item.id);

      if (updateError) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      message: `${successCount} ürün güncellendi${errorCount > 0 ? `, ${errorCount} hata` : ""}`,
      successCount,
      errorCount,
    });
  }

  // Tüm distinct type'ları getir (filtre seçenekleri için)
  if (action === "get_filters") {
    const { data: types } = await supabase
      .from("product_prices")
      .select("type, product_category")
      .not("type", "is", null);

    const uniqueTypes = [...new Set((types || []).map((t) => t.type))].filter(Boolean).sort();
    const uniqueCategories = [...new Set((types || []).map((t) => t.product_category))].filter(Boolean).sort();

    return NextResponse.json({ types: uniqueTypes, categories: uniqueCategories });
  }

  // Excel ile toplu fiyat güncelleme
  if (action === "excel_update") {
    const { updates } = body;
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates dizisi gerekli" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of updates) {
      const { id, price } = item;
      if (!id || price === undefined) {
        errorCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from("product_prices")
        .update({
          price: roundPrice(parseFloat(price)),
          price_updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        errorCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({
      message: `${successCount} ürün güncellendi${errorCount > 0 ? `, ${errorCount} hata` : ""}`,
      successCount,
      errorCount,
    });
  }

  return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
}

// DELETE: Ürün sil (tekli veya çoklu)
export async function DELETE(request: NextRequest) {
  const supabase = getSupabase(request);
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const idsParam = searchParams.get("ids");

  if (idsParam) {
    // Çoklu silme
    const ids = idsParam.split(",");
    const { error } = await supabase
      .from("product_prices")
      .delete()
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: ids.length });
  }

  if (id) {
    // Tekli silme
    const { error } = await supabase
      .from("product_prices")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "id veya ids parametresi gerekli" }, { status: 400 });
}
