import { useState, useEffect } from "react";

// Define types for selections based on the document
// Interface for calculation results
export interface CalculationResult {
  systemWidth: number;
  systemHeight: number;
  lamelCount: number;
  lamelCuttingSize: number;
  lamelPrice: number;
  postHeight: number;
  postCount: number;
  boxHeight: number;
  totalPriceTL: number;
  errors: string[];
}

export interface PanjurSelections {
  productId: string;
  panjurType: "distan" | "monoblok" | "yalitimli";
  sectionCount: number;
  width: number;
  height: number;
  quantity: number;
  kutuOlcuAlmaSekli: "kutu_dahil" | "kutu_haric";
  dikmeOlcuAlmaSekli: "dikme_dahil" | "dikme_haric" | "tek_dikme";
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
  manuelSekli?: "makarali" | "reduktorlu";
  makaraliTip?: "makassiz" | "makasli";
  motorMarka?: "mosel" | "somfy";
  motorSekli?:
    | "duz-motorlu"
    | "alicili-motorlu"
    | "alicili-motorlu-reduktorlu"
    | "alicili-geri-bildirimli"
    | "alicili-geri-bildirimli-engel-tanimali"
    | "solar-panelli";
  motorModel?: string;
  buton?: "yok" | "alicili-buton" | "siva-alti-kalici" | "siva-ustu-kasa";
  receiver?: string;
  remote?: string;
  smarthome?: "yok" | "mosel_dd_7002_b" | "somfy_tahoma";
  lamelType: "aluminyum_poliuretanli" | "aluminyum_ekstruzyon";
  lamelTickness: "39_sl" | "55_sl" | "55_se";
  aski_kilit_secimi: "yok" | "aski_kilit";
  boxType: "137mm" | "165mm" | "205mm" | "250mm";
  dikmeType:
    | "mini_dikme"
    | "mini_orta_dikme"
    | "midi_dikme"
    | "midi_orta_dikme"
    | "mini_pvc_dikme"
    | "mini_pvc_orta_dikme"
    | "midi_pvc_dikme"
    | "midi_pvc_orta_dikme";
  dikmeAdapter: "yok" | "mini_dikme_adaptoru" | "fulset_dikme_adaptoru";
  subPart: "mini_alt_parca" | "kilitli_alt_parca";
  lamel_color: string; // e.g., 'Antrasit Gri', 'Beyaz'
  box_color: string;
  subPart_color: string;
  dikme_color: string;
}

// Define types for calculation results
export interface CalculationResult {
  systemWidth: number; // Calculated system width in mm
  systemHeight: number; // Calculated system height in mm
  lamelCount: number; // Total number of lamels
  lamelCuttingSize: number; // Lamel cutting size in mm
  lamelPrice: number; // Total lamel price in Euro
  postHeight: number; // Post height in mm
  postCount: number; // Number of posts
  boxHeight: number; // Selected box height in mm
  totalPriceTL: number; // Total price in TL (placeholder conversion)
  errors: string[]; // Any validation errors
}

// Lamel özellikleri interface
interface LamelProperties {
  tavsiyeEdilenMaksimumEn: number; // mm
  tavsiyeEdilenMaksimumYukseklik: number; // mm
  maksimumKullanimAlani: number; // m²
}

// Lamel özellikleri sabitleri
const lamelProperties: Record<string, LamelProperties> = {
  "39_sl": {
    tavsiyeEdilenMaksimumEn: 2300,
    tavsiyeEdilenMaksimumYukseklik: 2400,
    maksimumKullanimAlani: 5.5, // m²
  },
  "45_se": {
    tavsiyeEdilenMaksimumEn: 4250,
    tavsiyeEdilenMaksimumYukseklik: 3500,
    maksimumKullanimAlani: 14,
  },
  "55_sl": {
    tavsiyeEdilenMaksimumEn: 3200,
    tavsiyeEdilenMaksimumYukseklik: 3100,
    maksimumKullanimAlani: 10,
  },
  "55_se": {
    tavsiyeEdilenMaksimumEn: 5500,
    tavsiyeEdilenMaksimumYukseklik: 4000,
    maksimumKullanimAlani: 22,
  },
};

