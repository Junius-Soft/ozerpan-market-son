import { PriceItem, SelectedProduct } from "@/types/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getMenteseliKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color, menteseliOpeningType } = values;

  if (menteseliOpeningType === "disaAcilim") return [];

  const mappedProfiles: SelectedProduct[] = [];

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kasa Profili") &&
      item.color === color
    );
  });
  if (!profile) return [];

  const quantity = 2;
  const horizontalMeasurement: number = width - 110;
  const horizontalPricePerPiece: number =
    (horizontalMeasurement / 1000) * parseFloat(profile.price);

  const verticalMeasurement: number = height - 110;
  const verticalPricePerPiece: number =
    (verticalMeasurement / 1000) * parseFloat(profile.price);

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: quantity * horizontalPricePerPiece,
    size: horizontalMeasurement + "mm",
  });

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: quantity * verticalPricePerPiece,
    size: verticalMeasurement + "mm",
  });

  return mappedProfiles;
}

export function getMenteseliKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color, menteseliOpeningType } = values;
  const mappedProfiles: SelectedProduct[] = [];

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kanat Profili") &&
      item.color === color
    );
  });
  if (!profile) return [];

  const quantity = 2;
  const horizontalMeasurement: number =
    menteseliOpeningType === "disaAcilim" ? width - 50 : width - 84;
  const horizontalPricePerPiece: number =
    (horizontalMeasurement / 1000) * parseFloat(profile.price);

  const verticalMeasurement: number =
    menteseliOpeningType === "disaAcilim" ? height - 50 : height - 84;
  const verticalPricePerPiece: number =
    (verticalMeasurement / 1000) * parseFloat(profile.price);

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: quantity * verticalPricePerPiece,
    size: verticalMeasurement + "mm",
  });

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: quantity * horizontalPricePerPiece,
    size: horizontalMeasurement + "mm",
  });

  return mappedProfiles;
}

export function getSabitKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("İçe Açılım Sineklik Kanat Profili") &&
      item.color === color
    );
  });
  if (!profile) return [];

  const quantity = 2;

  const horizontalMeasurement: number = width - 84;
  const horizontalPricePerPiece: number =
    (horizontalMeasurement / 1000) * parseFloat(profile.price);

  const verticalMeasurement: number = height - 84;
  const verticalPricePerPiece: number =
    (verticalMeasurement / 1000) * parseFloat(profile.price);

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: quantity * horizontalPricePerPiece,
    size: horizontalMeasurement + "mm",
  });

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: quantity * verticalPricePerPiece,
    size: verticalMeasurement + "mm",
  });

  return mappedProfiles;
}

export function getPliseKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const mappedProfiles: SelectedProduct[] = [];

  const { width, height, color, pliseOpeningType } = values;

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kanat Profili") && item.color === color
    );
  });
  if (!profile) return [];

  let measurement: number;

  if (pliseOpeningType == "dikey") {
    measurement = width - 94;
  } else {
    measurement = height - 94;
  }

  const quantity = 1;
  const pricePerPiece = (parseFloat(profile.price) * measurement) / 1000;

  mappedProfiles.push({
    ...profile,
    quantity: quantity,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
    totalPrice: pricePerPiece * quantity,
    size: measurement + "mm",
  });

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
  const verticalMeasurement: number = height - 50;
  let horizontalQuantity: number = 2;
  let verticalQuantity: number = 2;
  let dusukEsik: PriceItem | undefined;

  if (kasaType === "esiksiz") {
    dusukEsik = allProfiles.find((item) => {
      return (
        item.description.includes("Plise Düşük Eşik Profili") &&
        item.color === color
      );
    });
    if (pliseOpeningType === "yatay") {
      horizontalQuantity = 1;
    }
    if (pliseOpeningType === "double") {
      verticalQuantity = 1;
    }
  }

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kasa Profili") && item.color === color
    );
  });
  if (!profile) return [];

  const horizontalPricePerPiece =
    (horizontalMeasurement * parseFloat(profile.price)) / 1000;
  const verticalPricePerPiece =
    (verticalMeasurement * parseFloat(profile.price)) / 1000;

  const horizontalProfile: SelectedProduct = {
    ...profile,
    quantity: horizontalQuantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: horizontalQuantity * horizontalPricePerPiece,
    size: horizontalMeasurement + "mm",
  };
  const verticalProfile: SelectedProduct = {
    ...profile,
    quantity: verticalQuantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: verticalQuantity * verticalPricePerPiece,
    size: verticalMeasurement + "",
  };

  mappedProfiles.push(horizontalProfile);
  mappedProfiles.push(verticalProfile);
  if (dusukEsik) {
    const dusukEsikPricePerPiece =
      (dusukEsikMeasurement * parseFloat(dusukEsik.price)) / 1000;
    const dusukEsikQuantity = 1;

    const dusukEsikProfile: SelectedProduct = {
      ...dusukEsik,
      quantity: dusukEsikQuantity,
      measurement: dusukEsikMeasurement,
      pricePerPiece: dusukEsikPricePerPiece,
      totalPrice: dusukEsikPricePerPiece * dusukEsikQuantity,
      size: dusukEsikMeasurement + "mm",
    };
    mappedProfiles.push(dusukEsikProfile);
  }

  return mappedProfiles;
}

export function getSurmeKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Sürme Sineklik Ray Profili") &&
      item.color === color
    );
  });
  if (!profile) return [];

  const quantity = 2;

  const horizontalMeasurement = width - 84;
  const horizontalPricePerPiece =
    (horizontalMeasurement * parseFloat(profile.price)) / 1000;

  const verticalMeasurement = height - 84;
  const verticalPricePerPiece =
    (verticalMeasurement * parseFloat(profile.price)) / 1000;

  const horizontalProfile: SelectedProduct = {
    ...profile,
    quantity: quantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: horizontalPricePerPiece * quantity,
    size: horizontalMeasurement + "",
  };

  const verticalProfile: SelectedProduct = {
    ...profile,
    quantity: quantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: verticalPricePerPiece * quantity,
    size: verticalMeasurement + "",
  };

  mappedProfiles.push(horizontalProfile);
  mappedProfiles.push(verticalProfile);
  return mappedProfiles;
}

export function getSurmeKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[]
): SelectedProduct[] {
  const { width, height, color } = values;

  const mappedProfiles: SelectedProduct[] = [];

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Sürme Sineklik Kanat Profili") &&
      item.color === color
    );
  });
  if (!profile) return [];

  const quantity = 2;

  const horizontalMeasurement = width;
  const horizontalPricePerPiece =
    (horizontalMeasurement / 1000) * parseFloat(profile.price);

  const verticalMeasurement = height;
  const verticalPricePerPiece =
    (verticalMeasurement / 1000) * parseFloat(profile.price);

  const horizontalProfile: SelectedProduct = {
    ...profile,
    quantity: quantity,
    measurement: horizontalMeasurement,
    pricePerPiece: horizontalPricePerPiece,
    totalPrice: horizontalPricePerPiece * quantity,
    size: horizontalMeasurement + "",
  };

  const verticalProfile: SelectedProduct = {
    ...profile,
    quantity: quantity,
    measurement: verticalMeasurement,
    pricePerPiece: verticalPricePerPiece,
    totalPrice: verticalPricePerPiece * quantity,
    size: verticalMeasurement + "mm",
  };

  mappedProfiles.push(horizontalProfile);
  mappedProfiles.push(verticalProfile);

  return mappedProfiles;
}
