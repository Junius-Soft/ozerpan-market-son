"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductPreview } from "@/lib/product-preview";
import { type Product } from "@/documents/products";
import { ProductDetails } from "../types";
import { type CalculationResult } from "../hooks/usePanjurCalculator";

interface ProductField {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; name: string }>;
}

export interface ProductTab {
  id: string;
  name: string;
  content?: {
    fields?: ProductField[];
  };
}

interface ProductPreviewProps {
  selectedProduct: Product | null;
  productDetails: ProductDetails;
  currentTab: string;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  calculationResult?: CalculationResult;
  tabs?: ProductTab[];
}

// Helper function to format field value
const formatFieldValue = (
  value: string | number | boolean,
  fieldId: string,
  field?: ProductField
): string => {
  if (field?.options) {
    const option = field.options.find((opt) => opt.id === value);
    if (option) return option.name;
  }

  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (field?.type === "number" || fieldId === "width" || fieldId === "height") {
    return `${value} mm`;
  }
  if (fieldId.endsWith("_color") && typeof value === "string") {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return String(value);
};

export function ProductPreview({
  selectedProduct,
  productDetails,
  currentTab,
  quantity,
  onQuantityChange,
  calculationResult,
  tabs = [],
}: ProductPreviewProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [localValues, setLocalValues] = useState(productDetails);

  // Product details değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalValues(productDetails);
  }, [productDetails]);

  // Quantity değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const handleQuantityChange = (newValue: number) => {
    setLocalQuantity(newValue);
    onQuantityChange(newValue);
  };

  if (!selectedProduct) return null;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="font-medium text-lg mb-4">Ürün Önizleme</div>
        <div className="aspect-video w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
          {getProductPreview({
            product: selectedProduct,
            width: parseFloat(localValues.dimensions?.width?.toString() ?? "0"),
            height: parseFloat(
              localValues.dimensions?.height?.toString() ?? "0"
            ),
            className: "p-4",
            tabId: currentTab,
          })}
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Adet</label>
            <Input
              type="number"
              min={1}
              value={localQuantity}
              onChange={(e) =>
                handleQuantityChange(parseInt(e.target.value) || 1)
              }
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="font-medium">Seçilen Özellikler</h4>
            {tabs.map((tab) => {
              const tabValues = localValues[tab.id] || {};
              if (!tab.content?.fields?.length) return null;

              const fields = tab.content.fields.reduce<
                Array<{ name: string; value: string }>
              >((acc, field) => {
                const fieldValue = tabValues[field.id];
                if (fieldValue === undefined || fieldValue === "") return acc;

                const displayValue = formatFieldValue(
                  fieldValue,
                  field.id,
                  field
                );

                acc.push({
                  name: field.name,
                  value: displayValue,
                });
                return acc;
              }, []);

              if (fields.length === 0) return null;

              return (
                <div
                  key={tab.id}
                  className="border-t first:border-t-0 pt-2 first:pt-0"
                >
                  <div className="text-sm font-medium text-gray-500 mb-1.5">
                    {tab.name}
                  </div>
                  <div className="space-y-1">
                    {fields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-baseline text-sm justify-between"
                      >
                        <span className="flex-none font-medium text-gray-900">
                          {field.name}
                        </span>
                        <span className="text-gray-700 text-right">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {calculationResult && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-medium">Hesaplama Sonuçları:</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Sistem Genişliği:</span>
                  <span>{calculationResult.systemWidth} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Sistem Yüksekliği:</span>
                  <span>{calculationResult.systemHeight} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Lamel Sayısı:</span>
                  <span>{calculationResult.lamelCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lamel Kesim Ölçüsü:</span>
                  <span>{calculationResult.lamelCuttingSize} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Dikme Yüksekliği:</span>
                  <span>{calculationResult.postHeight} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Dikme Sayısı:</span>
                  <span>{calculationResult.postCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kutu Yüksekliği:</span>
                  <span>{calculationResult.boxHeight} mm</span>
                </div>
                <div className="flex justify-between font-medium text-base">
                  <span>Toplam Fiyat:</span>
                  <span>
                    {calculationResult.totalPriceTL.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TL
                  </span>
                </div>
              </div>
              {calculationResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h5 className="font-medium text-red-700 mb-1">Uyarılar:</h5>
                  <ul className="list-disc list-inside text-sm text-red-600">
                    {calculationResult.errors.map(
                      (error: string, index: number) => (
                        <li key={index}>{error}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
