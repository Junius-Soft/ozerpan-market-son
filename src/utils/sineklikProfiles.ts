import { PriceItem, SelectedProduct } from "@/types/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getKanatProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[],
): SelectedProduct[] {
  const mappedProfiles: SelectedProduct[] = [];

  const { width, height, kasaType, color, pliseOpeningType } = values;

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kanat Profili") && item.color === color
    );
  });
  if (!profile) return [];

  let measurement: number;

  if (kasaType === "esiksiz") {
    // Add esiksiz profile
  } else {
    if (pliseOpeningType == "dikey") {
      measurement = width - 94;
    } else {
      measurement = height - 94;
    }

    mappedProfiles.push({
      ...profile,
      quantity: 1,
      measurement: measurement,
      totalPrice: (parseFloat(profile.price) * measurement) / 1000,
      size: "",
    });
  }

  return mappedProfiles;
}

export function getKasaProfiles(
  values: SineklikSelections,
  allProfiles: PriceItem[],
): SelectedProduct[] {
  const { width, height, kasaType, color, pliseOpeningType } = values;

  const mappedProfiles: SelectedProduct[] = [];
  let horizontalQuantity = 2;
  let verticalQuantity = 2;
  let dusukEsik: PriceItem | undefined;
  let dusukEsikMeasurement: number = width;

  if (kasaType === "esiksiz") {
    dusukEsik = allProfiles.find((item) => {
      return (
        item.description.includes("Plise Düşük Eşik Profili") &&
        item.color === color
      );
    });
    if (pliseOpeningType === "yatay") {
      horizontalQuantity = 1;
      dusukEsikMeasurement -= 4;
    }
    if (pliseOpeningType === "double") {
      verticalQuantity = 1;
      dusukEsikMeasurement -= 50;
    }
  }

  const profile = allProfiles.find((item) => {
    return (
      item.description.includes("Plise Kasa Profili") && item.color === color
    );
  });
  if (!profile) return [];

  const horizontalProfile: SelectedProduct = {
    ...profile,
    quantity: horizontalQuantity,
    measurement: width - 50,
    totalPrice:
      (horizontalQuantity * (width - 50) * parseFloat(profile.price)) / 1000,
    size: "",
  };
  const verticalProfile: SelectedProduct = {
    ...profile,
    quantity: verticalQuantity,
    measurement: height - 50,
    totalPrice:
      (verticalQuantity * (height - 50) * parseFloat(profile.price)) / 1000,
    size: "",
  };

  mappedProfiles.push(horizontalProfile);
  mappedProfiles.push(verticalProfile);
  if (dusukEsik) {
    const dusukEsikProfile: SelectedProduct = {
      ...dusukEsik,
      quantity: 1,
      measurement: dusukEsikMeasurement,
      totalPrice: (dusukEsikMeasurement * parseFloat(dusukEsik.price)) / 1000,
      size: "",
    };
    mappedProfiles.push(dusukEsikProfile);
  }

  return mappedProfiles;
}
