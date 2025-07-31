import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { lamelProperties } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { toast } from "react-toastify";
import { ShutterState } from "@/store";

export type FormValues = Record<string, string | number | boolean>;

function filterLamelThickness(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  middleBarPositions: number[]
): ProductTabField["options"] | null {
  const values = formik.values;
  let width = Number(values.width);
  const height = Number(values.height);

  // Eğer çoklu panjur varsa, en geniş bölmeyi bul
  if (Array.isArray(middleBarPositions) && middleBarPositions.length > 0) {
    // Bölme ayrım noktalarını ve toplam genişliği kullanarak her bölmenin genişliğini bul
    const positions = [0, ...middleBarPositions, width];
    const sectionWidths = positions
      .slice(0, -1)
      .map((pos, i) => positions[i + 1] - pos);
    width = Math.max(...sectionWidths);
  }
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
    // toast.warn("Lamel tipi uygun şekilde güncellendi.");
  }
  // lamelTickness'ı güncelle
  if (formik.values.lamelTickness !== selectedLamel) {
    formik.setFieldValue("lamelTickness", selectedLamel);
    // toast.warn("Lamel kalınlığı uygun şekilde güncellendi.");
  }
  console.log("validLamelThickness", validOptions);

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
  const middleBarPositions = useSelector(
    (state: { shutter: ShutterState }) => state.shutter.middleBarPositions
  );

  useEffect(() => {
    if (productId === "panjur") {
      setValidLamelThickness(filterLamelThickness(formik, middleBarPositions));
    }
  }, [width, height, productId, middleBarPositions]);

  return { validLamelThickness };
}
