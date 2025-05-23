"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";

interface DimensionsTabProps {
  width: number;
  height: number;
  selectedProduct: Product | null;
  onChange: (field: string, value: number) => void;
}

export function DimensionsTab({
  width = 0,
  height = 0,
  selectedProduct,
  onChange,
}: DimensionsTabProps) {
  const handleChange = (field: string, value: number) => {
    // If value is NaN, use 0
    if (isNaN(value)) {
      value = 0;
    }
    onChange(field, value);
  };

  const handleBlur = (field: string, value: number) => {
    if (!selectedProduct?.dimensions) return;

    const limits =
      selectedProduct.dimensions[
        field as keyof typeof selectedProduct.dimensions
      ];

    if (value < limits.min) {
      onChange(field, limits.min);
    } else if (value > limits.max) {
      onChange(field, limits.max);
    }
  };

  if (!selectedProduct?.dimensions) return null;

  const { width: widthLimits, height: heightLimits } =
    selectedProduct.dimensions;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="width">Genişlik (mm)</Label>
          <Input
            id="width"
            type="number"
            value={width || ""}
            onChange={(e) => handleChange("width", parseFloat(e.target.value))}
            onBlur={(e) => handleBlur("width", parseFloat(e.target.value))}
          />
          {width > widthLimits.max && (
            <p className="text-sm text-red-500 mt-1">
              Maksimum genişlik {widthLimits.max}mm olabilir
            </p>
          )}
          {width < widthLimits.min && (
            <p className="text-sm text-red-500 mt-1">
              Minimum genişlik {widthLimits.min}mm olabilir
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Yükseklik (mm)</Label>
          <Input
            id="height"
            type="number"
            value={height || ""}
            onChange={(e) => handleChange("height", parseFloat(e.target.value))}
            onBlur={(e) => handleBlur("height", parseFloat(e.target.value))}
          />
          {height > heightLimits.max && (
            <p className="text-sm text-red-500 mt-1">
              Maksimum yükseklik {heightLimits.max}mm olabilir
            </p>
          )}
          {height < heightLimits.min && (
            <p className="text-sm text-red-500 mt-1">
              Minimum yükseklik {heightLimits.min}mm olabilir
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-500">
          Not: Genişlik {widthLimits.min}-{widthLimits.max}mm, yükseklik{" "}
          {heightLimits.min}-{heightLimits.max}mm arasında olabilir.
        </div>

        {selectedProduct && (
          <div className="aspect-square w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
            {getProductPreview({
              product: selectedProduct,
              width,
              height,
              className: "p-4",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
