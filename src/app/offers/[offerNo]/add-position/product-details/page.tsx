"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProductTabs } from "@/documents/products";
import { type Position } from "@/documents/offers";
import { DetailsStep } from "../steps/details-step";

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName") || productId;

  useEffect(() => {
    const loadProductAndTabs = async () => {
      setIsLoading(true);
      try {
        if (!productId) {
          router.replace("select-product");
          return;
        }

        const typeId = searchParams.get("typeId");
        const optionId = searchParams.get("optionId");

        // Get the product tabs with type and option filters
        const tabsResponse = await getProductTabs(productId, typeId, optionId);

        // Create a simple product object with the necessary info
        const product = {
          id: productId,
          name: productName,
          tabs: tabsResponse.tabs,
        } as Product;

        setProduct(product);
      } finally {
        setIsLoading(false);
      }
    };
    loadProductAndTabs();
  }, [router, searchParams, productId, productName]);

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
              <h1 className="text-2xl font-bold">{product?.name} Detaylarıı</h1>
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
          />
        </div>
      </div>
    </div>
  );
}
