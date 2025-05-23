"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { type Position } from "@/documents/offers";
import { type Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";
import { DimensionsTab } from "./tabs/dimensions-tab";
import { DivisionsTab } from "./tabs/divisions-tab";
import { MovementTab } from "./tabs/movement-tab";
import { LamelTab } from "./tabs/lamel-tab";
import { FrameTab } from "./tabs/frame-tab";
import { ColorTab } from "./tabs/color-tab";

interface ProductDetails {
  dimensions: {
    width: number;
    height: number;
  };
  divisions: {
    horizontal: number;
    vertical: number;
  };
  movement: "manuel" | "motorlu";
  lamelType: "35mm" | "50mm";
  frameType: "siva-alti" | "siva-ustu";
  color: string;
}

interface DetailsStepProps {
  products: Product[];
  selectedProduct: Product | null;
  onPositionDetailsChange: (details: Omit<Position, "id" | "total">) => void;
}

const tabs = [
  { id: "dimensions", title: "Ürün Ölçüleri" },
  { id: "divisions", title: "Bölme Ayarları" },
  { id: "movement", title: "Hareket Şekli" },
  { id: "lamel", title: "Lamel Seçimi" },
  { id: "frame", title: "Çerçeve Seçimi" },
  { id: "color", title: "Renk Seçimi" },
];

export function DetailsStep({
  selectedProduct,
  onPositionDetailsChange,
}: DetailsStepProps) {
  const [currentTab, setCurrentTab] = useState("dimensions");
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    dimensions: { width: 250, height: 250 },
    divisions: { horizontal: 1, vertical: 1 },
    movement: "manuel",
    lamelType: "35mm",
    frameType: "siva-alti",
    color: "beyaz",
  });

  const isInitialMount = useRef(true);

  // Memoize the update function to avoid unnecessary recalculations
  const updatePositionDetails = useCallback(
    (details: ProductDetails) => {
      const area =
        (details.dimensions.width * details.dimensions.height) / 10000;
      if (area > 0) {
        // Only update if we have valid dimensions
        onPositionDetailsChange({
          pozNo: "PNJ-001",
          description: `${
            details.movement === "motorlu" ? "Motorlu" : "Manuel"
          } ${details.lamelType} Panjur - ${details.color} (${
            details.dimensions.width
          }x${details.dimensions.height}cm)`,
          unit: "m²",
          quantity: area,
          unitPrice: 1000,
        });
      }
    },
    [onPositionDetailsChange]
  );

  // Update position details when productDetails changes, but skip the first render
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else if (
      productDetails.dimensions.width > 0 &&
      productDetails.dimensions.height > 0
    ) {
      updatePositionDetails(productDetails);
    }
  }, [productDetails, updatePositionDetails]);

  const handleProductDetailsChange = (
    category: keyof ProductDetails,
    field: string,
    value: string | number
  ) => {
    setProductDetails((prev) => ({
      ...prev,
      [category]:
        typeof prev[category] === "object"
          ? { ...prev[category], [field]: value }
          : value,
    }));
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case "dimensions":
        return (
          <DimensionsTab
            width={productDetails.dimensions.width}
            height={productDetails.dimensions.height}
            selectedProduct={selectedProduct}
            onChange={(field, value) =>
              handleProductDetailsChange("dimensions", field, value)
            }
          />
        );
      case "divisions":
        return (
          <DivisionsTab
            horizontal={productDetails.divisions.horizontal}
            vertical={productDetails.divisions.vertical}
            onChange={(field, value) =>
              handleProductDetailsChange("divisions", field, value)
            }
          />
        );
      case "movement":
        return (
          <MovementTab
            movement={productDetails.movement}
            onChange={(value) =>
              handleProductDetailsChange("movement", "", value)
            }
          />
        );
      case "lamel":
        return (
          <LamelTab
            lamelType={productDetails.lamelType}
            onChange={(value) =>
              handleProductDetailsChange("lamelType", "", value)
            }
          />
        );
      case "frame":
        return (
          <FrameTab
            frameType={productDetails.frameType}
            onChange={(value) =>
              handleProductDetailsChange("frameType", "", value)
            }
          />
        );
      case "color":
        return (
          <ColorTab
            color={productDetails.color}
            onChange={(value) => handleProductDetailsChange("color", "", value)}
            colors={["beyaz", "gri", "krem", "kahve"]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Tabs and Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={currentTab === tab.id ? "default" : "outline"}
              onClick={() => setCurrentTab(tab.id)}
              className="flex-1"
            >
              {tab.title}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <Card className="p-6">
          <div className="space-y-6">{renderTabContent()}</div>
        </Card>
      </div>

      {/* Right Side - Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Ürün Ön İzleme</h3>

        {/* Product Image */}
        <div className="aspect-video relative bg-gray-100 rounded-lg">
          {selectedProduct &&
            getProductPreview({
              product: selectedProduct,
              width: productDetails.dimensions.width,
              height: productDetails.dimensions.height,
              className: "w-full h-full",
            })}
        </div>

        {/* Selected Options Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="text-sm text-gray-500">Ölçüler:</div>
            <div className="text-sm">
              {productDetails.dimensions.width} x{" "}
              {productDetails.dimensions.height} cm
            </div>

            <div className="text-sm text-gray-500">Bölmeler:</div>
            <div className="text-sm">
              {productDetails.divisions.horizontal} x{" "}
              {productDetails.divisions.vertical}
            </div>

            <div className="text-sm text-gray-500">Hareket:</div>
            <div className="text-sm capitalize">{productDetails.movement}</div>

            <div className="text-sm text-gray-500">Lamel:</div>
            <div className="text-sm">{productDetails.lamelType}</div>

            <div className="text-sm text-gray-500">Çerçeve:</div>
            <div className="text-sm capitalize">
              {productDetails.frameType === "siva-alti"
                ? "Sıva Altı"
                : "Sıva Üstü"}
            </div>

            <div className="text-sm text-gray-500">Renk:</div>
            <div className="text-sm capitalize">{productDetails.color}</div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">Toplam Alan:</div>
              <div className="text-sm font-medium">
                {(
                  (productDetails.dimensions.width *
                    productDetails.dimensions.height) /
                  10000
                ).toFixed(2)}{" "}
                m²
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
