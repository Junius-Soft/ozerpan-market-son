import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { maxLamelHeights } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { getBoxHeight } from "@/utils/panjur";
import { toast } from "react-toastify";

export type FormValues = Record<string, string | number | boolean>;

export function filterBoxSize(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >
): ProductTabField["options"] | null {
  const values = formik.values;
  const height = Number(values.height);
  const selectedLamelTickness = values.lamelTickness as string;
  const kutuOlcuAlmaSekli = values.kutuOlcuAlmaSekli as string;
  const currentMovementType = values.movementType as "manuel" | "motorlu";

  // Kutu ölçüleri ve label'ları
  const boxOptions = [
    { id: "137mm", name: "137MM" },
    { id: "165mm", name: "165MM" },
    { id: "205mm", name: "205MM" },
    { id: "250mm", name: "250MM" },
  ];

  const validOptions: { id: string; name: string }[] = [];

  for (const box of boxOptions) {
    const boxSize = box.id.replace("mm", "");
    const boxHeight = getBoxHeight(box.id);
    let lamelYuksekligi = 0;
    if (kutuOlcuAlmaSekli === "kutu_dahil") {
      lamelYuksekligi = height - boxHeight / 2;
    } else {
      lamelYuksekligi = height;
    }
    // Hem manuel hem motorlu için kontrol et
    const maxManuel = maxLamelHeights[boxSize]?.[selectedLamelTickness]?.manuel;
    const maxMotorlu =
      maxLamelHeights[boxSize]?.[selectedLamelTickness]?.motorlu;
    let isValid = false;
    let movementType: "manuel" | "motorlu" | null = null;
    if (maxManuel && lamelYuksekligi <= maxManuel) {
      isValid = true;
      movementType = "manuel";
    } else if (maxMotorlu && lamelYuksekligi <= maxMotorlu) {
      isValid = true;
      movementType = "motorlu";
    }
    console.log({
      selectedLamelTickness,
      isValid,
      boxSize,
      lamelYuksekligi,
      maxManuel,
      maxMotorlu,
    });
    if (isValid && movementType) {
      validOptions.push({ id: box.id, name: box.name });
      // Eğer mevcut kutu seçiliyse movementType'ı da güncelle
      if (
        formik.values.boxType === box.id &&
        currentMovementType !== movementType
      ) {
        formik.setFieldValue("movementType", movementType);
        toast.warn(`Hareket tipi ${movementType} olarak güncellendi.`);
      }
    }
  }
  console.log("validBoxOptions", validOptions);
  // Eğer mevcut boxType valid değilse ilk uygun kutuya set et
  if (
    validOptions.length > 0 &&
    !validOptions.some((opt) => opt.id === formik.values.boxType)
  ) {
    formik.setFieldValue("boxType", validOptions[0].id);
    toast.warn("Kutu ölçüsü uygun şekilde güncellendi.");
  }
  return validOptions.length > 0 ? validOptions : null;
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
    kutuOlcuAlmaSekli,
    lamelTickness,
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
    kutuOlcuAlmaSekli,
    lamelTickness,
    productId,
    boxType,
  ]);

  return {};
}
