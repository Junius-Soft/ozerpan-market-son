"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProducts } from "@/documents/products";
import { ProductStep } from "../steps/product-step";

export default function SelectProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  const selectedPosition = searchParams.get("selectedPosition") ?? "";

  const updateURL = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  useEffect(() => {
    const loadProducts = async () => {
      if (initialLoadDone.current) return;

      setIsLoading(true);
      try {
        const { products, defaultProduct, defaultType, defaultOption } =
          await getProducts();
        setProducts(products);

        // Get values from URL or use defaults
        const productId = searchParams.get("productId") || defaultProduct;
        const typeId = searchParams.get("typeId") || defaultType;
        const optionId = searchParams.get("optionId") || defaultOption;

        const productObj = products.find((p) => p.id === productId);

        // Set states
        setSelectedProduct(productObj || null);
        setSelectedType(typeId);
        setSelectedOption(optionId);

        // If there are no URL parameters, update URL with default values
        if (!searchParams.has("productId")) {
          updateURL({
            productId: productId,
            productName: productObj?.name || "",
            typeId: typeId,
            optionId: optionId,
          });
        }

        initialLoadDone.current = true;
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [searchParams, updateURL]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    const updates: Record<string, string | null> = {
      productId: product.id,
      productName: product.name,
    };

    if (product.id !== "panjur") {
      setSelectedType(null);
      setSelectedOption(null);
      updates.typeId = null;
      updates.optionId = null;
    }

    updateURL(updates);
  };

  const handleTypeSelect = (type: string | null) => {
    setSelectedType(type);
    updateURL({ typeId: type });
  };

  const handleOptionSelect = (option: string | null) => {
    setSelectedOption(option);
    updateURL({ optionId: option });
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="aspect-video w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Title and Navigation Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Ürün Seçimi</h1>
              <Button
                variant="ghost"
                className="hidden sm:flex"
                onClick={() =>
                  router.push(
                    `/offers/${window.location.pathname.split("/")[2]}`
                  )
                }
              >
                <ArrowLeft className="h-4 w-4" />
                Teklif Detayı
              </Button>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex sm:hidden"
                onClick={() =>
                  router.push(
                    `/offers/${window.location.pathname.split("/")[2]}`
                  )
                }
              >
                <ArrowLeft className="h-4 w-4" />
                <span
                  className="hidden sm:inline
                "
                ></span>
              </Button>
              <Button
                onClick={() => {
                  if (selectedProduct) {
                    const params = new URLSearchParams();
                    params.set("selectedPosition", selectedPosition);
                    params.set("productId", selectedProduct.id);
                    params.set("productName", selectedProduct.name);
                    if (selectedType) params.set("typeId", selectedType);
                    if (selectedOption) params.set("optionId", selectedOption);
                    router.push(`product-details?${params.toString()}`);
                  }
                }}
                disabled={!selectedProduct}
              >
                Devam Et
              </Button>
            </div>
          </div>

          {/* Product Selection */}
          <ProductStep
            products={products}
            selectedProduct={selectedProduct}
            selectedType={selectedType}
            selectedOption={selectedOption}
            onProductSelect={handleProductSelect}
            onTypeSelect={handleTypeSelect}
            onOptionSelect={handleOptionSelect}
          />
        </div>
      </div>
    </div>
  );
}
