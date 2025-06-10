import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { maxLamelHeights } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { toast } from "react-toastify";
import { getBoxHeight } from "@/utils/panjur";

export type FormValues = Record<string, string | number | boolean>;

export function filterBoxSize(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
): ProductTabField["options"] | null {
  const values = formik.values;
  const height = values.height;
  const kutuYuksekligi = getBoxHeight(values.boxType);
  const lamelTickness = values.lamelTickness;
  const movementType = values.movementType as "manuel" | "motorlu";

  // Calculate actual lamel height
  const lamelHeight =
    values.kutuOlcuAlmaSekli === "kutu_dahil"
      ? height - kutuYuksekligi / 2
      : height;

  // Extract lamel thickness number (39, 45, or 55)
  const thicknessNumber = lamelTickness?.split("_")[0];

  if (!thicknessNumber || !["39", "45", "55"].includes(thicknessNumber)) {
    return null;
  }
  // Find valid box sizes
  const validBoxSizes = Object.entries(maxLamelHeights)
    .filter(([, thicknessData]) => {
      const heightLimit =
        thicknessData[thicknessNumber as keyof typeof thicknessData]?.[
          movementType
        ];

      return heightLimit !== null && heightLimit >= lamelHeight;
    })
    .map(([boxSize]) => ({
      id: boxSize,
      label: `${boxSize}mm`,
      name: `${boxSize}mm`,
    }))
    .sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Sort by box size

  // If there are no valid box sizes and the boxType has a value
  if (validBoxSizes.length === 0 && values.boxType) {
    formik.setFieldValue("boxType", "137mm");
    formik.setFieldValue("width", 1000);
    formik.setFieldValue("height", 1000);
    toast.warn(
      "Seçilen ölçüler için uygun kutu ölçüsü bulunamadı. Genişlik ve yükseklik varsayılan olarak 1000x1000 ayarlandı."
    );
    return null;
  }

  if (validBoxSizes.length === 0) {
    formik.setFieldValue("width", 1000);
    formik.setFieldValue("height", 1000);
    return null;
  }
  // Select the smallest valid box size if it's different from current
  if (validBoxSizes[0].id !== values.boxType) {
    formik.setFieldValue("boxType", validBoxSizes[0].name);

    return validBoxSizes;
  }
}
// Main hook that manages all form rules
export function useFilterBoxSize(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
) {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const {
    width,
    height,
    lamelType,
    lamelTickness,
    kutuOlcuAlmaSekli,
    movementType,
    boxType,
  } = formik.values;

  useEffect(() => {
    if (productId === "panjur") {
      filterBoxSize(formik);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    lamelType,
    lamelTickness,
    kutuOlcuAlmaSekli,
    movementType,
    productId,
    boxType,
  ]);

  return {};
}
