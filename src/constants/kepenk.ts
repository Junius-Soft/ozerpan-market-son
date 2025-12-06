import { LamelProperties } from "@/types/kepenk";

// Lamel özellikleri sabitleri (Excel'den alınan veriler)
export const lamelProperties: Record<string, LamelProperties> = {
  st_77: {
    maxWidth: 5000,
    maxHeight: 4000,
    maxArea: 20.0, // m2
  },
  sl_77: {
    maxWidth: 5400,
    maxHeight: 3850,
    maxArea: 18.0, // m2
  },
  se_77: {
    maxWidth: 7000,
    maxHeight: 5000,
    maxArea: 25.0, // m2
  },
  se_78: {
    maxWidth: 5000,
    maxHeight: 5000,
    maxArea: 20.0, // m2
  },
  st_100: {
    maxWidth: 8000,
    maxHeight: 6000,
    maxArea: 40.0, // m2
  },
  sl_100: {
    maxWidth: 7000,
    maxHeight: 5000,
    maxArea: 30.0, // m2
  },
};

// Kepenk tipi (Maxi/Mega) - Lamel tipine göre otomatik seçim
export const kepenkTipleri = {
  maxi: {
    lamelTypes: ["st_77", "sl_77", "se_77", "se_78"],
    dikmeType: "77_lik",
    tamburType: "70mm",
    boxType: "300mm",
  },
  mega: {
    lamelTypes: ["st_100", "sl_100"],
    dikmeType: "100_luk",
    tamburType: "102mm",
    boxType: "350mm",
  },
};

// Motor tipleri - lamel tipine göre maksimum m2 kapasiteleri
// Her motor için o lamel tipinde taşıyabileceği maksimum m2 değeri
export const motorM2Table: Record<string, Record<string, number>> = {
  sl_77: {
    "70-80": 19,
    "70-100": 22,
    "70-120": 23.5,
    "70-140": 26,
    "102-230": 44,
    "102-330": 58,
  },
  st_77: {
    "70-80": 9,
    "70-100": 11,
    "70-120": 12,
    "70-140": 13,
    "102-230": 20,
    "102-330": 26,
  },
  se_77: {
    "70-80": 12,
    "70-100": 14,
    "70-120": 16,
    "70-140": 17,
    "102-230": 28,
    "102-330": 37,
  },
  se_78: {
    // SE-78 için SE-77 değerlerini kullanıyoruz (benzer yapı)
    "70-80": 12,
    "70-100": 14,
    "70-120": 16,
    "70-140": 17,
    "102-230": 28,
    "102-330": 37,
  },
  sl_100: {
    "102-230": 36,
    "102-330": 48,
    "SEL-600": 62,
    "SEL-800": 95,
    "SEL-1000": 105,
  },
  st_100: {
    "102-230": 15,
    "102-330": 21,
    "SEL-600": 26,
    "SEL-800": 40,
    "SEL-1000": 45,
  },
};

// Motor sıralaması (küçükten büyüğe)
export const motorOrder = [
  "70-80",
  "70-100",
  "70-120",
  "70-140",
  "102-230",
  "102-330",
  "SEL-600",
  "SEL-800",
  "SEL-1000",
];

/**
 * Lamel tipi ve m2 değerine göre uygun motoru seçer
 * @param lamelType - Lamel tipi (sl_77, st_77, se_77, se_78, sl_100, st_100)
 * @param m2 - Kepenk alanı (m2)
 * @returns Önerilen motor tipi veya null
 */
export function selectMotorByM2(
  lamelType: string,
  m2: number
): string | null {
  const lamelMotors = motorM2Table[lamelType];
  if (!lamelMotors) return null;

  // Motor sıralamasına göre ilk uygun motoru bul
  for (const motor of motorOrder) {
    const maxM2 = lamelMotors[motor];
    if (maxM2 !== undefined && m2 <= maxM2) {
      return motor;
    }
  }

  // Hiçbir motor yeterli değilse en büyük motoru öner
  const availableMotors = Object.keys(lamelMotors);
  return availableMotors[availableMotors.length - 1] || null;
}

/**
 * Bir üst motoru getirir
 * @param currentMotor - Mevcut motor tipi
 * @param lamelType - Lamel tipi
 * @returns Bir üst motor tipi veya null (zaten en büyükse)
 */
export function getNextMotor(
  currentMotor: string,
  lamelType: string
): string | null {
  const lamelMotors = motorM2Table[lamelType];
  if (!lamelMotors) return null;

  const currentIndex = motorOrder.indexOf(currentMotor);
  if (currentIndex === -1) return null;

  // Sonraki motorları kontrol et
  for (let i = currentIndex + 1; i < motorOrder.length; i++) {
    const nextMotor = motorOrder[i];
    if (lamelMotors[nextMotor] !== undefined) {
      return nextMotor;
    }
  }

  return null; // Zaten en büyük motor
}

/**
 * Lamel tipine göre kullanılabilir motor listesini getirir
 * @param lamelType - Lamel tipi
 * @returns Motor listesi [{id, name, maxM2}]
 */
export function getAvailableMotors(lamelType: string): Array<{
  id: string;
  name: string;
  maxM2: number;
}> {
  const lamelMotors = motorM2Table[lamelType];
  if (!lamelMotors) return [];

  return motorOrder
    .filter((motor) => lamelMotors[motor] !== undefined)
    .map((motor) => ({
      id: motor,
      name: getMotorDisplayName(motor),
      maxM2: lamelMotors[motor],
    }));
}

/**
 * Motor ID'sinden görüntüleme adını oluşturur
 */
function getMotorDisplayName(motorId: string): string {
  const motorNames: Record<string, string> = {
    "70-80": "MOSEL SEL-70 80 Nm",
    "70-100": "MOSEL SEL-70 100 Nm",
    "70-120": "MOSEL SEL-70 120 Nm",
    "70-140": "MOSEL SEL-70 140 Nm",
    "102-230": "MOSEL SEL-102 230 Nm",
    "102-330": "MOSEL SEL-102 330 Nm",
    "SEL-600": "MOSEL SEL-600 Nm (Santral)",
    "SEL-800": "MOSEL SEL-800 Nm (Santral)",
    "SEL-1000": "MOSEL SEL-1000 Nm (Santral)",
  };
  return motorNames[motorId] || motorId;
}

