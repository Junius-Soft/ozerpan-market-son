"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, X } from "lucide-react";

interface BulkUpdateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (percentage: number) => void;
  selectedCount: number;
}

export function BulkUpdateDialog({
  open,
  onClose,
  onConfirm,
  selectedCount,
}: BulkUpdateDialogProps) {
  const [percentage, setPercentage] = useState("");

  if (!open) return null;

  const numPercentage = parseFloat(percentage);
  const isValid = !isNaN(numPercentage) && numPercentage !== 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Toplu Fiyat Güncelleme</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCount} ürün seçili
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Percentage Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Yüzde Değişim (%)
          </label>
          <div className="relative">
            <Input
              id="bulk-percentage-input"
              type="number"
              step="0.1"
              placeholder="Örn: 10 (artış) veya -5 (azalış)"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
          </div>
          {isValid && (
            <div
              className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
                numPercentage > 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
              }`}
            >
              {numPercentage > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                {selectedCount} ürünün fiyatı %{Math.abs(numPercentage)}{" "}
                {numPercentage > 0 ? "artırılacak" : "azaltılacak"}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button
            onClick={() => isValid && onConfirm(numPercentage)}
            disabled={!isValid}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            Güncelle
          </Button>
        </div>
      </div>
    </div>
  );
}
