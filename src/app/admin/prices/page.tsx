"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { PriceTable } from "./components/PriceTable";
import { PriceFilters } from "./components/PriceFilters";
import { BulkUpdateDialog } from "./components/BulkUpdateDialog";
import { ExcelUploadDialog } from "./components/ExcelUploadDialog";
import { StatsCards } from "./components/StatsCards";
import {
  Database,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import type { PriceItem } from "./constants";

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

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
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; description?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteItems = async (ids: string[]) => {
    if (ids.length === 1) {
      const item = prices.find((p) => p.id === ids[0]);
      setDeleteConfirm({ ids, description: item?.description });
    } else {
      setDeleteConfirm({ ids });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const param = deleteConfirm.ids.length === 1
        ? `id=${deleteConfirm.ids[0]}`
        : `ids=${deleteConfirm.ids.join(",")}`;

      const res = await fetch(`/api/admin/prices?${param}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${deleteConfirm.ids.length} ürün silindi ✅`);
        setSelectedIds(new Set());
        fetchPrices();
      }
    } catch {
      toast.error("Silme hatası");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
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
            <>
              <Button
                variant="outline"
                onClick={() => handleDeleteItems(Array.from(selectedIds))}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Seçilenleri Sil ({selectedIds.size})
              </Button>
              <Button
                onClick={() => setShowBulkUpdate(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Toplu Güncelle ({selectedIds.size})
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setShowExcelUpload(true)}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel Yükle
          </Button>
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
        onDeleteItems={handleDeleteItems}
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

      {/* Excel Upload Dialog */}
      <ExcelUploadDialog
        open={showExcelUpload}
        onClose={() => setShowExcelUpload(false)}
        onComplete={() => fetchPrices()}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Ürün Sil
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              {deleteConfirm?.ids.length === 1 ? (
                <><strong className="text-foreground">{deleteConfirm?.description}</strong> ürününü silmek istediğinizden emin misiniz?</>
              ) : (
                <><strong className="text-foreground">{deleteConfirm?.ids.length}</strong> ürünü silmek istediğinizden emin misiniz?</>
              )}
            </p>
            <div className="rounded-lg border border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              ⚠️ Bu işlem geri alınamaz.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              İptal
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="gap-2">
              {isDeleting ? (
                <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Siliniyor...</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Evet, Sil</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
