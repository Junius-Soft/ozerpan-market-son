"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductPreview } from "@/lib/product-preview";
import { type Product } from "@/documents/products";
import { ProductDetails } from "../types";

interface ProductPreviewProps {
  selectedProduct: Product | null;
  productDetails: ProductDetails;
  currentTab: string;
  quantity?: number;
  onQuantityChange?: (value: number) => void;
}

export function ProductPreview({
  selectedProduct,
  productDetails,
  currentTab,
  quantity = 1,
  onQuantityChange,
}: ProductPreviewProps) {
  const [inputValue, setInputValue] = useState<string>(quantity.toString());

  // quantity prop'u değiştiğinde input değerini güncelle
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Ürün Ön İzleme</h3>
        <div className="flex items-center gap-2">
          <Input
            id="quantity"
            type="number"
            min={1}
            step={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              const numValue = parseInt(e.target.value);
              if (!isNaN(numValue) && numValue >= 1) {
                onQuantityChange?.(numValue);
              }
            }}
            onBlur={(e) => {
              const numValue = parseInt(e.target.value);
              if (isNaN(numValue) || numValue < 1) {
                setInputValue("1");
                onQuantityChange?.(1);
              }
            }}
            className="w-16 h-8 text-sm text-right pr-2"
          />
          <label htmlFor="quantity" className="text-sm text-gray-500">
            adet
          </label>
        </div>
      </div>

      {/* Product Image */}
      <div className="aspect-video relative bg-gray-100 rounded-lg">
        {selectedProduct &&
          getProductPreview({
            product: selectedProduct,
            width: parseFloat(
              productDetails["dimensions"]?.width?.toString() || "0"
            ),
            height: parseFloat(
              productDetails["dimensions"]?.height?.toString() || "0"
            ),
            className: "w-full h-full",
            tabId: currentTab,
          })}
      </div>

      {/* Selected Options Summary */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="text-sm text-gray-500">Ölçüler:</div>
          <div className="text-sm">
            {productDetails["dimensions"]?.width} x{" "}
            {productDetails["dimensions"]?.height} mm
          </div>

          <div className="text-sm text-gray-500">Kutu Ölçü Alma:</div>
          <div className="text-sm capitalize">
            {productDetails["divisions"]?.kutuOlcuAlmaSekli === "kutu-dahil"
              ? "Kutu Dahil"
              : "Kutu Hariç"}
          </div>

          <div className="text-sm text-gray-500">Dikme Ölçü Alma:</div>
          <div className="text-sm capitalize">
            {productDetails["divisions"]?.dikmeOlcuAlmaSekli === "dikme-dahil"
              ? "Dikme Dahil"
              : productDetails["divisions"]?.dikmeOlcuAlmaSekli ===
                "dikme-haric"
              ? "Dikme Hariç"
              : "Tek Dikme"}
          </div>

          <div className="text-sm text-gray-500">Bağlantı Noktası:</div>
          <div className="text-sm capitalize">
            {productDetails["divisions"]?.hareketBaglanti}
          </div>

          <div className="text-sm text-gray-500">Hareket:</div>
          <div className="text-sm capitalize">
            {productDetails["movement"]?.movementType}
          </div>

          <div className="text-sm text-gray-500">Lamel:</div>
          <div className="text-sm">{productDetails["lamel"]?.lamelType}</div>

          <div className="text-sm text-gray-500">Çerçeve:</div>
          <div className="text-sm capitalize">
            {productDetails["frame"]?.frameType === "siva-alti"
              ? "Sıva Altı"
              : "Sıva Üstü"}
          </div>

          <div className="text-sm text-gray-500">Renk:</div>
          <div className="text-sm capitalize">
            {productDetails["color"]?.color}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Toplam Alan:</div>
            <div className="text-sm font-medium">
              {(
                (parseFloat(
                  productDetails["dimensions"]?.width?.toString() || "0"
                ) *
                  parseFloat(
                    productDetails["dimensions"]?.height?.toString() || "0"
                  )) /
                10000
              ).toFixed(2)}{" "}
              m²
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
