"use client";

import {
  useState,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/documents/products";
import { getProductPreview as ProductPreviewComponent } from "@/lib/product-preview";
import { DynamicForm } from "./components/dynamic-form";

import { FormikProps } from "formik";
import {
  ProductPreview,
  ProductPreviewComponentRef,
} from "./components/product-preview";
import { PanjurSelections } from "@/types/panjur";
import { useFilterLamelThickness } from "./hooks/form-rules/useFilterLamelThickness";
import { useFilterMotorModel } from "./hooks/form-rules/useFilterMotorModel";
import { useFilterKepenkMotor } from "./hooks/form-rules/useFilterKepenkMotor";
import { useFilterBoxSize } from "./hooks/form-rules/useFilterBoxSize";
import { useAutoDependencyAndFilterBy } from "./hooks/useAutoDependencyDefaults";
import { AlertTriangle } from "lucide-react";
import { useCalculator } from "./hooks/useCalculator";

interface DetailsStepProps {
  // Formik değerleri ürün tipine göre değiştiği için burada geniş tip kullanıyoruz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
  selectedProduct: Product | null;
  onTotalChange?: (total: number) => void;
  summaryRef: React.RefObject<HTMLDivElement>;
  typeId: number;
  optionId: string | null;
}

export interface DetailsStepRef {
  exportCanvas: () => string | null;
}

export const DetailsStep = forwardRef<DetailsStepRef, DetailsStepProps>(
  (
    { formik, selectedProduct, onTotalChange, summaryRef, typeId, optionId },
    ref
  ) => {
    const productPreviewRef = useRef<ProductPreviewComponentRef>(null);

    // Export canvas function exposed via ref
    useImperativeHandle(ref, () => ({
      exportCanvas: () => {
        if (productPreviewRef.current) {
          return productPreviewRef.current.exportCanvas();
        }
        return null;
      },
    }));

    // Use correct productType based on selectedProduct
    const productType = (selectedProduct?.id || "panjur") as "panjur" | "kepenk" | "sineklik" | "cam-balkon";
    useAutoDependencyAndFilterBy(formik, productType, optionId);
    
    // Panjur-specific hooks (they already check productId internally)
    useFilterLamelThickness(formik);
    useFilterMotorModel(formik, selectedProduct);
    useFilterKepenkMotor(formik, selectedProduct);
    useFilterBoxSize(formik);
    const { totalPrice, selectedProducts } = useCalculator(
      formik.values,
      selectedProduct?.id ?? "",
      selectedProduct?.tabs ?? []
    );

    // selectedProducts'ı JSON string olarak serialize ederek değişiklik takibi yapalım
    const selectedProductsJSON = JSON.stringify(selectedProducts);

    useEffect(() => {
      formik.setFieldValue("unitPrice", totalPrice);
      formik.setFieldValue("selectedProducts", selectedProducts);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPrice, selectedProductsJSON]); // formik intentionally excluded to prevent infinite loop

    const availableTabs = useMemo(() => {
      if (!selectedProduct?.tabs) return [];
      // optionId'ye göre filtrele
      return selectedProduct.tabs.filter((tab) => {
        if (!tab.showIfOptionId) return true;
        return tab.showIfOptionId === optionId;
      });
    }, [selectedProduct, optionId]);
    const [currentTab, setCurrentTab] = useState<string>(
      availableTabs[0].id ?? ""
    );

    const renderTabContent = (
      formik: FormikProps<
        PanjurSelections & Record<string, string | number | boolean>
      >
    ) => {
      const activeTab = availableTabs.find((tab) => tab.id === currentTab);

      if (activeTab?.content?.fields && activeTab.content.fields.length > 0) {
        const values = formik.values;
        return (
          <>
            <DynamicForm
              formik={formik}
              fields={activeTab.content.fields}
              values={values}
            />
            {activeTab.content.preview && (
              <div className="mt-6">
                <h4 className="text-md font-medium mb-3">Ürün Önizleme</h4>
                {/* Uyarı: seperation > 1 ise göster */}
                {selectedProduct?.id === "panjur" && typeId > 1 && (
                  <div className="flex w-full max-w-xl mx-auto gap-4 my-4">
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                      <div className="flex items-start gap-2 p-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Dikme konumunu ayarlamak için{" "}
                          <b>dikmeye tıklayınız.</b>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                      <div className="flex items-start gap-2 p-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />

                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Bölme yüksekliği ayarlamak için{" "}
                          <b>bölmeye tıklayınız.</b>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-2 w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
                  <ProductPreviewComponent
                    product={selectedProduct}
                    formik={formik}
                    width={values.width}
                    height={values.height}
                    seperation={typeId}
                  />
                </div>
              </div>
            )}
          </>
        );
      }
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Tabs and Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs - Using API provided tabs */}
          <div className="flex flex-wrap gap-2">
            {availableTabs.map((tab) => (
              <Button
                key={tab.id}
                variant={currentTab === tab.id ? "default" : "outline"}
                onClick={() => setCurrentTab(tab.id)}
                type="button" // Form submit davranışını engellemek için type="button" eklendi
                className="flex-1"
              >
                {tab.name}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          <Card className="p-6">
            <div className="space-y-6">{renderTabContent(formik)}</div>
          </Card>
        </div>

        {/* Right Side - Preview */}
        <ProductPreview
          ref={productPreviewRef}
          selectedProduct={selectedProduct}
          currentTab={currentTab}
          onTotalChange={onTotalChange}
          summaryRef={summaryRef}
          seperation={typeId}
        />
      </div>
    );
  }
);

DetailsStep.displayName = "DetailsStep";
