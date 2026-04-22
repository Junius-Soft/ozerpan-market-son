"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { PriceTable } from "./components/PriceTable";
import { PriceFilters } from "./components/PriceFilters";
import { BulkUpdateDialog } from "./components/BulkUpdateDialog";
import { StatsCards } from "./components/StatsCards";
import {
  Database,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";

export interface PriceItem {
  id: string;
  product_category: string;
  item_type: string;
  description: string;
  stock_code: string | null;
  uretici_kodu: string | null;
  type: string | null;
  color: string | null;
  unit: string | null;
  price: number;
  previous_price: number | null;
  currency: string;
  price_updated_at: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  panjur: "Panjur",
  sineklik: "Sineklik",
  kepenk: "Kepenk",
  cam_balkon: "Cam Balkon",
};

const TYPE_LABELS: Record<string, string> = {
  panjur_lamel_profilleri: "Lamel Profilleri",
  panjur_kutu_profilleri: "Kutu Profilleri",
  monoblok_panjur_kutu_profilleri: "Monoblok Kutu",
  panjur_kutu_aksesuarları: "Kutu Aksesuarları",
  panjur_tambur_boru_profilleri: "Tambur Boru",
  panjur_tambur_boru_aksesuarları: "Tambur Boru Aks.",
  panjur_alt_parça_aksesuarları: "Alt Parça Aks.",
  panjur_lamel_aksesuarları: "Lamel Aks.",
  panjur_dikme_aksesuarları: "Dikme Aks.",
  panjur_motorlari: "Motorlar",
  panjur_montaj_aksesuarları: "Montaj Aks.",
  ortak_fitiller: "Fitiller",
  kepenk_lamel_profilleri: "Kepenk Lamel",
  kepenk_kutu_profilleri: "Kepenk Kutu",
  kepenk_aksesuarları: "Kepenk Aks.",
  kepenk_motorları: "Kepenk Motor",
  sineklik_profilleri: "Sineklik Profil",
  sineklik_aksesuarları: "Sineklik Aks.",
  cam_balkon_profilleri: "Cam Balkon Profil",
  cam_balkon_aksesuarları: "Cam Balkon Aks.",
  cam_balkon_camlari: "Cam Balkon Cam",
};

export { CATEGORY_LABELS, TYPE_LABELS };

export default function AdminPricesPage() {
  const { isAdmin } = useAuth();
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Filtreler
  const [category, setCategory] = useState("all");
  const [itemType, setItemType] = useState("all");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("description");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter options
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        sortBy,
        sortOrder,
      });
      if (category !== "all") params.set("category", category);
      if (itemType !== "all") params.set("itemType", itemType);
      if (type !== "all") params.set("type", type);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/prices?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPrices(result.data || []);
      setPagination(result.pagination);
    } catch {
      toast.error("Fiyatlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, category, itemType, type, search, sortBy, sortOrder]);

  const fetchFilters = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: "get_filters" }),
      });
      const result = await res.json();
      setAvailableTypes(result.types || []);
      setAvailableCategories(result.categories || []);
    } catch {
      console.error("Filtreler yüklenemedi");
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/prices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, price: newPrice }),
      });
      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setPrices((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...result } : p))
      );
      toast.success("Fiyat güncellendi ✅");
    } catch {
      toast.error("Güncelleme hatası");
    }
  };

  const handleBulkUpdate = async (percentage: number) => {
    if (selectedIds.size === 0) {
      toast.warning("Lütfen en az bir ürün seçin");
      return;
    }
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "bulk_update",
          ids: Array.from(selectedIds),
          percentage,
        }),
      });
      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      setSelectedIds(new Set());
      setShowBulkUpdate(false);
      fetchPrices();
    } catch {
      toast.error("Toplu güncelleme hatası");
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize: newSize }));
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold">Erişim Reddedildi</h2>
          <p className="text-muted-foreground">Bu sayfaya sadece yöneticiler erişebilir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fiyat Yönetimi</h1>
            <p className="text-sm text-muted-foreground">
              {pagination.total} ürün · Fiyatları görüntüleyin ve düzenleyin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              onClick={() => setShowBulkUpdate(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Toplu Güncelle ({selectedIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => fetchPrices()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards prices={prices} total={pagination.total} />

      {/* Filters */}
      <PriceFilters
        category={category}
        setCategory={(v) => { setCategory(v); setPagination(p => ({...p, page: 1})); }}
        itemType={itemType}
        setItemType={(v) => { setItemType(v); setPagination(p => ({...p, page: 1})); }}
        type={type}
        setType={(v) => { setType(v); setPagination(p => ({...p, page: 1})); }}
        search={search}
        setSearch={(v) => { setSearch(v); setPagination(p => ({...p, page: 1})); }}
        availableTypes={availableTypes}
        availableCategories={availableCategories}
      />

      {/* Table */}
      <PriceTable
        prices={prices}
        loading={loading}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        onUpdatePrice={handleUpdatePrice}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        onConfirm={handleBulkUpdate}
        selectedCount={selectedIds.size}
      />
    </div>
  );
}
