"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";
import { DynamicForm } from "./components/dynamic-form";
import { getColorHexFromProductTabs } from "@/utils/get-color-hex";

import { FormikProps } from "formik";
import { ProductPreview } from "./components/product-preview";
import { PanjurSelections } from "@/types/panjur";
import { usePanjurCalculator } from "./hooks/usePanjurCalculator";
import { useFilterLamelThickness } from "./hooks/form-rules/useFilterLamelThickness";
import { useFilterMotorModel } from "./hooks/form-rules/useFilterMotorModel";
import { useFilterBoxSize } from "./hooks/form-rules/useFilterBoxSize";
import { useAutoDependencyAndFilterBy } from "./hooks/useAutoDependencyDefaults";
import {
  calculateLamelCount,
  calculateSystemHeight,
  calculateSystemWidth,
  getBoxHeight,
} from "@/utils/panjur";
import { AlertTriangle } from "lucide-react";

interface DetailsStepProps {
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >;
  selectedProduct: Product | null;
  onTotalChange?: (total: number) => void;
  summaryRef: React.RefObject<HTMLDivElement>;
  typeId: number;
}

export function DetailsStep({
  formik,
  selectedProduct,
  onTotalChange,
  summaryRef,
  typeId,
}: DetailsStepProps) {
  useAutoDependencyAndFilterBy(formik, "panjur");
  useFilterLamelThickness(formik);
  useFilterMotorModel(formik, selectedProduct);
  useFilterBoxSize(formik);
  const { totalPrice, selectedProducts } = usePanjurCalculator(
    formik.values,
    selectedProduct?.tabs ?? []
  );
  useEffect(() => {
    formik.setFieldValue("unitPrice", totalPrice);
    formik.setFieldValue("selectedProducts", selectedProducts);
  }, [totalPrice]);

  const availableTabs = useMemo(
    () => selectedProduct?.tabs ?? [],
    [selectedProduct]
  );
  const [currentTab, setCurrentTab] = useState<string>(
    selectedProduct?.tabs?.[0].id ?? ""
  );

  const renderTabContent = (
    formik: FormikProps<
      PanjurSelections & Record<string, string | number | boolean>
    >
  ) => {
    const activeTab = availableTabs.find((tab) => tab.id === currentTab);

    // --- Renk kodlarını bulmak için yardımcı fonksiyon ---
    function getColorHex(fieldId: string): string | undefined {
      return getColorHexFromProductTabs(
        selectedProduct?.tabs ?? [],
        formik.values as Record<string, unknown>,
        fieldId
      );
    }
    // ---
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
              {typeId > 1 && (
                <div className="flex w-full max-w-xl mx-auto gap-4 my-4">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-700/50">
                    <div className="flex items-start gap-2 p-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Dikme konumunu ayarlamak için <b>dikmeye tıklayınız.</b>
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
                {getProductPreview({
                  product: selectedProduct,
                  width: values.width,
                  height: values.height,
                  productId: selectedProduct?.id || "",
                  lamelColor: getColorHex("lamel_color"),
                  boxColor: getColorHex("box_color"),
                  subPartColor: getColorHex("subPart_color"),
                  dikmeColor: getColorHex("dikme_color"),
                  boxHeight: getBoxHeight(values.boxType),
                  hareketBaglanti: values.hareketBaglanti,
                  movementType: values.movementType,
                  seperation: typeId,
                  lamelCount: calculateLamelCount(
                    calculateSystemHeight(
                      values.height,
                      values.kutuOlcuAlmaSekli,
                      values.boxType
                    ),
                    values.boxType,
                    values.lamelTickness
                  ),
                  systemHeight: calculateSystemHeight(
                    values.height,
                    values.kutuOlcuAlmaSekli,
                    values.boxType
                  ),
                  systemWidth:
                    calculateSystemWidth(
                      values.width,
                      values.dikmeOlcuAlmaSekli,
                      values.dikmeType
                    ) + 10,
                  changeMiddlebarPostion: true,
                })}
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
        selectedProduct={selectedProduct}
        currentTab={currentTab}
        onTotalChange={onTotalChange}
        summaryRef={summaryRef}
        seperation={typeId}
      />
    </div>
  );
}
