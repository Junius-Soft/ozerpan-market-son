"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProductTabs } from "@/documents/products";
import { type Position } from "@/documents/offers";
import { DetailsStep } from "../steps/details-step";
import {
  usePanjurCalculator,
  PanjurSelections,
} from "../steps/hooks/usePanjurCalculator";

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName") || productId;
  const typeId = searchParams.get("typeId");
  const optionId = searchParams.get("optionId");

  // Initialize selections with URL parameters and required fields
  const [selections, setSelections] = useState<PanjurSelections>({
    productId: productId || "panjur",
    panjurType: (optionId as PanjurSelections["panjurType"]) || "distan",
    sectionCount: typeId ? parseInt(typeId) : 1,
    width: 0,
    height: 0,
    quantity: 1,
  } as PanjurSelections);

  useEffect(() => {
    const loadProductAndTabs = async () => {
      setIsLoading(true);
      try {
        if (!productId) {
          router.replace("select-product");
          return;
        }

        // Get the product tabs with type and option filters
        const tabsResponse = await getProductTabs(productId, typeId, optionId);

        // Create a simple product object with the necessary info
        const product = {
          id: productId,
          name: productName,
          tabs: tabsResponse.tabs,
        } as Product;

        setProduct(product);

        // Initialize values object with URL parameters and defaults
        const values: Record<string, string | number> = {
          productId: productId || "panjur",
          panjurType: (optionId as PanjurSelections["panjurType"]) || "distan",
          sectionCount: typeId ? parseInt(typeId) : 1,
          quantity: 1,
          width: 0,
          height: 0,
        };

        // Add default values from API response
        for (const tab of tabsResponse.tabs) {
          if (tab.content?.fields) {
            for (const field of tab.content.fields) {
              // Skip if a value is already set
              if (field.id in values) continue;

              // For fields with options
              if (Array.isArray(field.options) && field.options.length > 0) {
                // Find the option marked as default, or use the first one
                const defaultOption = field.default
                  ? field.options.find((opt) => opt.id === field.default)
                  : field.options[0];

                if (defaultOption?.id) {
                  values[field.id] = defaultOption.id;
                }
              }
              // For numeric fields
              else if (
                field.type === "number" &&
                typeof field.default === "number"
              ) {
                values[field.id] = field.default;
              }
            }
          }
        }

        // Set the selections with the complete values
        setSelections(values as unknown as PanjurSelections);
      } finally {
        setIsLoading(false);
      }
    };

    loadProductAndTabs();
  }, [productId, productName, typeId, optionId, router]);

  const handlePositionDetailsChange = useCallback(
    (details: Omit<Position, "id" | "total">) => {
      if (details.quantity > 0) {
        console.log("Position details updated:", details);
      }
    },
    []
  );

  const result = usePanjurCalculator(selections);
  console.log("Calculator result:", result);
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Title and Buttons Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Title and Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {product?.name} Detayları ({typeId})
              </h1>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Ürün Seçimi
              </Button>
            </div>
            <Button
              onClick={() => {
                const offerNo = window.location.pathname.split("/")[2];
                router.push(`/offers/${offerNo}`);
              }}
            >
              Tamamla
            </Button>
          </div>

          {/* Product Details Form */}
          <DetailsStep
            selectedProduct={product}
            onPositionDetailsChange={handlePositionDetailsChange}
            formRef={formRef}
            onFormChange={(values) => {
              setSelections((prev) => ({
                ...prev,
                ...values,
              }));
            }}
          />
        </div>
      </div>
    </div>
  );
}
