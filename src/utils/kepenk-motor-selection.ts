// Kepenk motor seçimi için Excel tablosuna göre m2 kapasiteleri
// Tablo: m2 göre motor kullanım tablosu
// Üst satırdaki sayılar Newton değerleri (70-80, 70-100, vb.)

export interface MotorCapacity {
  newtonRange: string; // "70-80", "70-100", "70-120", "70-140", "102-230", "102-330", "SEL-600", "SEL-800", "SEL-1000"
  maxM2: number; // Bu Newton değeri için maksimum m2 kapasitesi
}

// Lamel tipine göre motor kapasiteleri (Excel tablosundan)
export const KEPENK_MOTOR_CAPACITY_MAP: Record<string, Record<string, number>> = {
  // SL 77 LAMEL
  sl_77: {
    "70-80": 19,
    "70-100": 22,
    "70-120": 23.5,
    "70-140": 26,
    "102-230": 44,
    "102-330": 58,
  },
  // ST 77 LAMEL
  st_77: {
    "70-80": 9,
    "70-100": 11,
    "70-120": 12,
    "70-140": 13,
    "102-230": 20,
    "102-330": 26,
  },
  // SE 77 LAMEL
  se_77: {
    "70-80": 12,
    "70-100": 14,
    "70-120": 16,
    "70-140": 17,
    "102-230": 28,
    "102-330": 37,
  },
  // SE 78 LAMEL (SE 77 ile aynı)
  se_78: {
    "70-80": 12,
    "70-100": 14,
    "70-120": 16,
    "70-140": 17,
    "102-230": 28,
    "102-330": 37,
  },
  // SL 100 LAMEL
  sl_100: {
    "102-230": 36,
    "102-330": 48,
    "SEL-600": 62,
    "SEL-800": 95,
    "SEL-1000": 105,
  },
  // ST 100 LAMEL
  st_100: {
    "102-230": 15,
    "102-330": 21,
    "SEL-600": 26,
    "SEL-800": 40,
    "SEL-1000": 45,
  },
};

// Motor model ID'lerini Newton değerlerine map et
// Excel'deki motor açıklamalarına ve product-prices.json'daki mevcut modellere göre
export const MOTOR_MODEL_TO_NEWTON: Record<string, string> = {
  // 70mm tambur motorları
  sel_70: "70-80", // MOSEL SEL 70 80 Redüktörlü Motor
  sel_70_120: "70-120", // MOSEL SEL 70-120 Redüktörlü Motor
  // 102mm tambur motorları
  sel_102_120: "102-230", // MOSEL SEL-102-120 Redüktörlü Motor (yaklaşık)
  sel_900: "SEL-800", // SEL -900 Redüktörlü Zincirli Motor (yaklaşık)
  sel_1000: "SEL-1000", // SEL-1000 Endüstriyel Zincirli Motor
};

/**
 * Newton aralığına göre en uygun motor modelini seç
 * @param newtonRange - Newton aralığı (70-80, 70-100, vb.)
 * @param tamburType - Tambur tipi (70mm veya 102mm)
 * @returns Motor model ID veya null
 */
function getMotorModelByNewtonRange(
  newtonRange: string,
  tamburType: string
): string | null {
  if (tamburType === "70mm") {
    if (newtonRange === "70-80") {
      return "sel_70";
    } else if (newtonRange === "70-100" || newtonRange === "70-120") {
      return "sel_70_120"; // 70-100 için de 70-120 motorunu kullan (daha güçlü)
    } else if (newtonRange === "70-140") {
      return "sel_70_120"; // 70-140 için de 70-120 motorunu kullan (mevcut en güçlü)
    }
  } else if (tamburType === "102mm") {
    if (newtonRange === "102-230") {
      return "sel_102_120";
    } else if (newtonRange === "102-330") {
      return "sel_102_120"; // 102-330 için de sel_102_120 kullan (mevcut en güçlü)
    } else if (newtonRange === "SEL-600" || newtonRange === "SEL-800") {
      return "sel_900"; // SEL-600/800 için sel_900 kullan
    } else if (newtonRange === "SEL-1000") {
      return "sel_1000";
    }
  }
  return null;
}

/**
 * Kepenk için uygun motor seçimi
 * @param lamelType - Lamel tipi (sl_77, st_77, se_77, se_78, sl_100, st_100)
 * @param systemAreaM2 - Sistem alanı (m²)
 * @param tamburType - Tambur tipi (70mm veya 102mm)
 * @returns Uygun motor model ID veya null
 */
export function selectKepenkMotor(
  lamelType: string,
  systemAreaM2: number,
  tamburType: string
): string | null {
  // Lamel tipini normalize et
  const normalizedLamelType = lamelType.toLowerCase().replace("-", "_");
  
  // Lamel tipine göre kapasite tablosunu al
  const capacityMap = KEPENK_MOTOR_CAPACITY_MAP[normalizedLamelType];
  if (!capacityMap) {
    return null;
  }

  // Tambur tipine göre uygun Newton aralıklarını filtrele
  const availableNewtonRanges = Object.keys(capacityMap).filter((newtonRange) => {
    if (tamburType === "70mm") {
      // 70mm tambur için sadece 70-xx motorlar
      return newtonRange.startsWith("70-");
    } else if (tamburType === "102mm") {
      // 102mm tambur için 102-xx ve SEL-xxx motorlar
      return newtonRange.startsWith("102-") || newtonRange.startsWith("SEL-");
    }
    return false;
  });

  // Sistem alanını karşılayabilecek en küçük motoru bul
  let selectedNewtonRange: string | null = null;
  let minCapacity = Infinity;

  for (const newtonRange of availableNewtonRanges) {
    const capacity = capacityMap[newtonRange];
    if (capacity >= systemAreaM2 && capacity < minCapacity) {
      minCapacity = capacity;
      selectedNewtonRange = newtonRange;
    }
  }

  if (!selectedNewtonRange) {
    return null; // Uygun motor bulunamadı
  }

  // Newton aralığını motor model ID'sine çevir
  return getMotorModelByNewtonRange(selectedNewtonRange, tamburType);
}

