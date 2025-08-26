"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { type Product } from "@/documents/products";

interface ProductStepProps {
  products: Product[];
  selectedProduct: Product | null;
  selectedType: string | null;
  selectedOption: string | null;
  onProductSelect: (product: Product) => void;
  onTypeSelect: (typeId: string) => void;
  onOptionSelect: (optionId: string, product?: Product) => void;
}

export function ProductStep({
  products,
  selectedProduct,
  selectedType,
  selectedOption,
  onProductSelect,
  onTypeSelect,
  onOptionSelect,
}: ProductStepProps) {
  const product = products.find((p) => p.id === selectedProduct?.id);
  return (
    <div>
      {/* Ürünler */}
      <div className="flex gap-6 overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible pb-2 -mx-4 px-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className={`
              relative p-6 cursor-pointer transition-all min-w-[220px] sm:min-w-0
              ${
                product.isActive
                  ? "hover:border-blue-500"
                  : "opacity-50 cursor-not-allowed"
              }
              ${
                selectedProduct?.id === product.id
                  ? "border-2 border-blue-500"
                  : ""
              }
            `}
            onClick={() => {
              if (product.isActive) {
                onProductSelect(product);
              }
            }}
          >
            <div className="aspect-video relative mb-4 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              {product.options && (
                <div className="flex flex-wrap gap-2">
                  {product.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onProductSelect(product);
                        if (
                          !selectedType &&
                          product.types &&
                          product.types.length > 0
                        ) {
                          const firstActiveType = product.types.find(
                            (t) => !t.disabled
                          );
                          if (firstActiveType) {
                            onTypeSelect(firstActiveType.id);
                          }
                        }
                        onOptionSelect(option.id, product);
                      }}
                      disabled={option.disabled}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-colors 
                        ${
                          selectedOption === option.id
                            ? "bg-blue-100 text-blue-800 ring-2 ring-blue-500"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }
                      `}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!product.isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 rounded-lg">
                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                  Yakında
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Ürün Tipleri */}
      {product?.types && (
        <div className="lg:col-span-4 border-t pt-8 mt-8">
          <h3 className="text-lg font-semibold mb-4">Ürün Tipleri</h3>
          <div className="flex gap-6 overflow-x-auto sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible pb-2 -mx-4 px-4">
            {product?.types?.map((type) => (
              <Card
                key={type.id}
                className={`
                    relative p-6 cursor-pointer transition-all min-w-[220px] sm:min-w-0
                    ${
                      !type.disabled
                        ? "hover:border-blue-500"
                        : "opacity-50 cursor-not-allowed"
                    }
                    ${
                      selectedType === type.id ? "border-2 border-blue-500" : ""
                    }
                  `}
                onClick={() => !type.disabled && onTypeSelect(type.id)}
              >
                <div className="aspect-video relative mb-4 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={type.image}
                    alt={type.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{type.name}</h3>
                </div>
                {type.disabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 rounded-lg">
                    <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                      Yakında
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
