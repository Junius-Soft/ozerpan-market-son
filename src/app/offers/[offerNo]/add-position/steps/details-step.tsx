"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";
import { DynamicForm } from "./components/dynamic-form";

import { FormikProps } from "formik";
import { ProductPreview } from "./components/product-preview";
import { PanjurSelections } from "@/types/panjur";
import { useFormRules } from "./hooks/useFormRules";
import { usePanjurCalculator } from "./hooks/usePanjurCalculator";

interface DetailsStepProps {
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >;
  selectedProduct: Product | null;
}

export function DetailsStep({ formik, selectedProduct }: DetailsStepProps) {
  useFormRules(formik, selectedProduct);
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

    if (activeTab?.content?.fields && activeTab.content.fields.length > 0) {
      const values = formik.values;
      return (
        <>
          <DynamicForm fields={activeTab.content.fields} values={values} />
          {activeTab.content.preview && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Ürün Önizleme</h4>
              <div className="aspect-square w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
                {getProductPreview({
                  product: selectedProduct,
                  width: values.width,
                  height: values.height,
                  className: "p-4",
                  productId: selectedProduct?.id || "",
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
      />
    </div>
  );
}
