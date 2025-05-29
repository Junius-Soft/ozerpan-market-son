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

// Lamel kalınlıklarına göre fiyat tablosu (Euro/metre)
const lamelUnitPrices: Record<string, number> = {
  "39_sl": 1.02,
  "55_sl": 1.2,
  "55_se": 1.4,
};

// Yüksekliğe göre sarım tablosu
const sarimTablosu: Record<string, Record<string, number>> = {
  "39_sl": { "1000": 110 },
  "55_sl": { "1000": 120 },
  "55_se": { "1000": 125 },
};

// Renk bazlı fiyat çarpanları
const colorPriceMultipliers: Record<string, number> = {
  antrasit_gri: 1.0,
  beyaz: 0.95,
  kahve: 1.05,
};

// Euro/TL kuru
const EURO_TO_TL = 40;

// Custom hook
export const usePanjurCalculator = (selections: PanjurSelections) => {
  console.log({ selections });
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

      // Ölçü validasyonları
      if (selections.width < 250 || selections.width > 5500) {
        errors.push("Width must be between 250mm and 5500mm");
      }
      if (selections.height < 250 || selections.height > 4000) {
        errors.push("Height must be between 250mm and 4000mm");
      }
      if (selections.quantity < 1) {
        errors.push("Quantity must be at least 1");
      }

      // Sistem genişliği hesaplama
      let systemWidth = selections.width;
      if (selections.dikmeOlcuAlmaSekli === "dikme_haric") {
        const postWidth = selections.lamelTickness === "39_sl" ? 53 : 62;
        systemWidth = selections.width + 2 * postWidth;
      } else if (selections.dikmeOlcuAlmaSekli === "tek_dikme") {
        const postWidth = selections.lamelTickness === "39_sl" ? 53 : 62;
        systemWidth = selections.width + postWidth;
      }
      systemWidth -= 10; // Yan kapak payı düşme

      // Sistem yüksekliği hesaplama
      let systemHeight = selections.height;
      const boxHeight = parseInt(selections.boxType);
      if (selections.kutuOlcuAlmaSekli === "kutu_haric") {
        systemHeight = selections.height + boxHeight;
      }

      // Dikme yüksekliği hesaplama
      const kertmePayi = selections.lamelTickness === "39_sl" ? 20 : 25;
      const postHeight = systemHeight - boxHeight + kertmePayi;

      // Lamel sayısı hesaplama
      const lamelWidth = parseInt(selections.lamelTickness.split("_")[0]);
      const lamelHeight = (systemHeight - boxHeight) / lamelWidth;
      const lamelCount = Math.ceil(lamelHeight) + 1;

      // Lamel kesim ölçüsü hesaplama
      const lamelDusmeDegeri = selections.lamelTickness === "39_sl" ? 37 : 45;
      const lamelCuttingSize = systemWidth - lamelDusmeDegeri;

      // Lamel fiyatı hesaplama
      const lamelUnitPrice = lamelUnitPrices[selections.lamelTickness] || 1.0;
      const lamelPrice =
        lamelUnitPrice * lamelCount * (lamelCuttingSize / 1000);

      // Kutu yüksekliği hesaplama
      const sarimCap =
        sarimTablosu[selections.lamelTickness]?.[
          selections.height.toString()
        ] || 110;
      const calculatedBoxHeight = Math.max(sarimCap, boxHeight);

      // Toplam fiyat hesaplama
      const colorMultiplier =
        colorPriceMultipliers[selections.lamel_color] || 1.0;
      const totalPriceEuro = lamelPrice * colorMultiplier * selections.quantity;
      const totalPriceTL = totalPriceEuro * EURO_TO_TL;

      // Dikme ve lamel uyumluluğu kontrolü
      const miniPosts = [
        "mini_dikme",
        "mini_orta_dikme",
        "mini_pvc_dikme",
        "mini_pvc_orta_dikme",
      ];
      const midiPosts = [
        "midi_dikme",
        "midi_orta_dikme",
        "midi_pvc_dikme",
        "midi_pvc_orta_dikme",
      ];

      if (
        selections.lamelTickness === "39_sl" &&
        !miniPosts.includes(selections.dikmeType)
      ) {
        errors.push("39 SL lamel kalınlığı için mini dikme kullanılmalıdır");
      }
      if (
        selections.lamelTickness === "55_sl" &&
        !midiPosts.includes(selections.dikmeType)
      ) {
        errors.push("55 SL lamel kalınlığı için midi dikme kullanılmalıdır");
      }

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
        boxHeight: calculatedBoxHeight,
        totalPriceTL,
        errors,
      });
    };

    calculate();
  }, [selections]);

  return result;
};
