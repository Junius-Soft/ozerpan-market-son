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
  // Kontrol: Genişlik VE yükseklik kontrolü YANINDA alan kontrolü de yapılmalı
  // Bir lamel geçerli olması için: (genişlik <= maxWidth VE yükseklik <= maxHeight) VEYA (alan <= maxArea)
  // ÖNEMLİ: Yükseklik 2400mm'yi geçtiğinde 39'luk lamel yerine daha kalın lamel seçilmeli
  const validOptionsArray: { id: string; label: string; name: string; priority: number }[] = [];
  const areaM2 = (width * height) / 1000000; // m² cinsinden alan

  // Lamel tipine göre filtreleme
  // Eğer lamelType seçilmemişse veya "aluminyum_poliuretanli" ise → sadece SL-39 ve SL-55 (standart)
  // Eğer lamelType "aluminyum_ekstruzyon" ise → SE-45 ve SE-55 kullanılabilir (özel seçim)
  const selectedLamelType = values.lamelType as string | undefined;
  const isEkstruzyon = selectedLamelType === "aluminyum_ekstruzyon";
  const isPoliuretanli = selectedLamelType === "aluminyum_poliuretanli" || !selectedLamelType;

  // Lamel öncelik sırası: En küçük uygun lamel seçilmeli
  // Standart (poliüretanlı): 39_sl > 55_sl
  // Özel (ekstrüzyon): 45_se > 55_se
  const lamelPriority: Record<string, number> = {
    "39_sl": 1, // Standart, en küçük, en yüksek öncelik
    "55_sl": 2, // Standart
    "45_se": 1, // Özel, en küçük
    "55_se": 2, // Özel
  };

  for (const [key, props] of Object.entries(lamelProperties)) {
    // Lamel tipine göre filtreleme
    // SE-45 ve SE-55 sadece alüminyum ekstrüzyon seçildiğinde kullanılabilir
    if (key.includes("_se")) {
      if (!isEkstruzyon) {
        continue; // SE lameller sadece ekstrüzyon seçildiğinde kullanılabilir
      }
    }
    
    // SL-39 ve SL-55 standart lameller (poliüretanlı)
    // Bunlar her zaman kullanılabilir (ekstrüzyon seçilse bile)
    
    // ÖNEMLİ: 39_sl için özel kurallar
    // - Yükseklik 2400mm'yi geçtiğinde geçersiz (maxHeight: 2400mm)
    // - Genişlik 2300mm'yi geçtiğinde geçersiz (maxWidth: 2300mm)
    if (key === "39_sl") {
      if (height > 2400 || width > 2300) {
        continue; // 39_sl'yi atla - yükseklik veya genişlik limitini aştığında kullanılamaz
      }
    }
    
    // Genişlik ve yükseklik kontrolü
    const sizeValid = width <= props.maxWidth && height <= props.maxHeight;
    // Alan kontrolü
    const areaValid = areaM2 <= props.maxArea;
    
    // Bir lamel geçerli olması için genişlik/yükseklik kontrolü VEYA alan kontrolü geçmeli
    const isValid = sizeValid || areaValid;
    
    if (isValid) {
      validOptionsArray.push({ 
        id: key, 
        label: key, 
        name: key,
        priority: lamelPriority[key] || 999 // Öncelik: düşük sayı = yüksek öncelik
      });
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

  // Önceliğe göre sırala (düşük sayı = yüksek öncelik = daha kalın lamel)
  validOptionsArray.sort((a, b) => a.priority - b.priority);
  
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

  // validOptions'tan priority field'ını kaldır (ProductTabField tipine uygun olması için)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validOptionsWithoutPriority = validOptionsArray.map(({ priority, ...rest }) => rest);

  return {
    validOptions: validOptionsWithoutPriority,
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

    // Lamel seçimini güncelle - ölçüler değiştiğinde en uygun lamel otomatik seçilsin
    const currentLamel = formik.values.lamelTickness as string;
    const isCurrentSelectionValid =
      result.validOptions &&
      result.validOptions.some((option) => option.id === currentLamel);

    // Ölçüler değiştiğinde en uygun lamel otomatik seçilsin
    // Eğer mevcut seçim en uygun değilse (öncelik sırasında ilk değilse) veya geçersizse değiştir
    if (result.selectedLamel && result.validOptions && result.validOptions.length > 0) {
      const bestLamel = result.validOptions[0]?.id;
      const isCurrentBest = currentLamel === bestLamel;
      
      // Mevcut seçim en uygun değilse veya geçersizse değiştir
      if ((!isCurrentBest || !isCurrentSelectionValid) && bestLamel) {
        const oldSelection = currentLamel;

        console.log(
          `Changing lamel from ${oldSelection} to ${bestLamel}`
        );
        formik.setFieldValue("lamelTickness", bestLamel);

        // Kullanıcıyı bilgilendir
        if (oldSelection && oldSelection !== bestLamel) {
          if (!isCurrentSelectionValid) {
            toast.info(
              `Seçilen lamel kalınlığı (${formatLamelName(
                oldSelection
              )}) bu ölçüler için uygun değil. ${formatLamelName(
                bestLamel
              )} olarak değiştirildi.`
            );
          } else {
            toast.info(
              `Ölçü değişikliği nedeniyle en uygun lamel (${formatLamelName(
                bestLamel
              )}) otomatik seçildi.`
            );
          }
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
