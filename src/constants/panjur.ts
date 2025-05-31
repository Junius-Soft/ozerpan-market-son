import { LamelProperties, LamelHeightTable } from "@/types/panjur";

// Lamel özellikleri sabitleri
export const lamelProperties: Record<string, LamelProperties> = {
  "39_sl": {
    tavsiyeEdilenMaksimumEn: 2300,
    tavsiyeEdilenMaksimumYukseklik: 2400,
    maksimumKullanimAlani: 5.5,
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
