import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getProductPreview } from "@/lib/product-preview";
import { type Product } from "@/documents/products";
import { ProductDetails } from "../types";
import { CalculationResult } from "@/types/panjur";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { checkDependencyChain } from "@/utils/dependencies";
import { formatPrice } from "@/utils/price-formatter";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductField {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; name: string }>;
  dependsOn?: {
    field: string;
    value: string | string[];
  };
}

export interface ProductTab {
  id: string;
  name: string;
  content?: {
    fields?: ProductField[];
  };
}

interface ProductPreviewProps {
  selectedProduct: Product | null;
  productDetails: ProductDetails;
  currentTab: string;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  calculationResult?: CalculationResult;
  tabs?: ProductTab[];
}

// Helper function to format field value
const formatFieldValue = (
  value: string | number | boolean,
  fieldId: string,
  field?: ProductField
): string => {
  if (field?.options) {
    const option = field.options.find((opt) => opt.id === value);
    if (option) return option.name;
    else return field.options[0]?.name;
  }

  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (field?.type === "number" || fieldId === "width" || fieldId === "height") {
    return `${value} mm`;
  }
  if (fieldId.endsWith("_color") && typeof value === "string") {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return String(value);
};

export function ProductPreview({
  selectedProduct,
  productDetails,
  currentTab,
  quantity,
  onQuantityChange,
  calculationResult,
  tabs = [],
}: ProductPreviewProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [localValues, setLocalValues] = useState(productDetails);
  const { loading, eurRate } = useExchangeRate();

  // Product details değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalValues(productDetails);
  }, [productDetails]);

  // Quantity değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  const handleQuantityChange = (newValue: number) => {
    setLocalQuantity(newValue);
    onQuantityChange(newValue);
  };
  if (!selectedProduct) return null;
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="font-medium text-lg mb-4">Ürün Önizleme</div>
        <div className="aspect-video w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
          {getProductPreview({
            product: selectedProduct,
            width: parseFloat(localValues.dimensions?.width?.toString() ?? "0"),
            height: parseFloat(
              localValues.dimensions?.height?.toString() ?? "0"
            ),
            className: "p-4",
            tabId: currentTab,
          })}
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Adet</label>
            <Input
              type="number"
              min={1}
              value={localQuantity}
              onChange={(e) =>
                handleQuantityChange(parseInt(e.target.value) || 1)
              }
            />
          </div>
          {calculationResult && (
            <div className="space-y-2 border-t pt-4">
              {" "}
              <div className="text-sm space-y-1">
                <div className="flex justify-between font-medium text-base">
                  <span>
                    <span className="flex items-center gap-2">
                      Toplam Fiyat:
                      <CustomDialog
                        trigger={
                          <button className="rounded-full w-4 h-4 inline-flex items-center justify-center text-muted-foreground hover:bg-muted">
                            <Info className="w-3 h-3" />
                          </button>
                        }
                        title="Ürün Detayları"
                        description="Seçilen ürünün detaylı fiyat bilgileri ve özellikleri"
                      >
                        {calculationResult.selectedProducts.map(
                          (product, index) => (
                            <div
                              key={index}
                              className="border-b border-border last:border-b-0 py-3"
                            >
                              <h3 className="font-medium mb-2 text-foreground">
                                {product.description}
                              </h3>
                              <div className="space-y-1 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">
                                    Birim Fiyat:
                                  </span>
                                  <span className="text-foreground font-mono">
                                    € {product.price}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">
                                    Adet:
                                  </span>
                                  <span className="text-foreground font-mono">
                                    {product.quantity}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground">
                                    Toplam Fiyat:
                                  </span>
                                  <span className="text-foreground font-mono">
                                    €{" "}
                                    {parseFloat(product.price) *
                                      product.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </CustomDialog>
                    </span>
                  </span>
                  {loading ? (
                    <div className="text-muted-foreground">Hesaplanıyor..</div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger className="text-base">
                          ₺{formatPrice(calculationResult.totalPrice, eurRate)}
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          align="end"
                          className="flex flex-col gap-1"
                        >
                          <div>€ {calculationResult.totalPrice.toFixed(2)}</div>
                          <div className="text-muted-foreground">
                            1€ = ₺{eurRate.toFixed(2)}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              {calculationResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <h5 className="font-medium text-destructive mb-1">
                    Uyarılar:
                  </h5>
                  <ul className="list-disc list-inside text-sm text-destructive">
                    {calculationResult.errors.map(
                      (error: string, index: number) => (
                        <li key={index}>{error}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-medium">Seçilen Özellikler</h4>
            {tabs.map((tab) => {
              const tabValues = localValues[tab.id] || {};
              const fields = tab.content?.fields || [];

              if (fields.length === 0) return null;

              const displayFields = fields.reduce<
                Array<{ name: string; value: string }>
              >((acc, field) => {
                // Field'ın dependency kontrolü
                if (!checkDependencyChain(field, tabValues, fields)) {
                  return acc;
                }

                const fieldValue = tabValues[field.id];
                if (fieldValue === undefined || fieldValue === "") return acc;

                const displayValue = formatFieldValue(
                  fieldValue,
                  field.id,
                  field
                );
                acc.push({
                  name: field.name,
                  value: displayValue,
                });
                return acc;
              }, []);

              if (displayFields.length === 0) return null;

              return (
                <div
                  key={tab.id}
                  className="border-t first:border-t-0 pt-2 first:pt-0"
                >
                  <div className="text-sm font-medium text-muted-foreground mb-1.5">
                    {tab.name}
                  </div>
                  <div className="space-y-1">
                    {displayFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-baseline text-sm justify-between"
                      >
                        <span className="flex-none font-medium text-foreground">
                          {field.name}
                        </span>
                        <span className="text-muted-foreground text-right">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
