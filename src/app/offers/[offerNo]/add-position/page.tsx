"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { type Product, getProducts } from "@/documents/products";
import { type Position } from "@/documents/offers";
import { ProductStep } from "./steps/product-step";
import { DetailsStep } from "./steps/details-step";
const steps = [
  { id: "product", title: "Ürün Seçimi" },
  { id: "details", title: "Poz Detayları" },
];

export default function AddPositionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("product");
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

  const handleNextStep = () => {
    if (currentStep === "product" && selectedProduct) {
      setCurrentStep("details");
    } else if (currentStep === "details") {
      router.back(); // Go back to the offer page when done
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "details") {
      setCurrentStep("product");
    }
  };

  const handlePositionDetailsChange = useCallback(
    (details: Omit<Position, "id" | "total">) => {
      // Here you can handle the position details update directly,
      // for example, saving to a parent state or making an API call
      if (details.quantity > 0) {
        // Handle the valid position details
        console.log("Position details updated:", details);
      }
    },
    []
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "product":
        return (
          <ProductStep
            products={products}
            selectedProduct={selectedProduct}
            selectedType={selectedType}
            selectedOption={selectedOption}
            onProductSelect={handleProductSelect}
            onTypeSelect={setSelectedType}
            onOptionSelect={setSelectedOption}
          />
        );
      case "details":
        return (
          <DetailsStep
            selectedProduct={selectedProduct}
            onPositionDetailsChange={handlePositionDetailsChange}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Stepper Skeleton */}
            <div className="flex justify-between">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24 ml-2" />
                  {i < 2 && <Skeleton className="h-1 w-full mx-4" />}
                </div>
              ))}
            </div>
            {/* Content Skeleton */}
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
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Title and Back Button */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Yeni Poz Ekle</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Teklif Detayı
            </Button>
          </div>

          {/* Stepper */}
          <nav aria-label="Progress" className="w-full">
            <ol className="flex justify-between w-full">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className="relative flex flex-col items-center w-full"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${
                          currentStep === step.id
                            ? "bg-blue-600 text-white"
                            : index <
                              steps.findIndex((s) => s.id === currentStep)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }
                      `}
                    >
                      {index + 1}
                    </div>
                    <span className="mt-2 text-sm font-medium text-center w-full">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        absolute top-4 -right-1/2 w-full h-0.5 -z-10
                        ${
                          index < steps.findIndex((s) => s.id === currentStep)
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }
                      `}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Step Content */}
          <div className="mt-8">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <Button
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === "product"}
            >
              Geri
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={currentStep === "product" && !selectedProduct}
            >
              {currentStep === "details" ? "Tamamla" : "Devam Et"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
