import { LamelProperties, LamelHeightTable } from "@/types/panjur";

// Lamel özellikleri sabitleri
export const lamelProperties: Record<string, LamelProperties> = {
  "39_sl": {
    maxWidth: 2000, // PDF'deki tavsiye edilen maksimum en: 2000 mm
    maxHeight: 2400, // PDF'deki tavsiye edilen maksimum yükseklik: 2400 mm
    maxArea: 5.5, // PDF'deki maksimum kullanım alanı: 5,50 m²
  },
  "55_sl": {
    maxWidth: 3200,
    maxHeight: 3100,
    maxArea: 10.0, // m2
  },
  "45_se": {
    maxWidth: 4250,
    maxHeight: 3500,
    maxArea: 14.0, // m2
  },
  "55_se": {
    maxWidth: 5500,
    maxHeight: 4000,
    maxArea: 22.0, // m2
  },
};

// Maksimum lamel yüksekliği tablosu (mm)
// Kutu boyutuna ve lamel tipine göre maksimum panjur yükseklikleri
export const maxLamelHeights: LamelHeightTable = {
  distan: {
    "137": {
      "39_sl": { manuel: 1600, motorlu: 1350 },
      "45_se": { manuel: 1400, motorlu: 1200 },
      "55_sl": { manuel: 1100, motorlu: 900 },
      "55_se": { manuel: 1100, motorlu: 900 },
    },
    "165": {
      "39_sl": { manuel: 2100, motorlu: 1850 },
      "45_se": { manuel: 1800, motorlu: 1550 },
      "55_sl": { manuel: 1500, motorlu: 1300 },
      "55_se": { manuel: 1500, motorlu: 1300 },
    },
    "205": {
      "39_sl": { manuel: 2900, motorlu: 2650 },
      "45_se": { manuel: 2600, motorlu: 2350 },
      "55_sl": { manuel: 2200, motorlu: 1950 },
      "55_se": { manuel: 2200, motorlu: 1950 },
    },
    "250": {
      "39_sl": { manuel: 3700, motorlu: 3450 },
      "45_se": { manuel: 3400, motorlu: 3150 },
      "55_sl": { manuel: 3000, motorlu: 2750 },
      "55_se": { manuel: 3000, motorlu: 2750 },
    },
  },
  monoblok: {
    "185": {
      "39_sl": { manuel: 2100, motorlu: 1850 },
      "45_se": { manuel: 1800, motorlu: 1550 },
      "55_sl": { manuel: 1500, motorlu: 1300 },
      "55_se": { manuel: 1500, motorlu: 1300 },
    },
    "185x220": {
      "39_sl": { manuel: 2100, motorlu: 1850 },
      "45_se": { manuel: 1800, motorlu: 1550 },
      "55_sl": { manuel: 1500, motorlu: 1300 },
      "55_se": { manuel: 1500, motorlu: 1300 },
    },
    "220": {
      "39_sl": { manuel: 2900, motorlu: 2650 },
      "45_se": { manuel: 2600, motorlu: 2350 },
      "55_sl": { manuel: 2200, motorlu: 1950 },
      "55_se": { manuel: 2200, motorlu: 1950 },
    },
    "220x255": {
      "39_sl": { manuel: 2900, motorlu: 2650 },
      "45_se": { manuel: 2600, motorlu: 2350 },
      "55_sl": { manuel: 2200, motorlu: 1950 },
      "55_se": { manuel: 2200, motorlu: 1950 },
    },
  },
  yalitimli: {
    "250_yerli": {
      "39_sl": { manuel: null, motorlu: 2350 },
      "45_se": { manuel: null, motorlu: 2050 },
      "55_sl": { manuel: null, motorlu: 1750 },
      "55_se": { manuel: null, motorlu: 1750 },
    },
    "250_ithal": {
      "39_sl": { manuel: null, motorlu: 2350 },
      "45_se": { manuel: null, motorlu: 2050 },
      "55_sl": { manuel: null, motorlu: 1750 },
      "55_se": { manuel: null, motorlu: 1750 },
    },
    "300_yerli": {
      "39_sl": { manuel: null, motorlu: 3150 },
      "45_se": { manuel: null, motorlu: 2850 },
      "55_sl": { manuel: null, motorlu: 2500 },
      "55_se": { manuel: null, motorlu: 2500 },
    },
    "300_ithal": {
      "39_sl": { manuel: null, motorlu: 3150 },
      "45_se": { manuel: null, motorlu: 2850 },
      "55_sl": { manuel: null, motorlu: 2500 },
      "55_se": { manuel: null, motorlu: 2500 },
    },
  },
};
