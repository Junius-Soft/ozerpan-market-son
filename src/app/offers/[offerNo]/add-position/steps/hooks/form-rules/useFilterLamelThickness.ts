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

// Lamel kodunu okunabilir formata çevir (örn: "55_sl" -> "SL 55")
function formatLamelName(lamelCode: string): string {
  if (!lamelCode) return lamelCode;

  const parts = lamelCode.split("_");
  if (parts.length !== 2) return lamelCode;

  const [thickness, type] = parts;
  const typeFormatted = type.toUpperCase();

  return `${typeFormatted} ${thickness}`;
}

function filterLamelThickness(
  values: PanjurSelections & Record<string, string | number | boolean>,
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[]
): {
  validOptions: ProductTabField["options"] | null;
  selectedLamel: string | null;
  selectedType: string | null;
  shouldBeMotorlu: boolean;
} {
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
  const validOptionsArray: { id: string; label: string; name: string }[] = [];

  for (const [key, props] of Object.entries(lamelProperties)) {
    const area = (width * height) / 1_000_000; // mm^2'den m^2'ye çevir

    const isValid =
      (width <= props.maxWidth && height <= props.maxHeight) ||
      area <= props.maxArea;
    if (isValid) {
      validOptionsArray.push({ id: key, label: key, name: key });
    }
  }

  if (validOptionsArray.length === 0) {
    toast.warn("Seçilen ölçülere uygun lamel bulunamadı.");
    return {
      validOptions: null,
      selectedLamel: null,
      selectedType: null,
      shouldBeMotorlu: false,
    };
  }

  const selectedLamel = validOptionsArray[0]?.id;

  // Kullanıcının mevcut seçimini kontrol et
  const currentLamelSelection = values.lamelTickness as string;
  const isCurrentSelectionValid = validOptionsArray.some(
    (option) => option.id === currentLamelSelection
  );

  // Eğer mevcut seçim valid ise onu kullan, değilse ilk valid seçeneği kullan
  const finalSelectedLamel = isCurrentSelectionValid
    ? currentLamelSelection
    : selectedLamel;

  const selectedType = finalSelectedLamel?.includes("_se")
    ? "aluminyum_ekstruzyon"
    : finalSelectedLamel?.includes("_sl")
    ? "aluminyum_poliuretanli"
    : null;

  // 55lik lamel seçildiğinde motorlu olmalı mı?
  const shouldBeMotorlu = finalSelectedLamel?.includes("55_") || false;

  return {
    validOptions: validOptionsArray,
    selectedLamel: finalSelectedLamel,
    selectedType,
    shouldBeMotorlu,
  };
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

  // Lamel seçeneklerini hesapla ve form field'larını güncelle
  useEffect(() => {
    if (productId !== "panjur") return;

    const result = filterLamelThickness(
      formik.values,
      middleBarPositions,
      sectionHeights,
      sectionConnections
    );
    console.log(result.validOptions);
    setValidLamelThickness(result.validOptions);

    // Form field'larını güncelle - sadece farklı değerler için
    if (
      result.selectedType &&
      formik.values.lamelType !== result.selectedType
    ) {
      formik.setFieldValue("lamelType", result.selectedType);
    }

    // Mevcut seçimin valid olup olmadığını kontrol et ve gerekirse güncelle
    if (
      result.selectedLamel &&
      formik.values.lamelTickness !== result.selectedLamel
    ) {
      formik.setFieldValue("lamelTickness", result.selectedLamel);

      // Eğer seçim değişmişse kullanıcıyı bilgilendir
      const isCurrentSelectionInvalid =
        result.validOptions &&
        !result.validOptions.some(
          (option) => option.id === formik.values.lamelTickness
        );

      if (isCurrentSelectionInvalid) {
        toast.info(
          `Seçilen lamel kalınlığı (${formatLamelName(
            formik.values.lamelTickness as string
          )}) bu ölçüler için uygun değil. ${formatLamelName(
            result.selectedLamel
          )} olarak değiştirildi.`
        );
      }
    }

    // 55lik lamel seçildiğinde movementType motorlu olmalı
    if (result.shouldBeMotorlu && formik.values.movementType !== "motorlu") {
      formik.setFieldValue("movementType", "motorlu");
      toast.info("55mm lamel için hareket tipi motorlu olarak ayarlandı.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    productId,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    formik.values.lamelTickness, // Kullanıcının mevcut seçimini de takip et
  ]);

  return { validLamelThickness };
}
