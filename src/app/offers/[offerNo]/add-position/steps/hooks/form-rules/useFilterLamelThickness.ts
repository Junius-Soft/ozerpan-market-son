import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { lamelProperties } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { toast } from "react-toastify";
import { findLargestEffectiveSection } from "@/utils/shutter-calculations";

interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
  sectionConnections: string[]; // Her bölmenin bağlantı durumu ("left", "right", "none")
  sectionMotorPositions: string[]; // Her bölmenin motor pozisyonu ("left", "right")
}

export type FormValues = Record<string, string | number | boolean>;

function filterLamelThickness(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[]
): ProductTabField["options"] | null {
  const values = formik.values;
  const totalWidth = Number(values.width);
  const totalHeight = Number(values.height);

  // En geniş etkili bölmeyi bul
  const { width, height } = findLargestEffectiveSection(
    totalWidth,
    totalHeight,
    middleBarPositions,
    sectionHeights,
    sectionConnections
  );

  // En uygun lamel tipini bul
  const validOptions: { id: string; label: string; name: string }[] = [];

  for (const [key, props] of Object.entries(lamelProperties)) {
    const area = (width * height) / 1_000_000; // mm^2'den m^2'ye çevir

    const isValid =
      (width <= props.maxWidth && height <= props.maxHeight) ||
      area <= props.maxArea;
    if (isValid) {
      validOptions.push({ id: key, label: key, name: key });
    }
  }

  if (validOptions.length === 0) {
    toast.warn("Seçilen ölçülere uygun lamel bulunamadı.");
    return null;
  }
  const selectedLamel = validOptions[0]?.id;
  const selectedType = selectedLamel.includes("_se")
    ? "aluminyum_ekstruzyon"
    : selectedLamel.includes("_sl")
    ? "aluminyum_poliuretanli"
    : null;

  // lamelType'ı uygun şekilde güncelle
  if (formik.values.lamelType !== selectedType) {
    formik.setFieldValue("lamelType", selectedType);
  }
  // lamelTickness'ı güncelle
  if (formik.values.lamelTickness !== selectedLamel) {
    formik.setFieldValue("lamelTickness", selectedLamel);
  }

  return validOptions.length > 0 ? validOptions : null;
}

// Main hook that manages all form rules
export function useFilterLamelThickness(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { width, height } = formik.values;
  const [validLamelThickness, setValidLamelThickness] = useState<
    ProductTabField["options"] | null
  >(null);

  // Redux state'lerini al
  const middleBarPositions = useSelector(
    (state: { shutter: ShutterState }) => state.shutter.middleBarPositions
  );
  const sectionHeights = useSelector(
    (state: { shutter: ShutterState }) => state.shutter.sectionHeights
  );
  const sectionConnections = useSelector(
    (state: { shutter: ShutterState }) => state.shutter.sectionConnections
  );

  useEffect(() => {
    if (productId === "panjur") {
      setValidLamelThickness(
        filterLamelThickness(
          formik,
          middleBarPositions,
          sectionHeights,
          sectionConnections
        )
      );
    }
  }, [
    width,
    height,
    productId,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    formik,
  ]);

  return { validLamelThickness };
}
