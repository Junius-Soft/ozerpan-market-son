import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { lamelProperties } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { toast } from "react-toastify";

export type FormValues = Record<string, string | number | boolean>;

function filterLamelThickness(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
): ProductTabField["options"] | null {
  const values = formik.values;
  const width = Number(values.width);
  const height = values.height;
  const lamelType = values.lamelType;

  if (!lamelType) {
    return null;
  }

  // Filter valid options based on dimensions
  const validOptions = Object.entries(lamelProperties)
    .filter(([key, props]) => {
      const isTypeValid =
        lamelType === "aluminyum_ekstruzyon"
          ? key.includes("_se")
          : key.includes("_sl");

      return (
        isTypeValid && width <= props.maxWidth && height <= props.maxHeight
      );
    })
    .map(([key]) => ({ id: key, label: key, name: key }));

  const thicknessOptions = validOptions.length > 0 ? validOptions : null;

  // Always select the first valid option
  if (thicknessOptions?.length) {
    formik.setFieldValue("lamelTickness", thicknessOptions[0].id || "");
  } else {
    const alternativeLamelType =
      lamelType === "aluminyum_ekstruzyon"
        ? "aluminyum_poliuretanli"
        : "aluminyum_ekstruzyon";
    formik.setFieldValue("lamelType", alternativeLamelType);

    // Show toast warning message
    toast.warn(
      "Uygun lamel kalınlığı bulunamadı, alternatif bir lamel tipi seçildi."
    );
    return null;
  }

  return thicknessOptions;
}

// Main hook that manages all form rules
export function useFilterLamelThickness(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { width, height, lamelType } = formik.values;

  useEffect(() => {
    if (productId === "panjur") {
      filterLamelThickness(formik);
    }
  }, [width, height, lamelType, productId]);

  return {};
}
