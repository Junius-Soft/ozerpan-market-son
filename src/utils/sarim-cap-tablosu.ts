// PDF'deki sarım tablosuna göre sarım çapı hesaplama
// Sarım çapı (cm) = f(yükseklik (m), lamel tipi, hareket tipi)
// ÖNEMLİ: Sarım çapı sadece yüksekliğe göre hesaplanır, genişlik değişince bir değişme olmaz

// Sarım çapı tablosu (cm cinsinden)
// Format: [lamelTipi][hareketTipi][yukseklikMetre] = sarimCapiCm
const sarimCapiTablosu: Record<string, Record<string, Record<number, number>>> = {
  "39_sl": {
    manuel: {
      1.0: 11,
      1.25: 12,
      1.5: 13,
      1.75: 14,
      2.0: 15,
      2.25: 16,
      2.5: 17,
      2.75: 18,
      3.0: 19,
      3.25: 20,
      3.5: 21,
    },
    motorlu: {
      1.0: 13,
      1.25: 14,
      1.5: 15.5,
      1.75: 16,
      2.0: 17,
      2.25: 18,
      2.5: 19,
      2.75: 19.5,
      3.0: 20,
      3.25: 21,
      3.5: 21,
    },
  },
  "45_se": {
    manuel: {
      1.0: 14,
      1.25: 15,
      1.5: 15.5,
      1.75: 16.5,
      2.0: 17.5,
      2.25: 18.5,
      2.5: 19.5,
      2.75: 20,
      3.0: 20.5,
      3.25: 21,
      3.5: 21.5,
    },
    motorlu: {
      1.0: 14,
      1.25: 15,
      1.5: 15.5,
      1.75: 16.5,
      2.0: 17.5,
      2.25: 18.5,
      2.5: 19.5,
      2.75: 20.5,
      3.0: 21.5,
      3.25: 22,
      3.5: 22.5,
    },
  },
  "55_sl": {
    manuel: {
      1.0: 18.5,
      1.25: 21,
      1.5: 23.5,
      1.75: 24,
      2.0: 25.5,
      2.25: 27,
      2.5: 27.5,
      2.75: 28.5,
      3.0: 31,
      3.25: 31.5,
      3.5: 32.5,
    },
    motorlu: {
      1.0: 18.5,
      1.25: 21,
      1.5: 23.5,
      1.75: 24,
      2.0: 25.5,
      2.25: 27,
      2.5: 27.5,
      2.75: 28.5,
      3.0: 31,
      3.25: 31.5,
      3.5: 32.5,
    },
  },
  "55_se": {
    manuel: {
      1.0: 18.5,
      1.25: 21,
      1.5: 23.5,
      1.75: 24,
      2.0: 25.5,
      2.25: 27,
      2.5: 27.5,
      2.75: 28.5,
      3.0: 31,
      3.25: 31.5,
      3.5: 32.5,
    },
    motorlu: {
      1.0: 18.5,
      1.25: 21,
      1.5: 23.5,
      1.75: 24,
      2.0: 25.5,
      2.25: 27,
      2.5: 27.5,
      2.75: 28.5,
      3.0: 31,
      3.25: 31.5,
      3.5: 32.5,
    },
  },
};

/**
 * Sarım çapını hesaplar (cm cinsinden)
 * ÖNEMLİ: Sarım çapı sadece yüksekliğe göre hesaplanır, genişlik değişince bir değişme olmaz
 * @param height Yükseklik (mm) - Sadece yükseklik kullanılır, genişlik kullanılmaz
 * @param lamelTickness Lamel kalınlığı (39_sl, 45_se, 55_sl, 55_se)
 * @param movementType Hareket tipi (manuel, motorlu)
 * @returns Sarım çapı (cm) veya null
 */
export function calculateSarimCapi(
  height: number,
  lamelTickness: string,
  movementType: "manuel" | "motorlu"
): number | null {
  const heightMetre = height / 1000;
  
  // En yakın yükseklik değerini bul (yukarı yuvarlama)
  const heightKeys = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5];
  let closestHeight = heightKeys[0];
  
  for (const key of heightKeys) {
    if (heightMetre <= key) {
      closestHeight = key;
      break;
    }
  }
  
  // Eğer 3.5'ten büyükse, en büyük değeri kullan
  if (heightMetre > 3.5) {
    closestHeight = 3.5;
  }
  
  const tablo = sarimCapiTablosu[lamelTickness]?.[movementType];
  if (!tablo) return null;
  
  return tablo[closestHeight] || null;
}

/**
 * Sarım çapına göre kutu ölçüsünü belirler
 * PDF'deki tabloya göre:
 * - 40mm boru (manuel): 137mm, 165mm, 205mm, 250mm
 * - 60mm boru (motorlu): 137mm, 165mm, 205mm, 250mm
 * 
 * Sarım çapına göre kutu seçimi:
 * - 11-13cm → 137mm
 * - 14-16cm → 165mm
 * - 17-20cm → 205mm
 * - 21cm+ → 250mm
 * 
 * @param sarimCapi Sarım çapı (cm)
 * @param optionId Montaj tipi (distan, monoblok, yalitimli)
 * @returns Kutu ölçüsü ID veya null
 */
export function getBoxSizeBySarimCapi(
  sarimCapi: number | null,
  optionId: string
): string | null {
  if (!sarimCapi || optionId !== "distan") {
    return null;
  }
  
  // Distan için sarım çapına göre kutu seçimi
  if (sarimCapi <= 13) {
    return "137mm";
  } else if (sarimCapi <= 16) {
    return "165mm";
  } else if (sarimCapi <= 20) {
    return "205mm";
  } else {
    return "250mm";
  }
}

