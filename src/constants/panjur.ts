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
      // PDF: 137mm Kutu – Alüminyum
      // 39 mm lamel: 40'lık 1500 mm, 60'lık 1100 mm
      "39_sl": { manuel: 1500, motorlu: 1100 },
      // 45 mm lamel satırı ile eşleştirildi
      "45_se": { manuel: 1000, motorlu: 1000 },
      // 55 mm lamel için 137 kutu önerilmediği için null
      "55_sl": { manuel: null, motorlu: null },
      "55_se": { manuel: null, motorlu: null },
    },
    "165": {
      // PDF: 165mm Kutu – Alüminyum
      // 39 mm lamel: 2400 / 2250
      "39_sl": { manuel: 2400, motorlu: 2250 },
      // 45 mm lamel: 2000 / 1750
      "45_se": { manuel: 2000, motorlu: 1750 },
      // 55 mm lamel: 40'lık yok, 60'lık 1600
      "55_sl": { manuel: null, motorlu: 1600 },
      "55_se": { manuel: null, motorlu: 1600 },
    },
    "205": {
      // PDF: 205mm Kutu – Alüminyum (sadece 60'lık)
      // 39 mm lamel: - / 3500
      "39_sl": { manuel: null, motorlu: 3500 },
      // 45 mm lamel: - / 3500
      "45_se": { manuel: null, motorlu: 3500 },
      // 55 mm lamel: - / 2750
      "55_sl": { manuel: null, motorlu: 2750 },
      "55_se": { manuel: null, motorlu: 2750 },
    },
    "250": {
      // PDF: 250mm Kutu – Alüminyum (sadece 60'lık, 39/41 yok)
      // 45 mm lamel: - / 4000
      "39_sl": { manuel: null, motorlu: null },
      "45_se": { manuel: null, motorlu: 4000 },
      // 55 mm lamel: - / 4500
      "55_sl": { manuel: null, motorlu: 4500 },
      "55_se": { manuel: null, motorlu: 4500 },
    },
  },
  monoblok: {
    "185": {
      // PDF: 185x185 PVC Kutu
      // 39 mm lamel: 2400 / 2250
      "39_sl": { manuel: 2400, motorlu: 2250 },
      // 45 mm lamel: 2000 / 1750
      "45_se": { manuel: 2000, motorlu: 1750 },
      // 55 mm lamel: 40'lık yok, 60'lık 1600
      "55_sl": { manuel: null, motorlu: 1600 },
      "55_se": { manuel: null, motorlu: 1600 },
    },
    "185x220": {
      // PDF: 185x220 PVC Kutu (değerler 185x185 ile aynı)
      "39_sl": { manuel: 2400, motorlu: 2250 },
      "45_se": { manuel: 2000, motorlu: 1750 },
      "55_sl": { manuel: null, motorlu: 1600 },
      "55_se": { manuel: null, motorlu: 1600 },
    },
    "220": {
      // PDF: 220x220 PVC Kutu (sadece 60'lık)
      // 39 mm lamel: - / 3500
      "39_sl": { manuel: null, motorlu: 3500 },
      // 45 mm lamel: - / 3500
      "45_se": { manuel: null, motorlu: 3500 },
      // 55 mm lamel: - / 2750
      "55_sl": { manuel: null, motorlu: 2750 },
      "55_se": { manuel: null, motorlu: 2750 },
    },
    "220x255": {
      // PDF: 220x235 PVC Kutu (sadece 60'lık)
      // Değerler 220x220 ile aynı alınmıştır
      "39_sl": { manuel: null, motorlu: 3500 },
      "45_se": { manuel: null, motorlu: 3500 },
      "55_sl": { manuel: null, motorlu: 2750 },
      "55_se": { manuel: null, motorlu: 2750 },
    },
  },
  yalitimli: {
    "250_yerli": {
      // PDF: 250x250 Strafor Kutu (yalıtımlı), sadece 60'lık
      // 39 mm lamel: 3500
      "39_sl": { manuel: null, motorlu: 3500 },
      // 45 mm lamel: 3250
      "45_se": { manuel: null, motorlu: 3250 },
      // 55 mm lamel: 2250
      "55_sl": { manuel: null, motorlu: 2250 },
      "55_se": { manuel: null, motorlu: 2250 },
    },
    "250_ithal": {
      // İthal için de aynı kapasite değerleri kullanılıyor
      "39_sl": { manuel: null, motorlu: 3500 },
      "45_se": { manuel: null, motorlu: 3250 },
      "55_sl": { manuel: null, motorlu: 2250 },
      "55_se": { manuel: null, motorlu: 2250 },
    },
    "300_yerli": {
      // PDF: 300x300 Strafor Kutu (yalıtımlı), sadece 60'lık
      // 39 mm lamel: 3500
      "39_sl": { manuel: null, motorlu: 3500 },
      // 45 mm lamel: 3500
      "45_se": { manuel: null, motorlu: 3500 },
      // 55 mm lamel: 3350
      "55_sl": { manuel: null, motorlu: 3350 },
      "55_se": { manuel: null, motorlu: 3350 },
    },
    "300_ithal": {
      // İthal için de aynı kapasite değerleri kullanılıyor
      "39_sl": { manuel: null, motorlu: 3500 },
      "45_se": { manuel: null, motorlu: 3500 },
      "55_sl": { manuel: null, motorlu: 3350 },
      "55_se": { manuel: null, motorlu: 3350 },
    },
  },
};
