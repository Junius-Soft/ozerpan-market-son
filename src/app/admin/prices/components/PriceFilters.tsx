"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_LABELS, TYPE_LABELS } from "../constants";

interface PriceFiltersProps {
  category: string;
  setCategory: (v: string) => void;
  itemType: string;
  setItemType: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  availableTypes: string[];
  availableCategories: string[];
}

export function PriceFilters({
  category,
  setCategory,
  itemType,
  setItemType,
  type,
  setType,
  search,
  setSearch,
  availableTypes,
  availableCategories,
}: PriceFiltersProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtreler
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Arama */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="price-search-input"
            placeholder="Ürün adı, stok kodu veya üretici kodu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Kategori */}
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ürün Tipi */}
        <Select value={itemType} onValueChange={setItemType}>
          <SelectTrigger id="item-type-filter">
            <SelectValue placeholder="Ürün Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="price">Fiyat</SelectItem>
            <SelectItem value="accessory">Aksesuar</SelectItem>
          </SelectContent>
        </Select>

        {/* Alt Tip */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger id="sub-type-filter">
            <SelectValue placeholder="Alt Tip" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tipler</SelectItem>
            {availableTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {TYPE_LABELS[t] || t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
