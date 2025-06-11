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
  const height = Number(values.height);

  // En uygun lamel tipini bul

  const validOptions: { id: string; label: string; name: string }[] = [];

  for (const [key, props] of Object.entries(lamelProperties)) {
    const isValid = width <= props.maxWidth && height <= props.maxHeight;

    if (isValid) {
      validOptions.push({ id: key, label: key, name: key });
    }
  }
  console.log("validLamelThickness", validOptions);

  // Eğer mevcut lamelTickness validOptions içinde varsa, otomatik güncelleme yapma
  const currentLamelTickness = formik.values.lamelTickness;
  const isCurrentValid = validOptions.some(
    (option) => option.id === currentLamelTickness
  );
  const selectedLamel = validOptions[0].id;
  const selectedType = selectedLamel.includes("_se")
    ? "aluminyum_ekstruzyon"
    : selectedLamel.includes("_sl")
    ? "aluminyum_poliuretanli"
    : null;
  if (!isCurrentValid) {
    // Sadece movementType'ı güncelle
    if (selectedLamel === "39_sl" && formik.values.movementType !== "manuel") {
      formik.setFieldValue("movementType", "manuel");
      toast.warn("Hareket şekli manuel olarak güncellendi.");
    } else if (
      selectedLamel !== "39_sl" &&
      formik.values.movementType !== "motorlu"
    ) {
      formik.setFieldValue("movementType", "motorlu");
      toast.warn("Hareket şekli motorlu olarak güncellendi.");
    }

    // lamelType'ı uygun şekilde güncelle
    if (formik.values.lamelType !== selectedType) {
      formik.setFieldValue("lamelType", selectedType);
      toast.warn("Lamel tipi uygun şekilde güncellendi.");
    }
    // lamelTickness'ı güncelle
    if (formik.values.lamelTickness !== selectedLamel) {
      formik.setFieldValue("lamelTickness", selectedLamel);
      toast.warn("Lamel kalınlığı uygun şekilde güncellendi.");
    }
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
  const { width, height, lamelType } = formik.values;

  useEffect(() => {
    if (productId === "panjur") {
      filterLamelThickness(formik);
    }
  }, [width, height, lamelType, productId]);

  return {};
}
