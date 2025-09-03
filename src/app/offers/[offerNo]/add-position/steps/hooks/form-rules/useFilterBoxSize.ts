import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { maxLamelHeights } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { getBoxHeight } from "@/utils/panjur";

export type FormValues = Record<string, string | number | boolean>;

export function filterBoxSize(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  optionId: string
): ProductTabField["options"] | null {
  const values = formik.values;
  const height = Number(values.height);
  const selectedLamelTickness = values.lamelTickness as string;
  const kutuOlcuAlmaSekli = values.kutuOlcuAlmaSekli as string;
  const selectedMovementType = values.movementType as "manuel" | "motorlu";

  // optionId'ye göre kutu seçeneklerini belirle
  let boxOptions: { id: string; name: string }[];

  if (optionId === "monoblok") {
    boxOptions = [
      { id: "185mm", name: "185MM" },
      { id: "185x220mm", name: "185MM Yalıtımlı" },
      { id: "220mm", name: "220MM" },
      { id: "220x255mm", name: "220MM Yalıtımlı" },
    ];
  } else if (optionId === "yalitimli") {
    boxOptions = [
      { id: "250mm_yerli", name: "250MM Yerli" },
      { id: "250mm_ithal", name: "250MM İthal" },
      { id: "300mm_yerli", name: "300MM Yerli" },
      { id: "300mm_ithal", name: "300MM İthal" },
    ];
  } else {
    // distan için varsayılan seçenekler
    boxOptions = [
      { id: "137mm", name: "137MM" },
      { id: "165mm", name: "165MM" },
      { id: "205mm", name: "205MM" },
      { id: "250mm", name: "250MM" },
    ];
  }

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
    // Sadece seçili movementType'a göre kontrol et
    const maxValue =
      maxLamelHeights[optionId]?.[boxSize]?.[selectedLamelTickness]?.[
        selectedMovementType
      ];
    let isValid = false;
    if (maxValue && lamelYuksekligi <= maxValue) {
      isValid = true;
    }
    if (isValid) {
      validOptions.push({ id: box.id, name: box.name });
    }
  }
  const isCurrentValid = validOptions.some(
    (opt) => opt.id === formik.values.boxType
  );

  if (validOptions.length > 0) {
    // En küçük kutuyu seçmek için validOptions'u kutu boyutuna göre sırala
    const sortedOptions = [...validOptions].sort(
      (a, b) => parseInt(a.id) - parseInt(b.id)
    );

    const smallestValidBoxId = sortedOptions[0].id;
    if (!isCurrentValid || formik.values.boxType !== smallestValidBoxId) {
      formik.setFieldValue("boxType", smallestValidBoxId);
    }
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
  const optionId = searchParams.get("optionId") || "distan";
  const {
    width,
    height,
    lamelType,
    kutuOlcuAlmaSekli,
    lamelTickness,
    movementType,
  } = formik.values;

  const [validBoxOptions, setValidBoxOptions] =
    useState<ReturnType<typeof filterBoxSize>>(null);

  useEffect(() => {
    if (productId === "panjur") {
      const result = filterBoxSize(formik, optionId);
      setValidBoxOptions(result);
    } else {
      setValidBoxOptions(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    lamelType,
    kutuOlcuAlmaSekli,
    lamelTickness,
    productId,
    movementType,
    optionId,
  ]);

  return { validBoxOptions };
}