// Lamel özelliklerini getiren yardımcı fonksiyon
const getLamelProperties = (lamelTickness: string): LamelProperties => {
  return lamelProperties[lamelTickness];
};

// Kutu yüksekliği ve kertme payı değerlerini dinamik olarak hesapla
const getBoxHeight = (boxType: string): number => {
  return parseInt(boxType.replace("mm", ""));
};

const getKertmePayi = (dikmeType: string): number => {
  // mini_ ile başlayan dikme tipleri için: 20mm
  // midi_ ile başlayan dikme tipleri için: 25mm
  return dikmeType.startsWith("mini_") ? 20 : 25;
};

// Maksimum lamel yüksekliği tablosu (mm)
interface MaxLamelHeight {
  manuel: number | null;
  motorlu: number | null;
}

interface LamelHeightTable {
  [boxSize: string]: {
    [lamelType: string]: MaxLamelHeight;
  };
}

const maxLamelHeights: LamelHeightTable = {
  "137": {
    "39": { manuel: 1500, motorlu: 1100 },
    "45": { manuel: 1000, motorlu: 1000 },
    "55": { manuel: null, motorlu: null },
  },
  "165": {
    "39": { manuel: 2400, motorlu: 2250 },
    "45": { manuel: 2000, motorlu: 1750 },
    "55": { manuel: null, motorlu: 1600 },
  },
  "205": {
    "39": { manuel: null, motorlu: 3500 },
    "45": { manuel: null, motorlu: 3500 },
    "55": { manuel: null, motorlu: 2750 },
  },
  "250": {
    "39": { manuel: null, motorlu: null },
    "45": { manuel: null, motorlu: 4000 },
    "55": { manuel: null, motorlu: 4500 },
  },
};

// Maksimum lamel yüksekliği hesaplama (mm)
const getMaxLamelHeight = (
  boxType: string,
  lamelTickness: string,
  lamelSize: "manuel" | "motorlu"
): number | null => {
  const boxSize = boxType.replace("mm", "");
  const lamelType = lamelTickness.split("_")[0];

  return maxLamelHeights[boxSize]?.[lamelType]?.[lamelSize] ?? null;
};

// Dikme genişliği hesaplama (mm)
const getDikmeGenisligi = (dikmeType: string): number => {
  // mini_ ile başlayan dikme tipleri için: 53mm
  // midi_ ile başlayan dikme tipleri için: 62mm
  return dikmeType.startsWith("mini_") ? 53 : 62;
};

// Lamel düşme değeri (dikme düşme değeri) hesaplama (mm)
const getLamelDusmeValue = (dikmeType: string): number => {
  // mini_ ile başlayan dikme tipleri için: 37mm
  // midi_ ile başlayan dikme tipleri için: 45mm
  return dikmeType.startsWith("mini_") ? 37 : 45;
};

