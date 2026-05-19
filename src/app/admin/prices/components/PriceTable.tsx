"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Pencil,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import type { PriceItem } from "../constants";
import { CATEGORY_LABELS, TYPE_LABELS } from "../constants";

interface PriceTableProps {
  prices: PriceItem[];
  loading: boolean;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onDeleteItems: (ids: string[]) => void;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (field: string) => void;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy: string; sortOrder: string }) {
  if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
  return sortOrder === "asc" ? (
    <ArrowUp className="h-3 w-3 ml-1 text-emerald-500" />
  ) : (
    <ArrowDown className="h-3 w-3 ml-1 text-rose-500" />
  );
}

function PriceChangeIndicator({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || previous === undefined) return null;
  const diff = current - previous;
  const pctChange = ((diff / previous) * 100).toFixed(1);

  if (diff === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        diff > 0
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
      }`}
    >
      {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {diff > 0 ? "+" : ""}{pctChange}%
    </div>
  );
}

function InlineEdit({ value, onSave, onCancel }: { value: number; onSave: (v: number) => void; onCancel: () => void }) {
  const [editValue, setEditValue] = useState(String(value));

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-24 h-7 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(parseFloat(editValue));
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-600" onClick={() => onSave(parseFloat(editValue))}>
        <Check className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600" onClick={onCancel}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function PriceTable({
  prices,
  loading,
  selectedIds,
  setSelectedIds,
  onUpdatePrice,
  onDeleteItems,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  onPageChange,
  onPageSizeChange,
}: PriceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === prices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prices.map((p) => p.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={prices.length > 0 && selectedIds.size === prices.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort("description")}>
                <span className="flex items-center">
                  Ürün Adı
                  <SortIcon field="description" sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Stok Kodu</TableHead>
              <TableHead>Renk</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort("price")}>
                <span className="flex items-center">
                  Fiyat
                  <SortIcon field="price" sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </TableHead>
              <TableHead>Önceki</TableHead>
              <TableHead>Değişim</TableHead>
              <TableHead className="w-10"></TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => onSort("price_updated_at")}>
                <span className="flex items-center">
                  Güncelleme
                  <SortIcon field="price_updated_at" sortBy={sortBy} sortOrder={sortOrder} />
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  Ürün bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              prices.map((item) => (
                <TableRow
                  key={item.id}
                  className={`group transition-colors ${selectedIds.has(item.id) ? "bg-primary/5" : ""}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate" title={item.description}>
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                      {CATEGORY_LABELS[item.product_category] || item.product_category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABELS[item.type || ""] || item.type || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {item.stock_code || "-"}
                  </TableCell>
                  <TableCell className="text-xs">{item.color || "-"}</TableCell>
                  <TableCell className="text-xs">{item.unit || "-"}</TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <InlineEdit
                        value={item.price}
                        onSave={(v) => {
                          onUpdatePrice(item.id, v);
                          setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 group/price">
                        <span className="font-semibold tabular-nums">
                          {Number(item.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.currency || "EUR"}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover/price:opacity-100 transition-opacity"
                          onClick={() => setEditingId(item.id)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular-nums">
                    {item.previous_price !== null ? `${Number(item.previous_price).toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell>
                    <PriceChangeIndicator current={item.price} previous={item.previous_price} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteItems([item.id])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.price_updated_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Sayfa başına:</span>
          <select
            id="page-size-select"
            value={pagination.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border rounded-md px-2 py-1 bg-background text-sm"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="ml-2">
            {((pagination.page - 1) * pagination.pageSize) + 1}-
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} / {pagination.total}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page <= 1} onClick={() => onPageChange(1)}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 py-1 text-sm font-medium">
            {pagination.page} / {pagination.totalPages}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.totalPages)}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
