"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { type Position } from "@/documents/offers";
import { type Product } from "@/documents/products";
import { getProductPreview } from "@/lib/product-preview";
import { ProductPreview } from "./components/product-preview";
import { DynamicForm } from "./components/dynamic-form";
import { type ProductDetails } from "./types";

interface DetailsStepProps {
  selectedProduct: Product | null;
  onPositionDetailsChange: (details: Omit<Position, "id" | "total">) => void;
  formRef?: React.MutableRefObject<HTMLFormElement | null>;
}

export function DetailsStep({
  selectedProduct,
  onPositionDetailsChange,
  formRef,
}: DetailsStepProps) {
  // Default to first tab if available
  const [currentTab, setCurrentTab] = useState<string>(
    selectedProduct?.tabs?.[0].id ?? ""
  );
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

  const isInitialMount = useRef(true);
  const availableTabs = useMemo(
    () => selectedProduct?.tabs || [],
    [selectedProduct]
  );

  // Memoize the update function to avoid unnecessary recalculations
  const updatePositionDetails = useCallback(
    (details: ProductDetails) => {
      // Tab değerlerini ve fieldları bul
      const findTabAndField = (fieldName: string) => {
        const tab = availableTabs.find((tab) =>
          tab.content?.fields?.some((field) => field.id === fieldName)
        );
        return tab ? details[tab.id] || {} : {};
      };

      // Gerekli değerleri dinamik olarak al
      const width = parseFloat(
        Object.values(details).reduce(
          (val, tabValues) => tabValues.width?.toString() || val,
          "0"
        )
      );
      const height = parseFloat(
        Object.values(details).reduce(
          (val, tabValues) => tabValues.height?.toString() || val,
          "0"
        )
      );
      const area = (width * height) / 10000;

      if (!isNaN(area) && area > 0) {
        // Tab değerlerini dinamik olarak bul
        const movementValues = findTabAndField("movementType");
        const lamelValues = findTabAndField("lamelType");
        const colorValues = findTabAndField("color");
        const divisionsValues = findTabAndField("kutuOlcuAlmaSekli");

        const movementText =
          movementValues.movementType === "motorlu" ? "Motorlu" : "Manuel";
        const lamelText = lamelValues.lamelType || "";
        const colorText = colorValues.color || "";
        const kutuText =
          divisionsValues.kutuOlcuAlmaSekli === "kutu-dahil"
            ? "Kutu Dahil"
            : "Kutu Hariç";
        const dikmeText =
          divisionsValues.dikmeOlcuAlmaSekli === "dikme-dahil"
            ? "Dikme Dahil"
            : divisionsValues.dikmeOlcuAlmaSekli === "dikme-haric"
            ? "Dikme Hariç"
            : "Tek Dikme";

        onPositionDetailsChange({
          pozNo: "PNJ-001",
          description: `${movementText} ${lamelText} Panjur - ${colorText} (${width}x${height}mm) - ${kutuText}, ${dikmeText}`,
          unit: "m²",
          quantity: area,
          unitPrice: 1000,
        });
      }
    },
    [onPositionDetailsChange, availableTabs]
  );

  // Update useEffect to use the same dynamic field finding logic
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      const width = parseFloat(
        Object.values(productDetails).reduce(
          (val, tabValues) => tabValues.width?.toString() || val,
          "0"
        )
      );
      const height = parseFloat(
        Object.values(productDetails).reduce(
          (val, tabValues) => tabValues.height?.toString() || val,
          "0"
        )
      );
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        updatePositionDetails(productDetails);
      }
    }
  }, [productDetails, updatePositionDetails]);

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
          tabField.dependsOn?.value === processedValue &&
          tabField.default !== undefined
        ) {
          const defaultValue =
            typeof tabField.default === "boolean"
              ? tabField.default
                ? "1"
                : "0"
              : tabField.default.toString();

          // Update dependent field while preserving other values
          newState[tabId] = {
            ...newState[tabId],
            [tabField.id]: defaultValue,
          };
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
          onChange={handleDynamicFormChange}
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
      />
    </div>
  );
}
