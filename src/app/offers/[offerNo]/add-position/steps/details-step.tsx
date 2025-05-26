"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type Position } from "@/documents/offers";
import { type Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";

import { DynamicForm } from "./components/dynamic-form";

interface ProductDetails {
  dimensions: {
    width: number;
    height: number;
  };
  divisions: {
    kutuOlcuAlmaSekli: string;
    dikmeOlcuAlmaSekli: string;
    hareketBaglanti: string;
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

export function DetailsStep({
  selectedProduct,
  onPositionDetailsChange,
}: DetailsStepProps) {
  // Default to first tab if available, otherwise empty string
  const [currentTab, setCurrentTab] = useState("");
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    dimensions: { width: 250, height: 250 },
    divisions: {
      kutuOlcuAlmaSekli: "kutu-dahil",
      dikmeOlcuAlmaSekli: "dikme-dahil",
      hareketBaglanti: "sol",
    },
    movement: "manuel",
    lamelType: "35mm",
    frameType: "siva-alti",
    color: "beyaz",
  });

  const isInitialMount = useRef(true);
  const availableTabs = useMemo(
    () => selectedProduct?.tabs || [],
    [selectedProduct]
  );

  // Set initial tab when product is selected
  useEffect(() => {
    if (availableTabs.length > 0) {
      setCurrentTab(availableTabs[0].id);
    } else {
      // Default to "dimensions" if no tabs are defined
      setCurrentTab("dimensions");
    }
  }, [selectedProduct, availableTabs]);

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
          }x${details.dimensions.height}mm) - ${
            details.divisions.kutuOlcuAlmaSekli === "kutu-dahil"
              ? "Kutu Dahil"
              : "Kutu Hariç"
          }, ${
            details.divisions.dikmeOlcuAlmaSekli === "dikme-dahil"
              ? "Dikme Dahil"
              : details.divisions.dikmeOlcuAlmaSekli === "dikme-haric"
              ? "Dikme Hariç"
              : "Tek Dikme"
          }`,
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
    // Get tab by ID from available tabs
    const activeTab = availableTabs.find((tab) => tab.id === currentTab);

    // If the tab has content with fields defined, use dynamic form
    if (activeTab?.content?.fields && activeTab.content.fields.length > 0) {
      // Get values for the fields from productDetails based on tab id
      const getValuesForTab = (): Record<string, string | number | boolean> => {
        switch (activeTab.id) {
          case "dimensions":
            return {
              width: productDetails.dimensions.width,
              height: productDetails.dimensions.height,
            };
          case "divisions":
            return {
              kutuOlcuAlmaSekli: productDetails.divisions.kutuOlcuAlmaSekli,
              dikmeOlcuAlmaSekli: productDetails.divisions.dikmeOlcuAlmaSekli,
              hareketBaglanti: productDetails.divisions.hareketBaglanti,
            };
          case "movement":
            return { movement: productDetails.movement };
          case "lamel":
            return { lamelType: productDetails.lamelType };
          case "frame":
            return { frameType: productDetails.frameType };
          case "color":
            return { color: productDetails.color };
          default:
            return {};
        }
      };

      const handleDynamicFormChange = (
        fieldId: string,
        value: string | number | boolean
      ) => {
        // Convert boolean to string if needed
        const processedValue =
          typeof value === "boolean" ? (value ? "1" : "0") : value;

        switch (activeTab.id) {
          case "dimensions":
            handleProductDetailsChange(
              "dimensions",
              fieldId,
              processedValue as string | number
            );
            break;
          case "divisions":
            handleProductDetailsChange(
              "divisions",
              fieldId,
              processedValue as string | number
            );
            break;
          case "movement":
            handleProductDetailsChange(
              "movement",
              "",
              processedValue as string
            );
            break;
          case "lamel":
            handleProductDetailsChange(
              "lamelType",
              "",
              processedValue as string
            );
            break;
          case "frame":
            handleProductDetailsChange(
              "frameType",
              "",
              processedValue as string
            );
            break;
          case "color":
            handleProductDetailsChange("color", "", processedValue as string);
            break;
        }
      };

      // Render form with preview if it's the dimensions tab
      if (activeTab.id === "dimensions" && selectedProduct) {
        return (
          <>
            <DynamicForm
              fields={activeTab.content.fields}
              values={getValuesForTab()}
              onChange={handleDynamicFormChange}
            />
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Ürün Önizleme</h4>
              <div className="aspect-square w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
                {getProductPreview({
                  product: selectedProduct,
                  width: productDetails.dimensions.width,
                  height: productDetails.dimensions.height,
                  className: "p-4",
                  tabId: "dimensions",
                })}
              </div>
              <div className="mt-2 text-center text-sm text-gray-500">
                Genişlik: {productDetails.dimensions.width}mm × Yükseklik:{" "}
                {productDetails.dimensions.height}mm
              </div>
            </div>
          </>
        );
      }

      // Otherwise just render the form
      return (
        <DynamicForm
          fields={activeTab.content.fields}
          values={getValuesForTab()}
          onChange={handleDynamicFormChange}
        />
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side - Tabs and Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tabs - Using API provided tabs */}
        <div className="flex flex-wrap gap-2">
          {availableTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={currentTab === tab.id ? "default" : "outline"}
              onClick={() => setCurrentTab(tab.id)}
              className="flex-1"
            >
              {tab.name}
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
              tabId: currentTab,
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

            <div className="text-sm text-gray-500">Kutu Ölçü Alma:</div>
            <div className="text-sm capitalize">
              {productDetails.divisions.kutuOlcuAlmaSekli === "kutu-dahil"
                ? "Kutu Dahil"
                : "Kutu Hariç"}
            </div>

            <div className="text-sm text-gray-500">Dikme Ölçü Alma:</div>
            <div className="text-sm capitalize">
              {productDetails.divisions.dikmeOlcuAlmaSekli === "dikme-dahil"
                ? "Dikme Dahil"
                : productDetails.divisions.dikmeOlcuAlmaSekli === "dikme-haric"
                ? "Dikme Hariç"
                : "Tek Dikme"}
            </div>

            <div className="text-sm text-gray-500">Bağlantı Noktası:</div>
            <div className="text-sm capitalize">
              {productDetails.divisions.hareketBaglanti}
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
