import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { lamelProperties } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { toast } from "react-toastify";
import { findEffectiveSections } from "@/utils/shutter-calculations";

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
  shouldSelectFirst: boolean; // Yeni eklenen field
} {
  const totalWidth = Number(values.width);
  const totalHeight = Number(values.height);

  // En geniş etkili bölmeyi bul
  const { width, height } = findEffectiveSections(
    totalWidth,
    totalHeight,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    true // En büyük bölmeyi döndür
  ) as { width: number; height: number };

  // En uygun lamel tipini bul
  const validOptionsArray: { id: string; label: string; name: string }[] = [];

  for (const [key, props] of Object.entries(lamelProperties)) {
    const isValid = width <= props.maxWidth && height <= props.maxHeight;
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
      shouldSelectFirst: false,
    };
  }

  const selectedLamel = validOptionsArray[0]?.id;

  // Her zaman ilk seçeneği (en uygun) seç
  const finalSelectedLamel = selectedLamel;

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
    shouldSelectFirst: true, // Her zaman ilk seçeneği seç
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

  // Dependency tracking için
  const sectionHeightsStr = JSON.stringify(sectionHeights);
  const sectionConnectionsStr = JSON.stringify(sectionConnections);

  // Lamel seçeneklerini hesapla ve form field'larını güncelle
  useEffect(() => {
    if (productId !== "panjur") return;

    // EmptyBox durumunda lamel thickness hesaplama yapma
    if (formik.values.boxsetType === "emptyBox") {
      return;
    }

    const result = filterLamelThickness(
      formik.values,
      middleBarPositions,
      sectionHeights,
      sectionConnections
    );
    // console.log("Valid options:", result.validOptions);
    // console.log("Should select first:", result.shouldSelectFirst);
    // console.log("Current selection:", formik.values.lamelTickness);

    setValidLamelThickness(result.validOptions);

    // Form field'larını güncelle
    if (
      result.selectedType &&
      formik.values.lamelType !== result.selectedType
    ) {
      formik.setFieldValue("lamelType", result.selectedType);
    }

    // Lamel seçimini güncelle - her zaman en uygun seçeneği seç
    if (
      result.selectedLamel &&
      formik.values.lamelTickness !== result.selectedLamel
    ) {
      const oldSelection = formik.values.lamelTickness as string;

      console.log(
        `Changing lamel from ${oldSelection} to ${result.selectedLamel}`
      );
      formik.setFieldValue("lamelTickness", result.selectedLamel);

      // Kullanıcıyı bilgilendir
      if (oldSelection) {
        const isCurrentSelectionInvalid =
          result.validOptions &&
          !result.validOptions.some((option) => option.id === oldSelection);

        if (isCurrentSelectionInvalid) {
          toast.info(
            `Seçilen lamel kalınlığı (${formatLamelName(
              oldSelection
            )}) bu ölçüler için uygun değil. ${formatLamelName(
              result.selectedLamel
            )} olarak değiştirildi.`
          );
        } else {
          toast.info(
            `Ölçü değişikliği nedeniyle en uygun lamel (${formatLamelName(
              result.selectedLamel
            )}) otomatik seçildi.`
          );
        }
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
    // Redux state değişikliklerini de takip et (bölme sayısı değiştiğinde)
    middleBarPositions.length,
    sectionHeightsStr,
    sectionConnectionsStr,
  ]);

  return { validLamelThickness };
}
