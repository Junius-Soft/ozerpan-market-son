"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import {
  type Product,
  getProducts,
  getProductTabs,
} from "@/documents/products";
import { type Position } from "@/documents/offers";
import { DetailsStep } from "../steps/details-step";

export default function ProductDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const loadProductAndTabs = async () => {
      setIsLoading(true);
      try {
        const productId = searchParams.get("productId");
        if (!productId) {
          router.replace("select-product");
          return;
        }

        // Fetch both product and tabs in parallel
        const [productsResponse, tabsResponse] = await Promise.all([
          getProducts(),
          getProductTabs(productId),
        ]);

        const selectedProduct = productsResponse.products.find(
          (p) => p.id === productId
        );
        if (!selectedProduct) {
          router.replace("select-product");
          return;
        }

        // Add tabs from the API to the product
        selectedProduct.tabs = tabsResponse.tabs;
        setProduct(selectedProduct);
      } finally {
        setIsLoading(false);
      }
    };
    loadProductAndTabs();
  }, [router, searchParams]);

  const handlePositionDetailsChange = useCallback(
    (details: Omit<Position, "id" | "total">) => {
      if (details.quantity > 0) {
        console.log("Position details updated:", details);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
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
          {/* Title and Back Button */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{product?.name} Detayları</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Ürün Seçimi
            </Button>
          </div>

          {/* Product Details Form */}
          <DetailsStep
            selectedProduct={product}
            onPositionDetailsChange={handlePositionDetailsChange}
            formRef={formRef}
          />

          {/* Navigation */}
          <div className="flex justify-end pt-8">
            <Button
              onClick={() => {
                router.back(); // Return to offer page
              }}
            >
              Tamamla
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
