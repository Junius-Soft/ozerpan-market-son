import { CalculationResult, PriceItem, SelectedProduct } from "@/types/panjur";
import { SineklikSelections } from "@/types/sineklik";
import { getKanatProfiles, getKasaProfiles } from "@/utils/sineklikProfiles";

export const calculateSineklik = (
  values: SineklikSelections,
  prices: PriceItem[],
  accessories: PriceItem[]
): CalculationResult => {
  const profiles: SelectedProduct[] = getProfileItems(values, prices);

  const profilesTotalPrice: number = (profiles || []).reduce((total, acc) => {
    return total + parseFloat(acc.price) * (acc.quantity || 1);
  }, 0);

  const accessoriesTotalPrice: number = (accessories || []).reduce(
    (total, acc) => {
      return total + parseFloat(acc.price) * (acc.quantity || 1);
    },
    0
  );

  return {
    totalPrice: profilesTotalPrice + accessoriesTotalPrice,
    selectedProducts: { products: profiles, accessories: accessories },
    errors: [],
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
  }

  console.log("Profile Items:", profileItems);
  return profileItems;
}

function handlePliseProfileItems(
  values: SineklikSelections,
  allProfiles: PriceItem[],
  profileItems: SelectedProduct[]
) {
  const kasaProfiles = getKasaProfiles(values, allProfiles);
  kasaProfiles.forEach((item) => profileItems.push(item));

  const kanatProfiles = getKanatProfiles(values, allProfiles);
  kanatProfiles.forEach((item) => profileItems.push(item));
}
