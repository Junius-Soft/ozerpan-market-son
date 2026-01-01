import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getProductPreview as ProductPreviewComponent,
  ProductPreviewRef,
} from "@/lib/product-preview";
import { type Product } from "@/documents/products";
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
import { useFormikContext } from "formik";
import { PanjurSelections, PriceItem, SelectedProduct } from "@/types/panjur";
import { calculateSystemHeight, calculateSystemWidth } from "@/utils/panjur";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setQuantity } from "@/store/appSlice";

import { useCalculator } from "../hooks/useCalculator";

interface ProductField {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id?: string; name: string }>;
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
  currentTab: string;
  onTotalChange?: (total: number) => void;
  summaryRef?: React.RefObject<HTMLDivElement>;
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
  optionId?: string | null; // Montaj tipi (distan, monoblok, yalitimli)
}

export interface ProductPreviewComponentRef {
  exportCanvas: () => string | null;
}

// Helper function to format field value
const formatFieldValue = (
  value:
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | SelectedProduct[]
    | { products: SelectedProduct[]; accessories: PriceItem[] },
  fieldId: string,
  field?: ProductField
): string => {
  if (field?.options) {
    const option = field.options.find((opt) => opt.id === value);
    if (option) return option.name;
    else return field.options[0]?.name;
  }

  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  // Açı alanları için derece birimi + dönüş parçası hesaplaması
  if (fieldId.endsWith("_aci")) {
    const angle = Number(value);
    if (!isNaN(angle) && angle >= 0 && angle <= 360) {
      // Dönüş parçası hesaplama: A = 20 * tan(90 - (Açı/2))
      // Açı değerini normalize et - 180'den büyükse 360'dan çıkar
      const anglePositive = angle > 180 ? 360 - angle : angle;
      const angleInRadians = (anglePositive * Math.PI) / 180;
      const turnPiece = 20 * Math.tan(Math.PI / 2 - angleInRadians / 2);

      // Negatif değeri pozitif yap - mutlak değer al
      const result = Math.abs(Math.round(turnPiece * 100) / 100);

      // Toplam hesaplama
      const total = 16 + result;
      const totalRounded = Math.round(total * 100) / 100;

      return `${value}° (16 mm + ${result}mm = ${totalRounded}mm)`;
    }
    return `${value}°`;
  }
  if (Array.isArray(value)) {
    if (typeof value[0] === "number") {
      return value.map((v) => `${v} mm`).join(", ");
    }
    if (typeof value[0] === "string") {
      return value.join(", ");
    }
    if (typeof value[0] === "boolean") {
      return value.map((v) => (v ? "Evet" : "Hayır")).join(", ");
    }
  }
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

export const ProductPreview = forwardRef<
  ProductPreviewComponentRef,
  ProductPreviewProps
>(({ selectedProduct, onTotalChange, summaryRef, seperation, optionId }, ref) => {
  const productPreviewRef = useRef<ProductPreviewRef>(null);
  const { loading, eurRate } = useExchangeRate();
  const formik = useFormikContext<PanjurSelections>();
  const { values } = formik;
  const dispatch = useDispatch();
  const quantity = useSelector((state: RootState) => state.app.quantity);
  const calculationResult = useCalculator(
    values,
    selectedProduct?.id ?? "",
    selectedProduct?.tabs ?? []
  );

  // Export canvas function exposed via ref
  useImperativeHandle(ref, () => ({
    exportCanvas: () => {
      if (productPreviewRef.current) {
        return productPreviewRef.current.exportCanvas();
      }
      return null;
    },
  }));

  // Toplam tutar değişimini parent'a bildir
  React.useEffect(() => {
    if (onTotalChange && calculationResult) {
      onTotalChange(calculationResult.totalPrice);
    }
  }, [onTotalChange, calculationResult]);

  if (!selectedProduct) return null;
  return (
    <Card className="p-6" ref={summaryRef}>
      <div className="space-y-6">
        <div className="font-medium text-lg mb-4">Ürün Önizleme</div>
        <div className="aspect-[4/4] w-full max-w-2xl mx-auto border rounded-lg overflow-hidden shadow-sm flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            <ProductPreviewComponent
              ref={productPreviewRef}
              product={selectedProduct}
              formik={formik}
              width={parseFloat(values.width?.toString() ?? "0")}
              height={parseFloat(values.height?.toString() ?? "0")}
              className="w-full h-full object-contain pt-2" // preview tam ortalí ve kapsayıcı
              seperation={seperation}
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Adet</label>
            <Input
              type="number"
              min={1}
              name="quantity"
              value={quantity}
              onChange={(e) => {
                const newQuantity = parseInt(e.target.value) || 1;
                dispatch(setQuantity(newQuantity));
              }}
            />
          </div>
          {calculationResult && (
            <div className="space-y-2 border-t pt-4">
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
                        {Array.isArray(
                          calculationResult.selectedProducts.products
                        ) &&
                          calculationResult.selectedProducts.products.length >
                            0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Ürünler</h4>
                              {calculationResult.selectedProducts.products.map(
                                (product, index) => (
                                  <div
                                    key={index}
                                    className="border-b border-border last:border-b-0 py-2 pl-2"
                                  >
                                    <div className="flex justify-between">
                                      <span>{product.description}</span>
                                      <span className="font-mono">
                                        {selectedProduct.currency.symbol}{" "}
                                        {product.price}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <div className="flex gap-2">
                                        <span>
                                          Adet: <b>{product.quantity}</b>
                                        </span>
                                        {product.size && (
                                          <span>
                                            Boyut: <b>
                                              {product.unit === "M2"
                                                ? `${typeof product.size === "number" ? product.size.toFixed(2) : product.size} m²`
                                                : `${product.size}mm`}
                                            </b>
                                          </span>
                                        )}
                                        <span>
                                          Birim: <b>{product.unit}</b>
                                        </span>
                                      </div>
                                      <span>
                                        Toplam:{" "}
                                        {selectedProduct.currency.symbol}{" "}
                                        {(product.totalPrice ?? 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        {/* Accessories */}
                        {Array.isArray(
                          calculationResult.selectedProducts.accessories
                        ) &&
                          calculationResult.selectedProducts.accessories
                            .length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">
                                Aksesuarlar
                              </h4>
                              {calculationResult.selectedProducts.accessories.map(
                                (acc, idx) => (
                                  <div
                                    key={idx}
                                    className="border-b border-border last:border-b-0 py-2 pl-2"
                                  >
                                    <div className="flex justify-between">
                                      <span>{acc.description}</span>
                                      <span className="font-mono">
                                        {selectedProduct.currency.symbol}{" "}
                                        {acc.price}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                      <div className="flex gap-2">
                                        <span>
                                          Adet: <b>{acc.quantity}</b>
                                        </span>
                                        {acc.size && (
                                          <span>
                                            Boyut: <b>
                                              {acc.unit === "M2" 
                                                ? `${typeof acc.size === "number" ? acc.size.toFixed(2) : acc.size} m²`
                                                : `${acc.size}mm`}
                                            </b>
                                          </span>
                                        )}
                                        <span>
                                          Birim: <b>{acc.unit}</b>
                                        </span>
                                      </div>
                                      <span>
                                        Toplam:{" "}
                                        {selectedProduct.currency.symbol}{" "}
                                        {(acc.totalPrice ?? 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </CustomDialog>
                    </span>
                  </span>
                  {loading ? (
                    <div className="text-muted-foreground">Hesaplanıyor..</div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-base hover:text-primary transition-colors"
                          >
                            {selectedProduct.currency.symbol}{" "}
                            {(
                              (calculationResult.totalPrice ?? 0) *
                              Number(quantity || 1)
                            ).toFixed(2)}
                          </button>
                        </TooltipTrigger>
                        {selectedProduct.currency.code === "EUR" && (
                          <TooltipContent
                            side="top"
                            align="end"
                            className="flex flex-col gap-1"
                          >
                            <div>
                              ₺{" "}
                              {formatPrice(
                                calculationResult.totalPrice,
                                eurRate
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              1€ = ₺{eurRate.toFixed(2)}
                            </div>
                          </TooltipContent>
                        )}
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
            {selectedProduct?.tabs
              ?.filter((tab) => {
                // showIfOptionId kontrolü: Eğer tab'ın showIfOptionId'si varsa, optionId ile eşleşmeli
                if (tab.showIfOptionId) {
                  return tab.showIfOptionId === optionId;
                }
                return true; // showIfOptionId yoksa her zaman göster
              })
              ?.map((tab) => {
              const fields = tab.content?.fields || [];

              if (fields.length === 0) return null;

              const displayFields = fields.reduce<
                Array<{ name: string; value: string }>
              >((acc, field) => {
                // Field'ın dependency kontrolü
                if (!checkDependencyChain(field, values, fields)) {
                  return acc;
                }

                let fieldValue =
                  field.id &&
                  Object.prototype.hasOwnProperty.call(values, field.id)
                    ? values[field.id as keyof typeof values] ?? ""
                    : "";
                if (fieldValue === "" || fieldValue === null) return acc;

                // PANJUR ürününde yükseklik için özel gösterim
                if (selectedProduct.id === "panjur") {
                  if (field.id === "height") {
                    fieldValue = calculateSystemHeight(
                      values.height,
                      values.kutuOlcuAlmaSekli,
                      values.boxType
                    );
                  }
                  if (field.id === "width") {
                    fieldValue =
                      calculateSystemWidth(
                        values.width,
                        values.dikmeOlcuAlmaSekli,
                        values.dikmeType
                      ) + 10;
                  }
                  return [
                    ...acc,
                    {
                      name: field.name,
                      value: formatFieldValue(fieldValue, field.id, field),
                    },
                  ];
                }

                return [
                  ...acc,
                  {
                    name: field.name,
                    value: formatFieldValue(fieldValue, field.id, field),
                  },
                ];
              }, []);

              return (
                <div key={tab.id} className="pt-4">
                  <div className="font-medium text-sm mb-2">{tab.name}</div>
                  <div className="flex flex-col gap-1">
                    {displayFields.map((field, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {field.name}
                        </span>
                        <span className="font-medium text-foreground">
                          {field.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Kepenk için m² bilgisi en sonda */}
            {selectedProduct?.id === "kepenk" && values.width && values.height && (
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Metrekare</span>
                  <span className="font-medium text-foreground">
                    {((parseFloat(values.width.toString()) * parseFloat(values.height.toString())) / 1000000).toFixed(2)} m²
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

ProductPreview.displayName = "ProductPreview";
