"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type ChangeEvent } from "react";
import { type Position } from "@/documents/offers";
import { type Product } from "@/documents/products";

interface DetailsStepProps {
  products: Product[];
  selectedProduct: string | null;
  selectedType: string | null;
  positionDetails: Omit<Position, "id" | "total"> | null;
  onPositionDetailsChange: (details: Omit<Position, "id" | "total">) => void;
}

export function DetailsStep({
  products,
  selectedProduct,
  selectedType,
  positionDetails,
  onPositionDetailsChange,
}: DetailsStepProps) {
  const details = positionDetails || {
    pozNo: "",
    description: selectedProduct
      ? `${products.find((p) => p.id === selectedProduct)?.name}${
          selectedType
            ? ` - ${
                products
                  .find((p) => p.id === selectedProduct)
                  ?.types?.find((t) => t.id === selectedType)?.name
              }`
            : ""
        }`
      : "",
    unit: "m2",
    quantity: 0,
    unitPrice: 0,
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedDetails = {
      ...details,
      [name]:
        name === "quantity" || name === "unitPrice"
          ? parseFloat(value) || 0
          : value,
    };
    onPositionDetailsChange(updatedDetails);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="pozNo">Poz No</Label>
          <Input
            id="pozNo"
            name="pozNo"
            placeholder="Örn: 01.01"
            value={details.pozNo}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Birim</Label>
          <Input
            id="unit"
            name="unit"
            value={details.unit}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Açıklama</Label>
          <Input
            id="description"
            name="description"
            placeholder="Poz açıklaması"
            value={details.description}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Miktar</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={details.quantity}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Birim Fiyat</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={details.unitPrice}
            onChange={handleChange}
          />
        </div>
      </div>
    </Card>
  );
}
