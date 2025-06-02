"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProductTabs } from "@/documents/products";
import { DetailsStep } from "../steps/details-step";
import { type Position } from "@/documents/offers";
import { type ProductDetails } from "../steps/types";
import { getOffers } from "@/documents/offers";

interface FormValues {
  details: ProductDetails;
  quantity: number;
  unitPrice: number;
}

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    details: {},
    quantity: 1,
    unitPrice: 0,
  });
  const initialLoadDone = useRef(false);

  // URL values
  const getUrlValues = useCallback(() => {
    return {
      productId: searchParams.get("productId"),
      productName: searchParams.get("productName"),
      typeId: searchParams.get("typeId"),
      optionId: searchParams.get("optionId"),
    };
  }, [searchParams]);

  useEffect(() => {
    const loadProductAndTabs = async () => {
      if (initialLoadDone.current) return;

      setIsLoading(true);
      try {
        const { productId, productName, typeId, optionId } = getUrlValues();

        if (!productId) {
          router.replace("select-product");
          return;
        }

        // Get the product tabs with type and option filters
        const tabsResponse = await getProductTabs(productId, typeId, optionId);

        // Create a simple product object with the necessary info
        const product = {
          id: productId,
          name: productName || productId,
          tabs: tabsResponse.tabs,
        } as Product;

        setProduct(product);
        initialLoadDone.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadProductAndTabs();
  }, [getUrlValues, router]);

  const handleComplete = async () => {
    if (!product) return;

    const offerNo = window.location.pathname.split("/")[2];

    try {
      setIsSaving(true);

      // Get existing offer first
      const offers = await getOffers();
      const currentOffer = offers.find((o) => o.id === offerNo);

      if (!currentOffer) {
        throw new Error("Offer not found");
      }

      const lastPos =
        currentOffer.positions.length > 0
          ? currentOffer.positions[currentOffer.positions.length - 1]
          : null;
      const nextPozNo = lastPos
        ? String(parseInt(lastPos.pozNo) + 1).padStart(3, "0")
        : "001";

      // Create new position with calculated values
      const newPosition: Position = {
        id: `POS-${Date.now()}`,
        pozNo: nextPozNo,
        description: product.name,
        unit: "adet",
        quantity: formValues.quantity,
        unitPrice: formValues.unitPrice,
        total: formValues.quantity * formValues.unitPrice,
        productDetails: formValues.details,
      };

      // Add the new position to existing positions
      const updatedPositions = [...currentOffer.positions, newPosition];

      // Update offer positions via PATCH endpoint
      const updateResponse = await fetch(`/api/offers?id=${offerNo}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positions: updatedPositions,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update offer positions");
      }

      // Navigate back to offer details
      router.push(`/offers/${offerNo}`);
    } catch (error) {
      console.error("Error updating offer positions:", error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleFormChange = (values: FormValues) => {
    setFormValues(values);
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Title and Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">
                {product?.name} Detayları{" "}
                {getUrlValues().typeId ? `(${getUrlValues().typeId})` : ""}
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
              onClick={handleComplete}
              disabled={
                isSaving || !formValues.details || formValues.unitPrice <= 0
              }
            >
              {isSaving ? "Kaydediliyor..." : "Tamamla"}
            </Button>
          </div>

          {/* Product Details Form */}
          <DetailsStep
            selectedProduct={product}
            formRef={formRef}
            onFormChange={handleFormChange}
          />
        </div>
      </div>
    </div>
  );
}
