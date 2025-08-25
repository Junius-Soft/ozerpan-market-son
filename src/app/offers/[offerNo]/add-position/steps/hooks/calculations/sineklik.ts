import { SineklikSelections } from "@/types/sineklik";
import { CalculationResult, PriceItem, SelectedProduct } from "@/types/panjur";
import {
  getMenteseliKanatProfiles,
  getMenteseliKasaProfiles,
  getPliseKanatProfiles,
  getPliseKasaProfiles,
  getSabitKanatProfiles,
  getSurmeKanatProfiles,
  getSurmeKasaProfiles,
} from "@/utils/sineklikProfiles";

export const calculateSineklik = (
  values: SineklikSelections,
  prices: PriceItem[],
  accessories: PriceItem[]
): CalculationResult => {
  const errors: string[] = [];

  const profiles: SelectedProduct[] = getProfileItems(values, prices);

  const profilesTotalPrice: number = (profiles || []).reduce((total, acc) => {
    return total + acc.totalPrice;
  }, 0);

  const accessoriesTotalPrice: number = (accessories || []).reduce(
    (total, acc) => {
      console.log("Item:", acc);
      return (
        total +
        (acc.pricePerPiece || parseFloat(acc.price)) * (acc.quantity || 1)
      );
    },
    0
  );

  return {
    totalPrice: profilesTotalPrice + accessoriesTotalPrice,
    selectedProducts: { products: profiles, accessories: accessories },
    errors: errors,
  };
};

function getProfileItems(
  values: SineklikSelections,
  prices: PriceItem[]
): SelectedProduct[] {
  const { sineklikType } = values;

  const profileItems: SelectedProduct[] = [];

  switch (sineklikType.toLowerCase()) {
    case "plise":
      handlePliseProfileItems(values, prices, profileItems);
      break;
    case "surme":
      handleSurmeProfileItems(values, prices, profileItems);
      break;
    case "sabit":
      handleSabitProfileItems(values, prices, profileItems);
      break;
    case "menteseli":
      handleMenteseliProfileItems(values, prices, profileItems);
      break;
  }

  console.log("Profile Items:", profileItems);
  return profileItems;
}

function handleMenteseliProfileItems(
  values: SineklikSelections,
  allProfiles: PriceItem[],
  profileItems: SelectedProduct[]
) {
  const kasaProfiles = getMenteseliKasaProfiles(values, allProfiles);
  kasaProfiles.forEach((item) => profileItems.push(item));

  const kanatProfiles = getMenteseliKanatProfiles(values, allProfiles);
  kanatProfiles.forEach((item) => profileItems.push(item));
}

function handleSabitProfileItems(
  values: SineklikSelections,
  allProfiles: PriceItem[],
  profileItems: SelectedProduct[]
) {
  const kanatProfiles = getSabitKanatProfiles(values, allProfiles);
  kanatProfiles.forEach((item) => profileItems.push(item));
}

function handleSurmeProfileItems(
  values: SineklikSelections,
  allProfiles: PriceItem[],
  profileItems: SelectedProduct[]
) {
  const kasaProfiles = getSurmeKasaProfiles(values, allProfiles);
  kasaProfiles.forEach((item) => profileItems.push(item));

  const kanatProfiles = getSurmeKanatProfiles(values, allProfiles);
  kanatProfiles.forEach((item) => profileItems.push(item));
}

function handlePliseProfileItems(
  values: SineklikSelections,
  allProfiles: PriceItem[],
  profileItems: SelectedProduct[]
) {
  const kasaProfiles = getPliseKasaProfiles(values, allProfiles);
  kasaProfiles.forEach((item) => profileItems.push(item));

  const kanatProfiles = getPliseKanatProfiles(values, allProfiles);
  kanatProfiles.forEach((item) => profileItems.push(item));
}
