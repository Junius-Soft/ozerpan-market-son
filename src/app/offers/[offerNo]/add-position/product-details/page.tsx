"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  getProductSpecificType,
  useProductState,
} from "../hooks/useProductState";

import {
  type Product,
  getProductTabs,
  getProductById,
} from "@/documents/products";
import { DetailsStep, DetailsStepRef } from "../steps/details-step";
import { getOffer, type Position } from "@/documents/offers";
import { getOffers } from "@/documents/offers";
import { Formik, Form } from "formik";
import { handleImalatListesiPDF } from "@/utils/handle-imalat-listesi";
import { ProductDetailsHeader } from "./ProductDetailsHeader";
import { FloatingTotalButton } from "../../components/FloatingTotalButton";
import { handleDepoCikisFisiPDF } from "@/utils/handle-depo-cikis-fisi";
import { handleFiyatAnaliziPDF } from "@/utils/handle-fiyat-analizi";
import { RootState } from "@/store";
import { useDispatch, useSelector } from "react-redux";
import { setQuantity } from "@/store/appSlice";

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null!);
  const detailsStepRef = useRef<DetailsStepRef>(null);
  const eurRate = useSelector((state: RootState) => state.app.eurRate);
  const dispatch = useDispatch();
  const quantity = useSelector((state: RootState) => state.app.quantity);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [productObj, setProductObj] = useState<Product | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [selectedPosition, setSelectedPosition] = useState<Position>(
    {} as Position
  );

  const initialLoadDone = useRef(false);

  const productId = searchParams.get("productId");
  const productName = searchParams.get("productName");
  const typeId = searchParams.get("typeId");
  const optionId = searchParams.get("optionId");
  const selectedPositionId = searchParams.get("selectedPosition");
  const offerNo = window.location.pathname.split("/")[2];

  // Product-specific state hook kullanımı
  const { state: productState, actions: productActions } =
    useProductState(productId);

  // Load selected position in useEffect instead of useMemo
  useEffect(() => {
    if (!selectedPositionId || !offerNo) return;

    const loadSelectedPosition = async () => {
      try {
        const currentOffer = await getOffer(offerNo);
        const position =
          currentOffer?.positions.find((p) => p.id === selectedPositionId) ??
          ({} as Position);
        setSelectedPosition(position);
      } catch (error) {
        console.error("Error loading selected position:", error);
        setSelectedPosition({} as Position);
      }
    };

    loadSelectedPosition();
  }, [selectedPositionId, offerNo]);

  // Reset quantity to 1 for new positions (not when editing/copying)
  useEffect(() => {
    if (!selectedPositionId) {
      // Yeni poz çiziminde quantity'yi 1'e resetle
      dispatch(setQuantity(1));
    }
  }, [selectedPositionId, dispatch]);

  // Transform tabs into initialValues with default field values and dependencies
  const getInitialValues = useCallback(() => {
    const initialValues = getProductSpecificType(productId);

    productObj?.tabs?.forEach((tab) => {
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
    initialValues.quantity = quantity; // Default quantity
    initialValues.unitPrice = 0; // Default unit price
    return initialValues;
  }, [productObj?.tabs, productId, quantity]);

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

        // Get the full product object by ID
        const productFromAPI = await getProductById(productId);

        // Get the product tabs with type and option filters
        const tabsResponse = await getProductTabs(productId, typeId, optionId);

        // Create product object combining API product data with tabs
        const product = {
          id: productId,
          name: productName || productFromAPI?.name || productId,
          currency: productFromAPI?.currency,
          tabs: tabsResponse.tabs,
        } as Product;

        // If selectedPosition exists, update defaults from existing position
        if (selectedPositionId) {
          // Load position directly here to avoid race condition
          const currentOffer = await getOffer(offerNo);
          const position =
            currentOffer?.positions.find((p) => p.id === selectedPositionId) ??
            ({} as Position);
          
          // Update selectedPosition state
          setSelectedPosition(position);
          
          if (position?.id && Array.isArray(product.tabs)) {
            // Dinamik tip belirleme - productId'ye göre uygun tip kullan
            const productDetails = position.productDetails as ReturnType<
              typeof getInitialValues
            >;

            // Update each tab's fields with values from position.productDetails
            product.tabs = product.tabs.map((tab) => {
              if (tab.content?.fields) {
                const updatedFields = tab.content.fields.map((field) => {
                  const fieldValue =
                    productDetails[field.id as keyof typeof productDetails];
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

            // Pozdan state değerleri varsa product-specific hook ile setle (sadece panjur için)
            if (productId === "panjur") {
              if (
                productDetails.middleBarPositions &&
                Array.isArray(productDetails.middleBarPositions) &&
                productActions.setMiddleBarPositions
              ) {
                productActions.setMiddleBarPositions(
                  productDetails.middleBarPositions
                );
              }
              // Set section heights from position if available
              if (
                productDetails.sectionHeights &&
                Array.isArray(productDetails.sectionHeights) &&
                productActions.setSectionHeights
              ) {
                productActions.setSectionHeights(productDetails.sectionHeights);
              }
              // Set section motors from position if available
              if (
                productDetails.sectionMotors &&
                Array.isArray(productDetails.sectionMotors) &&
                productActions.setSectionMotors
              ) {
                productActions.setSectionMotors(productDetails.sectionMotors);
              }
              // Set section connections from position if available
              if (
                productDetails.sectionConnections &&
                Array.isArray(productDetails.sectionConnections) &&
                productActions.setSectionConnections
              ) {
                productActions.setSectionConnections(
                  productDetails.sectionConnections
                );
              }
              // Set section motor positions from position if available
              if (
                productDetails.sectionMotorPositions &&
                Array.isArray(productDetails.sectionMotorPositions) &&
                productActions.setSectionMotorPositions
              ) {
                productActions.setSectionMotorPositions(
                  productDetails.sectionMotorPositions
                );
              }
            }
          }
          // Set quantity from position if available (only when editing/copying)
          if (position && selectedPositionId) {
            dispatch(setQuantity(position.quantity || 1));
          }
        }

        setProductObj(product);
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
    selectedPositionId,
    selectedPosition,
    productObj,
    productActions,
    dispatch,
    offerNo,
  ]);

  // Yeni pozisyon için varsayılan sectionHeights değerlerini ayarla (sadece panjur için)
  useEffect(() => {
    if (
      !selectedPositionId &&
      productObj &&
      typeId &&
      initialLoadDone.current &&
      productId === "panjur"
    ) {
      // typeId'nin seperation sayısını temsil ettiğini varsayıyoruz
      const separationCount = Number(typeId) || 1;

      // Eğer sectionHeights boşsa veya yanlış uzunluktaysa varsayılan değerlerle doldur
      const currentSectionHeights = productState.sectionHeights || [];
      if (currentSectionHeights.length !== separationCount) {
        // Form values'dan height değerini al, yoksa 1000mm varsayılan değer kullan
        const formHeightValue = initialValues.height || 1000;
        const defaultHeights = Array.from({ length: separationCount }, () =>
          Number(formHeightValue)
        );

        console.log("Setting default sectionHeights for new position:", {
          separationCount,
          formHeightValue,
          defaultHeights,
        });

        if (productActions.setSectionHeights) {
          productActions.setSectionHeights(defaultHeights);
        }
      }
    }
  }, [
    selectedPositionId,
    productObj,
    typeId,
    productState.sectionHeights,
    initialValues.height,
    productId,
    productActions,
  ]);

  const handleComplete = async (
    values: ReturnType<typeof getInitialValues>
  ) => {
    if (!productObj) return;

    const offerNo = window.location.pathname.split("/")[2];

    try {
      setIsSaving(true);

      // Get existing offer first
      const offers = await getOffers();
      const currentOffer = offers.find((o) => o.id === offerNo);

      if (!currentOffer) {
        throw new Error("Offer not found");
      }

      // Canvas'ı export et
      const canvasDataUrl = detailsStepRef.current?.exportCanvas() || undefined;

      // Create new position with calculated values
      const newPosition: Position = {
        id: selectedPositionId || `POS-${Date.now()}`,
        pozNo: selectedPositionId
          ? currentOffer.positions.find((p) => p.id === selectedPositionId)
              ?.pozNo || "01"
          : currentOffer.positions.length > 0
          ? String(
              parseInt(
                currentOffer.positions[currentOffer.positions.length - 1].pozNo
              ) + 1
            ).padStart(2, "0")
          : "01",
        unit: "adet",
        quantity: quantity || 1,
        unitPrice: values.unitPrice || 0,
        selectedProducts: values.selectedProducts || {
          products: [],
          accessories: [],
        },
        productId,
        typeId,
        productName,
        optionId,
        currency: productObj.currency,
        canvasDataUrl, // Canvas verisini pozisyon objesine ekle
        productDetails: {
          ...values,
          // Product-specific state'i sadece panjur için ekle
          ...(productId === "panjur" &&
            productState.middleBarPositions && {
              middleBarPositions: productState.middleBarPositions,
            }),
          ...(productId === "panjur" &&
            productState.sectionHeights && {
              sectionHeights: productState.sectionHeights,
            }),
          ...(productId === "panjur" &&
            productState.sectionMotors && {
              sectionMotors: productState.sectionMotors,
            }),
          ...(productId === "panjur" &&
            productState.sectionConnections && {
              sectionConnections: productState.sectionConnections,
            }),
          ...(productId === "panjur" &&
            productState.sectionMotorPositions && {
              sectionMotorPositions: productState.sectionMotorPositions,
            }),
        } as Position["productDetails"],
        total: values.unitPrice * quantity || 0, // Calculate total
      };

      // Update or add the position
      let updatedPositions: Position[];
      if (selectedPositionId) {
        // Update existing position
        updatedPositions = currentOffer.positions.map((pos) =>
          pos.id === selectedPositionId ? newPosition : pos
        );
      } else {
        // Add new position
        updatedPositions = [...currentOffer.positions, newPosition];
      }
      console.log({ updatedPositions });
      // Update offer positions via PATCH endpoint
      const updateResponse = await fetch(`/api/offers/${offerNo}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positions: updatedPositions,
          name: currentOffer.name,
          status: currentOffer.status ?? "Taslak",
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
    <div className="pb-8 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Title and Buttons */}
          <Formik initialValues={initialValues} onSubmit={handleComplete}>
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
                <ProductDetailsHeader
                  product={productObj}
                  typeId={typeId}
                  router={router}
                  selectedPosition={selectedPosition}
                  productId={productId}
                  productName={productName}
                  optionId={optionId}
                  isLoading={isLoading}
                  isSaving={isSaving}
                  onImalatListesiConfirm={async (selectedTypes) => {
                    const offerNo = window.location.pathname.split("/")[2];
                    // Canvas'ı export et
                    const canvasDataUrl =
                      detailsStepRef.current?.exportCanvas() || undefined;
                    await handleImalatListesiPDF({
                      offerNo,
                      product: productObj!,
                      values: formik.values,
                      selectedPosition: selectedPositionId,
                      typeId,
                      optionId,
                      selectedTypes,
                      quantity,
                      canvasDataUrl,
                    });
                  }}
                  onDepoCikisFisiConfirm={async () => {
                    if (!productObj) return;
                    const offerNo = window.location.pathname.split("/")[2];
                    await handleDepoCikisFisiPDF({
                      product: productObj,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      values: formik.values as any,
                      typeId,
                      offerNo,
                      quantity,
                    });
                  }}
                  onBackToOffer={() =>
                    router.push(
                      `/offers/${window.location.pathname.split("/")[2]}`
                    )
                  }
                  onSubmit={formik.submitForm}
                  onFiyatAnaliz={async () => {
                    if (!productObj || !productObj.tabs) return;
                    const offerNo = window.location.pathname.split("/")[2];

                    await handleFiyatAnaliziPDF({
                      product: productObj,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formikValues: formik.values as any,
                      productId: productId ?? null,
                      typeId: typeId ?? null,
                      productName: productName ?? null,
                      optionId: optionId ?? null,
                      offerNo,
                      quantity,
                    });
                  }}
                />

                <DetailsStep
                  ref={detailsStepRef}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formik={formik as any}
                  selectedProduct={productObj}
                  onTotalChange={setPreviewTotal}
                  summaryRef={summaryRef}
                  typeId={Number(typeId)}
                  optionId={optionId}
                />
                {/* Floating toplam buton sadece mobilde */}
                <FloatingTotalButton
                  summaryRef={summaryRef}
                  total={previewTotal}
                  currency={productObj?.currency.code ?? "EUR"}
                  eurRate={eurRate}
                  displayCurrency={productObj?.currency.code ?? "EUR"}
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}
