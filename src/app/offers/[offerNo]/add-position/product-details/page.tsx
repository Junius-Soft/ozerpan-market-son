"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { type Product, getProductTabs } from "@/documents/products";
import { DetailsStep } from "../steps/details-step";
import { getOffer, type Position } from "@/documents/offers";
import { getOffers } from "@/documents/offers";
import { PanjurSelections } from "@/types/panjur";
import { Formik, Form, FormikProps } from "formik";
import { handleImalatListesiPDF } from "@/utils/handle-imalat-listesi";

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const formikRef = useRef<FormikProps<PanjurSelections & Record<string, string | number | boolean>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const initialLoadDone = useRef(false);
  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName");
  const typeId = searchParams.get("typeId");
  const optionId = searchParams.get("optionId");
  const selectedPosition = searchParams.get("selectedPosition");

  const getSelectedPosition = useMemo(async () => {
    const offerNo = window.location.pathname.split("/")[2];
    const currentOffer = await getOffer(offerNo);
    const position = currentOffer?.positions.find(
      (p) => p.id === selectedPosition
    );
    // Set quantity from position if available
    if (position && formikRef.current) {
      formikRef.current.setFieldValue("quantity", Number(position.quantity));
    }
    return position || null;
  }, [selectedPosition]);

  // Transform tabs into initialValues with default field values and dependencies
  const getInitialValues = useCallback(() => {
    const initialValues = {} as PanjurSelections &
      Record<string, string | number | boolean>;

    product?.tabs?.forEach((tab) => {
      if (tab.content?.fields) {
        tab.content.fields.forEach((field) => {
          const defaultValue = field.default ?? "";

          switch (field.type) {
            case "number":
              initialValues[field.id] =
                defaultValue !== undefined
                  ? parseFloat(defaultValue.toString())
                  : 1000;
              break;
            case "checkbox":
              initialValues[field.id] = defaultValue === "1";
              break;
            default:
              initialValues[field.id] = defaultValue || "";
          }

          // Handle dependencies
          if (field.dependsOn) {
            const dependencyField = initialValues[field.dependsOn.field];
            if (dependencyField !== field.dependsOn.value) {
              initialValues[field.id] = ""; // Reset if dependency is not met
            }
          }
        });
      }
    });
    initialValues.quantity = 1; // Default quantity
    initialValues.unitPrice = 0; // Default unit price
    return initialValues;
  }, [product]);

  const initialValues = useMemo(() => {
    const values = getInitialValues();
    values.productId = productId || ""; // Add productId to initial values
    return values;
  }, [getInitialValues, productId]);

  useEffect(() => {
    const loadProductAndTabs = async () => {
      if (initialLoadDone.current) return;

      setIsLoading(true);
      try {
        if (!productId) {
          router.replace("select-product");
          return;
        }

        // Get the product tabs with type and option filters
        const tabsResponse = await getProductTabs(productId, typeId, optionId);

        // Create a simple product object with the necessary info
        const product = {
          id: productId,
          name: productName || productId,
          tabs: tabsResponse.tabs,
        } as Product;

        // If selectedPosition exists, update defaults from existing position
        if (selectedPosition) {
          const position = await getSelectedPosition;

          if (position && Array.isArray(product.tabs)) {
            const productDetails = position.productDetails as PanjurSelections;

            // Update each tab's fields with values from position.productDetails
            product.tabs = product.tabs.map((tab) => {
              if (tab.content?.fields) {
                const updatedFields = tab.content.fields.map((field) => {
                  const fieldValue =
                    productDetails[field.id as keyof PanjurSelections];
                  if (fieldValue !== undefined) {
                    return {
                      ...field,
                      default: fieldValue.toString(),
                    };
                  }
                  return field;
                });

                return {
                  ...tab,
                  content: {
                    ...tab.content,
                    fields: updatedFields,
                  },
                };
              }
              return tab;
            });
          }
        }

        setProduct(product);
        initialLoadDone.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadProductAndTabs();
  }, [
    optionId,
    productId,
    productName,
    router,
    typeId,
    selectedPosition,
    getSelectedPosition,
  ]);

  const handleComplete = async (values: PanjurSelections) => {
    if (!product) return;

    const offerNo = window.location.pathname.split("/")[2];

    try {
      setIsSaving(true);

      // Get existing offer first
      const offers = await getOffers();
      const currentOffer = offers.find((o) => o.id === offerNo);

      if (!currentOffer) {
        throw new Error("Offer not found");
      }

      // Create new position with calculated values
      const newPosition: Position = {
        id: selectedPosition || `POS-${Date.now()}`,
        pozNo: selectedPosition
          ? currentOffer.positions.find((p) => p.id === selectedPosition)
              ?.pozNo || "001"
          : currentOffer.positions.length > 0
          ? String(
              parseInt(
                currentOffer.positions[currentOffer.positions.length - 1].pozNo
              ) + 1
            ).padStart(3, "0")
          : "001",
        unit: "adet",
        quantity: values.quantity || 1,
        unitPrice: values.unitPrice || 0,
        selectedProducts: values.selectedProducts || {
          products: [],
          accessories: [],
        },
        productId,
        typeId,
        productName,
        optionId,
        productDetails: values,
        total: (values.unitPrice || 0) * (values.quantity || 1), // Calculate total
      };
      console.log({ newPosition });

      // Update or add the position
      let updatedPositions: Position[];
      if (selectedPosition) {
        // Update existing position
        updatedPositions = currentOffer.positions.map((pos) =>
          pos.id === selectedPosition ? newPosition : pos
        );
      } else {
        // Add new position
        updatedPositions = [...currentOffer.positions, newPosition];
      }

      // Update offer positions via PATCH endpoint
      const updateResponse = await fetch(`/api/offers?id=${offerNo}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positions: updatedPositions,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update offer positions");
      }

      // Navigate back to offer details
      router.push(`/offers/${offerNo}`);
    } catch (error) {
      console.error("Error updating offer positions:", error);
      // TODO: Show error message to user
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Title and Buttons Skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
              </div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded"></div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="h-32 bg-muted animate-pulse rounded"></div>
              <div className="h-32 bg-muted animate-pulse rounded"></div>
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
          {/* Title and Buttons */}
          <Formik
            initialValues={initialValues}
            onSubmit={handleComplete}
            innerRef={formikRef}
          >
            {(formik) => (
              <Form
                ref={formRef}
                className="space-y-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Eğer bir textarea veya button değilse, submit'i engelle
                    const tag = (e.target as HTMLElement).tagName.toLowerCase();
                    if (tag !== "textarea" && tag !== "button") {
                      e.preventDefault();
                    }
                  }
                }}
              >
                {/* Product Details Form */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">
                      {product?.name} Detayları {typeId ? `(${typeId})` : ""}
                    </h1>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        router.push(
                          `/offers/${
                            window.location.pathname.split("/")[2]
                          }/add-position/select-product?selectedPosition=${
                            selectedPosition ?? ""
                          }&productId=${productId}&productName=${productName}${
                            typeId ? `&typeId=${typeId}` : ""
                          }${optionId ? `&optionId=${optionId}` : ""}`
                        )
                      }
                      className="gap-2"
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Ürün Seçimi
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={async () => {
                        const offerNo = window.location.pathname.split("/")[2];
                        await handleImalatListesiPDF({
                          offerNo,
                          product: product!,
                          values: formik.values,
                          selectedPosition,
                          typeId,
                          optionId,
                        });
                      }}
                      className="gap-2"
                    >
                      <ClipboardList className="h-4 w-4" />
                      İmalat Listesi
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        router.push(
                          `/offers/${window.location.pathname.split("/")[2]}`
                        )
                      }
                    >
                      Teklif Detayı
                    </Button>
                    <Button variant="default" disabled={isSaving} type="submit">
                      {isSaving
                        ? "Kaydediliyor..."
                        : selectedPosition
                        ? "Güncelle"
                        : "Tamamla"}
                    </Button>
                  </div>
                </div>

                <DetailsStep formik={formik} selectedProduct={product} />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
