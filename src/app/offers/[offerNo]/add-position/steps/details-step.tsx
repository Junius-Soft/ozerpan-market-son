"use client";

import { useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";
import { ProductPreview, type ProductTab } from "./components/product-preview";
import { DynamicForm } from "./components/dynamic-form";
import { type ProductDetails } from "./types";
import { usePanjurCalculator } from "./hooks/usePanjurCalculator";
import { PanjurSelections } from "@/types/panjur";

interface DetailsStepProps {
  selectedProduct: Product | null;
  formRef?: React.MutableRefObject<HTMLFormElement | null>;
  onFormChange?: (values: Record<string, unknown>) => void;
  tabs?: ProductTab[];
}

export function DetailsStep({
  selectedProduct,
  formRef,
  onFormChange,
}: DetailsStepProps) {
  const [productDetails, setProductDetails] = useState<ProductDetails>(() => {
    if (!selectedProduct?.tabs) return {} as ProductDetails;

    // Initialize state from product configuration
    return selectedProduct.tabs.reduce((details, tab) => {
      // Create tab entry if it doesn't exist
      if (!details[tab.id]) {
        details[tab.id] = {};
      }

      // Process fields for this tab
      if (tab.content?.fields) {
        const allFields = tab.content.fields;

        // First pass: set all non-dependent fields with default values
        allFields.forEach((field) => {
          if (!field.dependsOn && field.default !== undefined) {
            const defaultValue =
              typeof field.default === "boolean"
                ? field.default
                  ? "1"
                  : "0"
                : field.default.toString();

            // Always set default value for non-dependent fields during initialization
            details[tab.id][field.id] = defaultValue;
          }
        });

        // Second pass: handle dependent fields and their defaults
        allFields.forEach((field) => {
          if (field.dependsOn) {
            const parentField = field.dependsOn.field;
            const requiredValue = field.dependsOn.value;
            const parentValue = details[tab.id][parentField];

            // If parent field matches the required value, set the default
            if (parentValue === requiredValue && field.default !== undefined) {
              const defaultValue =
                typeof field.default === "boolean"
                  ? field.default
                    ? "1"
                    : "0"
                  : field.default.toString();

              details[tab.id][field.id] = defaultValue;
            }
          }
        });

        // Third pass: ensure all remaining fields have at least an empty value
        allFields.forEach((field) => {
          if (details[tab.id][field.id] === undefined) {
            details[tab.id][field.id] = "";
          }
        });
      }

      return details;
    }, {} as ProductDetails);
  });
  const [currentTab, setCurrentTab] = useState<string>(
    selectedProduct?.tabs?.[0].id ?? ""
  );
  const [quantity, setQuantity] = useState<number>(1);
  const availableTabs = useMemo(
    () => selectedProduct?.tabs || [],
    [selectedProduct]
  );

  const selections = useMemo<PanjurSelections>(() => {
    // Flatten the productDetails structure
    const result: Record<string, string | number> = {};
    // Using Object.values to ignore tab IDs
    Object.values(productDetails).forEach((tabValues) => {
      Object.entries(tabValues).forEach(([key, value]) => {
        if (key === "width" || key === "height") {
          const numValue = parseFloat(value as string);
          result[key] = isNaN(numValue) ? 0 : numValue;
          // console.log(`Setting ${key}:`, value, "->", result[key]); // Debug log
        } else {
          result[key] = value;
        }
      });
    });

    const parsed = {
      ...result,
      productId: selectedProduct?.id || "",
      quantity: quantity,
      panjurType:
        (result.panjurType as PanjurSelections["panjurType"]) || "distan",
      sectionCount: parseInt(result.sectionCount as string) || 1,
      width: parseFloat(result.width as string) || 0,
      height: parseFloat(result.height as string) || 0,
    } as PanjurSelections;

    return parsed;
  }, [productDetails, selectedProduct?.id, quantity]);

  // console.log("Current selections:", selections);
  const calculationResult = usePanjurCalculator(selections);
  // const { accessories, totalPrice } = useAccessories(selections);

  // console.log("Accessory Calculation result:", accessories);
  // console.log("Accessory Calculation result:", totalPrice);

  // Add quantity change handler
  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
  }, []);

  const handleProductDetailsChange = (
    tabId: string,
    field: string,
    value: string | number | boolean
  ) => {
    const processedValue =
      typeof value === "boolean" ? (value ? "1" : "0") : value.toString();

    setProductDetails((prev) => {
      const currentTab = availableTabs.find((tab) => tab.id === tabId);
      if (!currentTab) return prev;

      // Build the new state starting with all previous values
      const newState = { ...prev };

      // Create or update the tab if it doesn't exist
      if (!newState[tabId]) {
        newState[tabId] = {};
      }

      // Update the field value while preserving other fields in the tab
      newState[tabId] = {
        ...newState[tabId],
        [field]: processedValue,
      };

      // Handle dependent fields
      currentTab.content?.fields?.forEach((tabField) => {
        if (
          tabField.dependsOn?.field === field &&
          tabField.default !== undefined
        ) {
          const requiredValue = tabField.dependsOn.value;
          const shouldSetDefault = Array.isArray(requiredValue)
            ? requiredValue.includes(processedValue)
            : requiredValue === processedValue;

          if (shouldSetDefault) {
            const defaultValue =
              typeof tabField.default === "boolean"
                ? tabField.default
                  ? "1"
                  : "0"
                : tabField.default.toString();

            newState[tabId][tabField.id] = defaultValue;
          }
        }
      });

      return newState;
    });
  };

  const renderTabContent = () => {
    // Get tab by ID from available tabs
    const activeTab = availableTabs.find((tab) => tab.id === currentTab);

    // If the tab has content with fields defined, use dynamic form
    if (activeTab?.content?.fields && activeTab.content.fields.length > 0) {
      // Get values for the fields from productDetails based on tab category
      const getValuesForTab = (): Record<string, string | number | boolean> => {
        if (!activeTab?.content?.fields) return {};

        const tabValues = productDetails[activeTab.id] || {};
        return activeTab.content.fields.reduce((acc, field) => {
          if (!field) return acc;

          const value = tabValues[field.id];

          // Convert string values to appropriate types based on field type
          switch (field.type) {
            case "number":
              acc[field.id] =
                value !== undefined ? parseFloat(value.toString()) : 0;
              break;
            case "checkbox":
              acc[field.id] = value === "1";
              break;
            default:
              acc[field.id] = value || "";
          }
          return acc;
        }, {} as Record<string, string | number | boolean>);
      };

      const handleDynamicFormChange = (
        fieldId: string,
        value: string | number | boolean
      ) => {
        handleProductDetailsChange(activeTab.id, fieldId, value);
      };
      // Render form with preview if it's the dimensions tab
      if (activeTab.content.preview) {
        return (
          <>
            <DynamicForm
              fields={activeTab.content.fields}
              values={getValuesForTab()}
              onChange={handleDynamicFormChange}
              formRef={formRef}
            />
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">Ürün Önizleme</h4>
              <div className="aspect-square w-full max-w-xl mx-auto border rounded-lg overflow-hidden shadow-sm">
                {getProductPreview({
                  product: selectedProduct,
                  width: parseFloat(productDetails.dimensions.width.toString()),
                  height: parseFloat(
                    productDetails.dimensions.height.toString()
                  ),
                  className: "p-4",
                  tabId: activeTab.id,
                })}
              </div>
            </div>
          </>
        );
      }

      // Otherwise just render the form
      return (
        <DynamicForm
          fields={activeTab.content.fields}
          values={getValuesForTab()}
          onChange={(fieldId, value) => {
            handleDynamicFormChange(fieldId, value);
            handleFormChange({ [fieldId]: value });
          }}
          onFormikChange={(formik) => {
            // Değişen alan ve değeri al
            const changedValues = Object.entries(formik.values);

            // Önce normal değişiklikleri uygula
            changedValues.forEach(([key, value]) => {
              handleDynamicFormChange(key, value);
            });

            // Bağımlı alanları kontrol et
            activeTab.content?.fields?.forEach((field) => {
              if (field.dependsOn) {
                const mainField = changedValues.find(
                  ([key]) => key === field.dependsOn?.field
                );
                if (
                  mainField &&
                  mainField[1].toString() === field.dependsOn.value
                ) {
                  // Bağımlı alan için varsayılan değeri ayarla
                  const defaultValue =
                    field.default !== undefined
                      ? typeof field.default === "boolean"
                        ? field.default
                          ? "1"
                          : "0"
                        : field.default.toString()
                      : "";
                  handleDynamicFormChange(field.id, defaultValue);
                }
              }
            });
          }}
        />
      );
    }
  };

  // Form değişiklik handler'ı
  const handleFormChange = useCallback(
    (values: Record<string, unknown>) => {
      onFormChange?.(values);
    },
    [onFormChange]
  );

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
              className="flex-1"
            >
              {tab.name}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <Card className="p-6">
          <div className="space-y-6">{renderTabContent()}</div>
          <input type="submit" hidden />
        </Card>
      </div>

      {/* Right Side - Preview */}
      <ProductPreview
        selectedProduct={selectedProduct}
        productDetails={productDetails}
        currentTab={currentTab}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
        calculationResult={calculationResult}
        tabs={availableTabs.map((tab) => ({
          id: tab.id,
          name: tab.name,
          content: tab.content
            ? {
                fields: tab.content.fields?.map((field) => ({
                  ...field,
                  options: field.options?.map((opt) => ({
                    id: opt.id ?? "",
                    name: opt.name ?? "",
                  })),
                })),
              }
            : undefined,
        }))}
      />
    </div>
  );
}
