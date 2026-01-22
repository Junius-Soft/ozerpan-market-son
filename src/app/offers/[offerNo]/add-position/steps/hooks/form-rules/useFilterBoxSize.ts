import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { maxLamelHeights } from "@/constants/panjur";
import { ProductTabField } from "@/documents/products";
import { getBoxHeight } from "@/utils/panjur";
import { calculateSarimCapi, getBoxSizeBySarimCapi } from "@/utils/sarim-cap-tablosu";

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

  // Önce sarım çapına göre hangi kutu olması gerektiğini belirle (sadece distan için)
  // NOT: Sarım çapı tablosu 1.0 m (1000 mm) ve üzeri için geçerlidir
  // 1.0 m'den küçük yükseklikler için sadece maksimum lamel yüksekliği kontrolü kullanılır
  // ÖNEMLİ: Sarım çapı sadece yüksekliğe göre hesaplanır, genişlik değişince bir değişme olmaz
  let sarimCapiBasedBox: string | null = null;
  if (optionId === "distan" && selectedLamelTickness) {
    // Sarım çapı hesaplaması için lamel yüksekliğini hesapla
    // ÖNEMLİ: Sarım çapı hesaplaması için TOPLAM YÜKSEKLİK kullanılmalı (kutu dahil/haric fark etmez)
    // Çünkü sarım çapı tablosu toplam yüksekliğe göre hazırlanmıştır
    // İlk sarım çapı hesaplaması için toplam yüksekliği kullan
    // ÖNEMLİ: selectedLamelTickness'in geçerli olduğundan emin ol (lamel değişikliğinde güncellenmiş olmalı)
    const sarimCapi = calculateSarimCapi(
      height, // Toplam yükseklik kullan (kutu dahil/haric fark etmez)
      selectedLamelTickness,
      selectedMovementType
    );
    
    // Sarım çapı hesaplaması başarılıysa kutu ölçüsünü belirle
    if (sarimCapi !== null) {
      sarimCapiBasedBox = getBoxSizeBySarimCapi(sarimCapi, optionId);
    }
    
    // Sarım çapı hesaplaması tamamlandı
    // Maksimum lamel yüksekliği kontrolü aşağıdaki döngüde yapılacak
  }

  // Kutu boyutlarını sayısal değerlere çeviren yardımcı fonksiyon
  const getBoxSizeNumber = (boxId: string): number => {
    // "137mm" -> 137, "185x220mm" -> 185, "250mm_yerli" -> 250
    const match = boxId.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Önce sarım çapına göre minimum kutu boyutunu belirle (sadece distan için)
  let minRequiredBoxSize = 0;
  if (optionId === "distan" && sarimCapiBasedBox) {
    minRequiredBoxSize = getBoxSizeNumber(sarimCapiBasedBox);
  }

  // Tüm geçerli kutuları bul (maksimum lamel yüksekliği kontrolüne göre)
  const allValidBoxes: { id: string; name: string; size: number }[] = [];

  for (const box of boxOptions) {
    const boxSize = box.id.replace("mm", "").replace("x", "").split("_")[0]; // "185x220mm" -> "185", "250mm_yerli" -> "250"
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
      // Kutu boyutunu sayısal değere çevir (karşılaştırma için)
      const boxSizeNum = getBoxSizeNumber(box.id);
      allValidBoxes.push({ id: box.id, name: box.name, size: boxSizeNum });
    }
  }

  // En küçük geçerli kutuyu bul (maksimum lamel yüksekliği kontrolünden geçen)
  let minValidBoxSize = Infinity;
  if (allValidBoxes.length > 0) {
    minValidBoxSize = Math.min(...allValidBoxes.map(box => box.size));
  }

  // Sarım çapına göre belirlenen minimum kutu boyutu varsa, onu da dikkate al
  if (minRequiredBoxSize > 0 && minRequiredBoxSize > minValidBoxSize) {
    minValidBoxSize = minRequiredBoxSize;
  }

  // Şimdi sadece en küçük geçerli kutudan daha büyük veya eşit kutuları seçilebilir yap
  // Kullanıcı daha küçük kutu seçemez, ama daha büyük kutu seçebilir
  const validOptions: { id: string; name: string }[] = [];
  
  for (const box of boxOptions) {
    const boxSizeNum = getBoxSizeNumber(box.id);
    
    // Sadece en küçük geçerli kutudan daha büyük veya eşit kutuları ekle
    if (boxSizeNum >= minValidBoxSize) {
      // Ayrıca bu kutunun maksimum lamel yüksekliği kontrolünü de geçmesi gerekiyor
      const boxSize = box.id.replace("mm", "").replace("x", "").split("_")[0];
      const boxHeight = getBoxHeight(box.id);
      let lamelYuksekligi = 0;
      if (kutuOlcuAlmaSekli === "kutu_dahil") {
        lamelYuksekligi = height - boxHeight / 2;
      } else {
        lamelYuksekligi = height;
      }
      
      const maxValue =
        maxLamelHeights[optionId]?.[boxSize]?.[selectedLamelTickness]?.[
          selectedMovementType
        ];
      
      if (maxValue && lamelYuksekligi <= maxValue) {
        validOptions.push({ id: box.id, name: box.name });
      }
    }
  }
  const isCurrentValid = validOptions.some(
    (opt) => opt.id === formik.values.boxType
  );

  if (validOptions.length > 0) {
    // Sadece mevcut değer geçersizse en küçük geçerli seçeneği seç
    if (!isCurrentValid) {
      // En küçük kutuyu seçmek için validOptions'u kutu boyutuna göre sırala
      const sortedOptions = [...validOptions].sort(
        (a, b) => getBoxSizeNumber(a.id) - getBoxSizeNumber(b.id)
      );
      const smallestValidBoxId = sortedOptions[0].id;
      
      // ÖNEMLİ: Lamel değişikliğinde kutu seçimini güncellerken, 
      // sarım çapına göre belirlenen minimum kutu boyutunu kullan
      // Eğer sarım çapına göre belirlenen kutu varsa ve geçerliyse, onu seç
      let boxToSelect = smallestValidBoxId;
      if (optionId === "distan" && sarimCapiBasedBox) {
        const sarimCapiBoxValid = validOptions.some(
          (opt) => opt.id === sarimCapiBasedBox
        );
        if (sarimCapiBoxValid) {
          boxToSelect = sarimCapiBasedBox;
        }
      }
      
      formik.setFieldValue("boxType", boxToSelect);
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
    // ÖNEMLİ: width dependency'si kaldırıldı çünkü kutu seçimi genişlikten etkilenmiyor
    // Sarım çapı sadece yüksekliğe göre hesaplanıyor ve maxLamelHeights kontrolü de genişlik kullanmıyor
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
