import { PriceItem, SelectedProduct } from "@/types/panjur";
import { createSelectedProduct, normalizeColor } from "@/utils/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getMenteseliKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color, menteseliOpeningType } = values;

  if (menteseliOpeningType === "disaAcilim") return [];

  const mappedProfiles: SelectedProduct[] = [];

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kasa Profili") &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const quantity = 2;
  const horizontalSize = width; // 110mm deduction removed as per user feedback ("imalat listesi yanlış")
  const verticalSize = height; // 110mm deduction removed
  mappedProfiles.push(createSelectedProduct(profile, quantity, horizontalSize));
  mappedProfiles.push(createSelectedProduct(profile, quantity, verticalSize));

  return mappedProfiles;
}

export function getMenteseliKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color, menteseliOpeningType } = values;
  const mappedProfiles: SelectedProduct[] = [];

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kanat Profili") &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const quantity = 2;
  const horizontalSize =
    menteseliOpeningType === "disaAcilim" ? width - 50 : width - 84;
  const verticalSize =
    menteseliOpeningType === "disaAcilim" ? height - 50 : height - 84;
  mappedProfiles.push(createSelectedProduct(profile, quantity, verticalSize));
  mappedProfiles.push(createSelectedProduct(profile, quantity, horizontalSize));

  return mappedProfiles;
}

export function getSabitKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kanat Profili") &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const quantity = 2;
  const horizontalSize = width - 84;
  const verticalSize = height - 84;
  mappedProfiles.push(createSelectedProduct(profile, quantity, horizontalSize));
  mappedProfiles.push(createSelectedProduct(profile, quantity, verticalSize));

  return mappedProfiles;
}

export function getPliseKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const mappedProfiles: SelectedProduct[] = [];

  const { width, height, color, pliseOpeningType } = values;

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kanat Profili") &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const size = pliseOpeningType == "dikey" ? width - 94 : height - 94;
  const quantity = 1;
  mappedProfiles.push(createSelectedProduct(profile, quantity, size));

  return mappedProfiles;
}

export function getPliseKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, kasaType, color, pliseOpeningType } = values;

  const mappedProfiles: SelectedProduct[] = [];
  const dusukEsikMeasurement: number = width - 4;
  const horizontalMeasurement: number = width - 50;
  let verticalMeasurement: number = height - 50;
  let horizontalQuantity: number = 2;
  let verticalQuantity: number = 2;
  let dusukEsik: PriceItem | undefined;

  const normalizedColor = normalizeColor(color);

  if (kasaType === "esiksiz") {
    verticalMeasurement = width - 35;
    dusukEsik = allProfiles.find((item) => {
      // Find matches description AND normalized color
      return (
        item.description.includes("Plise Düşük Eşik Profili") &&
        normalizeColor(item.color) === normalizedColor
      );
    });
    if (pliseOpeningType === "yatay") {
      horizontalQuantity = 1;
    }
    if (pliseOpeningType === "double") {
      verticalQuantity = 2; // Should be 2 for double (left/right)
    }
  }

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kasa Profili") &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  mappedProfiles.push(
    createSelectedProduct(profile, horizontalQuantity, horizontalMeasurement)
  );
  mappedProfiles.push(
    createSelectedProduct(profile, verticalQuantity, verticalMeasurement)
  );
  if (dusukEsik) {
    mappedProfiles.push(
      createSelectedProduct(dusukEsik, 1, dusukEsikMeasurement)
    );
  }
  return mappedProfiles;
}

export function getSurmeKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      (item.description.includes("Sürme Sineklik Ray Profili") ||
        item.description.includes("Alm. Sürme Sineklik Ray Profili")) &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const quantity = 2;

  const horizontalMeasurement = width - 84;

  const verticalMeasurement = height - 84;

  mappedProfiles.push(
    createSelectedProduct(profile, quantity, horizontalMeasurement)
  );
  mappedProfiles.push(
    createSelectedProduct(profile, quantity, verticalMeasurement)
  );
  return mappedProfiles;
}

export function getSurmeKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const normalizedColor = normalizeColor(color);

  const profile = allProfiles.find((item) => {
    return (
      (item.description.includes("Sürme Sineklik Kanat Profili") ||
        item.description.includes("Alm. Sürme Sineklik Kanat Profili")) &&
      normalizeColor(item.color) === normalizedColor
    );
  });
  if (!profile) return [];

  const quantity = 2;

  const horizontalMeasurement = width;

  const verticalMeasurement = height;

  mappedProfiles.push(
    createSelectedProduct(profile, quantity, horizontalMeasurement)
  );
  mappedProfiles.push(
    createSelectedProduct(profile, quantity, verticalMeasurement)
  );
  return mappedProfiles;
}