// Custom hook
export const usePanjurCalculator = (selections: PanjurSelections) => {
  const [result, setResult] = useState<CalculationResult>({
    systemWidth: 0,
    systemHeight: 0,
    lamelCount: 0,
    lamelCuttingSize: 0,
    lamelPrice: 0,
    postHeight: 0,
    postCount: 2,
    boxHeight: 0,
    totalPriceTL: 0,
    errors: [],
  });

  useEffect(() => {
    const calculate = () => {
      const errors: string[] = [];
      let postHeight = 0;

      // Temel değerleri hesapla
      const kertmePayi = getKertmePayi(selections.dikmeType);
      const dikmeGenisligi = getDikmeGenisligi(selections.dikmeType);
      const kutuYuksekligi = getBoxHeight(selections.boxType);

      // Sistem genişliği hesaplama
      let systemWidth = selections.width;
      switch (selections.dikmeOlcuAlmaSekli) {
        case "dikme_haric":
          // Dikme hariç: Girilen ölçü + 2 adet dikme genişliği - yan kapak payı
          systemWidth = selections.width + 2 * dikmeGenisligi - 10;
          break;
        case "tek_dikme":
          // Tek dikme: Girilen ölçü + 1 adet dikme genişliği - yan kapak payı
          systemWidth = selections.width + dikmeGenisligi - 10;
          break;
        case "dikme_dahil":
          // Dikme dahil: Girilen ölçü - yan kapak payı
          systemWidth = selections.width - 10;
          break;
      }

      // Yan kapak payı düşürme (5mm sağ + 5mm sol = 10mm) switch içinde yapılıyor

      // Sistem yüksekliği hesaplama
      let systemHeight = selections.height;
      if (selections.kutuOlcuAlmaSekli === "kutu_haric") {
        // Kutu hariç: Girilen ölçü + kutu yüksekliği
        systemHeight = selections.height + kutuYuksekligi;
      }

      // Maksimum lamel yüksekliğini kontrol et
      const maxHeight = getMaxLamelHeight(
        selections.boxType,
        selections.lamelTickness,
        "motorlu"
      );
      if (maxHeight !== null && systemHeight > maxHeight) {
        errors.push(
          `Seçilen yükseklik (${systemHeight}mm), bu kutu tipi ve lamel kalınlığı için maksimum değeri (${maxHeight}mm) aşıyor.`
        );
      }

      // Dikme yüksekliği hesaplama
      if (!selections.dikmeType.includes("orta")) {
        postHeight = selections.height - kutuYuksekligi + kertmePayi;
      }

      // Lamel kesim genişliği hesaplama = Sistem Genişliği – Dikme Düşme Değeri
      const lamelDusmeValue = getLamelDusmeValue(selections.dikmeType);
      const lamelCuttingSize = systemWidth - lamelDusmeValue;

      // Lamel sayısı hesaplama
      // 1. Dikme Yüksekliği (Kertme Payı Hariç) = Sistem Yüksekliği – Kutu Yüksekliği
      const dikmeYuksekligiKertmeHaric = systemHeight - kutuYuksekligi;

      // 2. Lamel Sayısı = Dikme Yüksekliği / Lamel Panel Genişliği (yukarı yuvarla)

      const lamelPanelGenisligi = getLamelProperties(
        selections.lamelTickness
      )?.tavsiyeEdilenMaksimumEn;
      console.log({ lamelPanelGenisligi });
      const lamelSayisi = Math.ceil(
        dikmeYuksekligiKertmeHaric / lamelPanelGenisligi
      );

      // 3. Sistem Lamel Adedi = Lamel Sayısı + 1
      const lamelCount = lamelSayisi + 1;

      // Lamel özellikleri kontrolü
      const lamelProps = getLamelProperties(selections.lamelTickness);

      // Maksimum alan kontrolü
      const alanM2 = (systemWidth * systemHeight) / 1000000; // mm2 to m2
      if (alanM2 > lamelProps?.maksimumKullanimAlani) {
        errors.push(
          `Seçilen ölçüler maksimum kullanım alanını (${
            lamelProps.maksimumKullanimAlani
          }m²) aşıyor. Mevcut alan: ${alanM2.toFixed(2)}m²`
        );
      }

      // Maksimum genişlik kontrolü
      if (systemWidth > lamelProps?.tavsiyeEdilenMaksimumEn) {
        errors.push(
          `Seçilen genişlik (${systemWidth}mm) tavsiye edilen maksimum genişliği (${lamelProps?.tavsiyeEdilenMaksimumEn}mm) aşıyor.`
        );
      }

      const lamelPrice = 0; // To be implemented
      const totalPriceTL = 0; // To be implemented

      // Sonuçları güncelle
      setResult({
        systemWidth,
        systemHeight,
        lamelCount,
        lamelCuttingSize,
        lamelPrice,
        postHeight,
        postCount:
          Number(selections.sectionCount) === 1
            ? 2
            : 2 + Number(selections.sectionCount) - 1,
        boxHeight: kutuYuksekligi,
        totalPriceTL,
        errors,
      });
    };

    calculate();
  }, [selections]);

  return result;
};
