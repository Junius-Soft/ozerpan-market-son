"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProducts } from "@/documents/products";
import { ProductStep } from "../steps/product-step";

export default function SelectProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { products, defaultProduct, defaultType, defaultOption } =
          await getProducts();
        setProducts(products);
        const defaultProductObj = products.find((p) => p.id === defaultProduct);
        setSelectedProduct(defaultProductObj || null);
        setSelectedType(defaultType);
        setSelectedOption(defaultOption);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (product.id !== "panjur") {
      setSelectedType(null);
    }
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
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Teklif Detayı
              </Button>
            </div>
            <Button
              onClick={() => {
                if (selectedProduct) {
                  const params = new URLSearchParams();
                  params.set("productId", selectedProduct.id);
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

          {/* Product Selection */}
          <ProductStep
            products={products}
            selectedProduct={selectedProduct}
            selectedType={selectedType}
            selectedOption={selectedOption}
            onProductSelect={handleProductSelect}
            onTypeSelect={setSelectedType}
            onOptionSelect={setSelectedOption}
          />
        </div>
      </div>
    </div>
  );
}
