import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatPrice } from "@/utils/price-formatter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useErcomOrders } from "@/hooks/useErcomOrders";
import React, { useCallback, useMemo, useState } from "react";

interface OfferSummaryCardProps {
  subtotal: number;
  offerStatus: string;
  isDirty: boolean;
  positionsLength: number;
  eurRate: number;
  onSave: () => void;
  onOrder: () => void;
  onRevise: () => void;
  onTotalChange?: (total: number) => void;
  selectedOrder: string;
  onSelectedOrderChange: (order: string) => void;
  orderLoading?: boolean;
  onVatChange?: (v: number) => void;
  onDiscountChange?: (v: number) => void;
  onAssemblyChange?: (v: number) => void;
}

export function OfferSummaryCard({
  subtotal,
  offerStatus,
  isDirty,
  positionsLength,
  eurRate,
  onSave,
  onOrder,
  onRevise,
  onTotalChange,
  selectedOrder,
  onSelectedOrderChange,
  orderLoading = false,
  onVatChange,
  onDiscountChange,
  onAssemblyChange,
}: OfferSummaryCardProps) {
  // Sipariş numarası seçimi için state kaldırıldı, parenttan geliyor
  const { orders, isLoading: ordersLoading } = useErcomOrders();
  const [vatRate, setVatRate] = useState<number>(20);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [assemblyRate, setAssemblyRate] = useState<number>(0);

  // orders değiştiğinde ilkini seçili yap
  React.useEffect(() => {
    if (orders.length > 0 && !selectedOrder)
      onSelectedOrderChange(orders[0].name);
  }, [orders, selectedOrder, onSelectedOrderChange]);

  const calculateTotal = useCallback(
    (
      subtotal: number,
      vatRate: number,
      discountRate: number,
      assemblyRate: number
    ) => {
      // İskonto ve montajdan sonra kalan tutarı hesapla
      const discounted = subtotal - (subtotal * discountRate) / 100;
      const assembly = (subtotal * assemblyRate) / 100;
      const base = discounted + assembly;
      const vatAmount = (base * vatRate) / 100;
      return base + vatAmount;
    },
    []
  );

  // KDV satırı için ayrı bir hesaplama
  const baseForVat = useMemo(() => {
    const discounted = subtotal - (subtotal * discountRate) / 100;
    const assembly = (subtotal * assemblyRate) / 100;
    return discounted + assembly;
  }, [subtotal, discountRate, assemblyRate]);
  const vatAmount = useMemo(
    () => (baseForVat * vatRate) / 100,
    [baseForVat, vatRate]
  );

  const total = useMemo(
    () => calculateTotal(subtotal, vatRate, discountRate, assemblyRate),
    [subtotal, vatRate, discountRate, assemblyRate, calculateTotal]
  );

  // Toplam değiştiğinde parent'a bildir
  React.useEffect(() => {
    if (onTotalChange) onTotalChange(total);
  }, [total, onTotalChange]);

  // KDV, iskonto, montaj değişimlerini parent'a ilet
  React.useEffect(() => {
    if (onVatChange) onVatChange(vatRate);
  }, [vatRate]);
  React.useEffect(() => {
    if (onDiscountChange) onDiscountChange(discountRate);
  }, [discountRate]);
  React.useEffect(() => {
    if (onAssemblyChange) onAssemblyChange(assemblyRate);
  }, [assemblyRate]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Toplam Bilgileri</h2>
        <span
          className={`
            inline-block px-2 py-1 rounded-full text-xs font-medium
            ${
              offerStatus === "Kaydedildi" || offerStatus === "Sipariş Verildi"
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
        {/* Ara Toplam üstüne sipariş numarası seçimi */}
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">
            Sipariş Numarası
          </label>
          <Select
            value={selectedOrder}
            onValueChange={onSelectedOrderChange}
            disabled={ordersLoading || orders.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sipariş seçin" />
            </SelectTrigger>
            <SelectContent>
              {orders.map((order: { name: string }) => (
                <SelectItem key={order.name} value={order.name}>
                  {order.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500">Ara Toplam</label>
          <div className="font-medium">€ {subtotal.toFixed(2)}</div>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            KDV (
            <input
              type="number"
              min={0}
              max={100}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              className="w-12 px-1 py-0.5 border rounded text-xs text-center bg-transparent border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            %)
          </label>
          <div className="font-medium">€ {vatAmount.toFixed(2)}</div>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            İskonto (
            <input
              type="number"
              min={0}
              max={100}
              value={discountRate}
              onChange={(e) => setDiscountRate(Number(e.target.value))}
              className="w-12 px-1 py-0.5 border rounded text-xs text-center bg-transparent border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            %)
          </label>
          <div className="font-medium">
            - € {((subtotal * discountRate) / 100).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <label className="text-sm text-gray-500 flex items-center gap-2">
            Montaj (
            <input
              type="number"
              min={0}
              max={100}
              value={assemblyRate}
              onChange={(e) => setAssemblyRate(Number(e.target.value))}
              className="w-12 px-1 py-0.5 border rounded text-xs text-center bg-transparent border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            %)
          </label>
          <div className="font-medium">
            € {((subtotal * assemblyRate) / 100).toFixed(2)}
          </div>
        </div>
        <div className="h-px bg-gray-200" />
        <div className="flex justify-between items-center">
          <label className="font-medium">Genel Toplam</label>
          <div className="font-medium text-lg flex flex-col items-end">
            <span>€ {total.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">
              ₺ {formatPrice(total, eurRate)}
            </span>
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
                  disabled={!positionsLength || !isDirty || orderLoading}
                  onClick={onSave}
                >
                  Kaydet
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!positionsLength || orderLoading}
                  onClick={onOrder}
                >
                  {orderLoading ? "Sipariş Veriliyor..." : "Sipariş Ver"}
                </Button>
              </>
            ) : offerStatus === "Kaydedildi" ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={!positionsLength || orderLoading}
                  onClick={onRevise}
                >
                  Revize Et
                </Button>
                <Button
                  className="flex-1 gap-2"
                  disabled={!positionsLength || orderLoading}
                  onClick={onOrder}
                >
                  {orderLoading ? "Sipariş Veriliyor..." : "Sipariş Ver"}
                </Button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </Card>
  );
}
