import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/utils/price-formatter";
import { Button } from "@/components/ui/button";
import React from "react";

interface OfferSummaryCardProps {
  subtotal: number;
  vat: number;
  total: number;
  offerStatus: string;
  isDirty: boolean;
  positionsLength: number;
  eurRate: number;
  onSave: () => void;
  onOrder: () => void;
  onRevise: () => void;
}

export function OfferSummaryCard({
  subtotal,
  vat,
  total,
  offerStatus,
  isDirty,
  positionsLength,
  eurRate,
  onSave,
  onOrder,
  onRevise,
}: OfferSummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Toplam Bilgileri</h2>
        <span
          className={`
            inline-block px-2 py-1 rounded-full text-xs font-medium
            ${
              offerStatus === "Kaydedildi"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : offerStatus === "Revize"
                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            }
          `}
        >
          {offerStatus}
        </span>
      </div>
      {offerStatus === "Taslak" && (
        <div className="my-6 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-700/50">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Taslak durumundaki tekliflerde fiyat yeniden hesaplanır. Fiyatı
            korumak için lütfen teklifi kaydediniz!
          </p>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500">Ara Toplam</label>
          <div className="font-medium">₺{formatPrice(subtotal, eurRate)}</div>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500">KDV (%20)</label>
          <div className="font-medium">₺{formatPrice(vat, eurRate)}</div>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex justify-between items-center">
          <label className="font-medium">Genel Toplam</label>
          <div className="font-medium text-lg">
            ₺{formatPrice(total, eurRate)}
          </div>
        </div>
        <div className="h-px bg-gray-200 my-4" />
        {offerStatus !== "Revize" && (
          <div className="flex gap-3">
            {offerStatus === "Taslak" ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={!positionsLength || !isDirty}
                  onClick={onSave}
                >
                  Kaydet
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!positionsLength}
                  onClick={onOrder}
                >
                  Sipariş Ver
                </Button>
              </>
            ) : offerStatus === "Kaydedildi" ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={!positionsLength}
                  onClick={onRevise}
                >
                  Revize Et
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!positionsLength}
                  onClick={onOrder}
                >
                  Sipariş Ver
                </Button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
