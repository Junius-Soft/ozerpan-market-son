import { LamelProperties, LamelHeightTable } from "@/types/panjur";

// Lamel özellikleri sabitleri
export const lamelProperties: Record<string, LamelProperties> = {
  "39_sl": {
    maxWidth: 2300,
    maxHeight: 2400,
  },
  "55_sl": {
    maxWidth: 3200,
    maxHeight: 3100,
  },
  "45_se": {
    maxWidth: 4250,
    maxHeight: 3500,
  },
  "55_se": {
    maxWidth: 5500,
    maxHeight: 4000,
  },
};

// Maksimum lamel yüksekliği tablosu (mm)
export const maxLamelHeights: LamelHeightTable = {
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
