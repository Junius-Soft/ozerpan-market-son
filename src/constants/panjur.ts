import { LamelProperties, LamelHeightTable } from "@/types/panjur";

// Lamel özellikleri sabitleri
export const lamelProperties: Record<string, LamelProperties> = {
  "39_sl": {
    maxWidth: 2300,
    maxHeight: 2400,
    maxArea: 5.5, // m2
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
export const maxLamelHeights: LamelHeightTable = {
  distan: {
    "100": {
      "39_sl": { manuel: 1200, motorlu: 900 },
      "45_se": { manuel: 800, motorlu: 800 },
      "55_sl": { manuel: null, motorlu: null },
      "55_se": { manuel: null, motorlu: null },
    },
    "120": {
      "39_sl": { manuel: 1400, motorlu: 1000 },
      "45_se": { manuel: 900, motorlu: 900 },
      "55_sl": { manuel: null, motorlu: null },
      "55_se": { manuel: null, motorlu: null },
    },
    "150": {
      "39_sl": { manuel: 1800, motorlu: 1400 },
      "45_se": { manuel: 1200, motorlu: 1200 },
      "55_sl": { manuel: 1000, motorlu: 800 },
      "55_se": { manuel: 1000, motorlu: 800 },
    },
    "137": {
      "39_sl": { manuel: 1500, motorlu: 1100 },
      "45_se": { manuel: 1000, motorlu: 1000 },
      "55_sl": { manuel: null, motorlu: null },
      "55_se": { manuel: null, motorlu: null },
    },
    "165": {
      "39_sl": { manuel: 2400, motorlu: 2250 },
      "45_se": { manuel: 2000, motorlu: 1750 },
      "55_sl": { manuel: 1800, motorlu: 1600 },
      "55_se": { manuel: 1800, motorlu: 1600 },
    },
    "205": {
      "39_sl": { manuel: 3500, motorlu: 3500 },
      "45_se": { manuel: 3500, motorlu: 3500 },
      "55_sl": { manuel: 3000, motorlu: 2750 },
      "55_se": { manuel: 3000, motorlu: 2750 },
    },
    "250": {
      "39_sl": { manuel: null, motorlu: null },
      "45_se": { manuel: 4000, motorlu: 4000 },
      "55_sl": { manuel: 4500, motorlu: 4500 },
      "55_se": { manuel: 4500, motorlu: 4500 },
    },
  },
  monoblok: {
    "185mm": {
      "39_sl": { manuel: 2400, motorlu: 2250 },
      "45_se": { manuel: 2000, motorlu: 1750 },
      "55_sl": { manuel: 1800, motorlu: 1600 },
      "55_se": { manuel: 1800, motorlu: 1600 },
    },
    "185x220mm": {
      "39_sl": { manuel: 2400, motorlu: 2250 },
      "45_se": { manuel: 2000, motorlu: 1750 },
      "55_sl": { manuel: 1800, motorlu: 1600 },
      "55_se": { manuel: 1800, motorlu: 1600 },
    },
    "220mm": {
      "39_sl": { manuel: 3500, motorlu: 3500 },
      "45_se": { manuel: 3500, motorlu: 3500 },
      "55_sl": { manuel: 3000, motorlu: 2750 },
      "55_se": { manuel: 3000, motorlu: 2750 },
    },
    "220x255mm": {
      "39_sl": { manuel: 3500, motorlu: 3500 },
      "45_se": { manuel: 3500, motorlu: 3500 },
      "55_sl": { manuel: 3000, motorlu: 2750 },
      "55_se": { manuel: 3000, motorlu: 2750 },
    },
  },
};
