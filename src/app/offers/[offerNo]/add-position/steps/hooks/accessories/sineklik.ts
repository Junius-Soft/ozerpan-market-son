import { SineklikSelections } from "@/types/sineklik";
import { PriceItem } from "@/types/panjur";
import {
  getPliseTulAccessoryItem,
  getPliseSeritItem,
  getPliseRopeItem,
  getPliseBeadItem,
  getPliseAccessoryKitItem,
  getPliseMagnetItem,
} from "@/utils/sineklikAccessory";

export const calculateSineklikAccessories = (
  values: SineklikSelections,
  allAccessories: PriceItem[],
): PriceItem[] => {
  const neededAccessories: PriceItem[] = [];

  const { sineklikType } = values;

  switch (sineklikType.toLowerCase()) {
    case "plise":
      handlePliseAccessories(values, allAccessories, neededAccessories);
      break;
    case "menteseli":
      handleMenteseliAccessories(values, allAccessories, neededAccessories);
      break;
    case "sabit":
      handleSabitAccessories(values, allAccessories, neededAccessories);
      break;
    case "surme":
      handleSurmeAccessories(values, allAccessories, neededAccessories);
      break;
  }

  return neededAccessories;
};

function handleMenteseliAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[],
) {
  console.log("Handle Menteseli Accessories");
}

function handleSabitAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[],
) {
  console.log("Handle Sabit Accessories");
}

function handleSurmeAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[],
) {
  console.log("Handle Surme Accessories");
}

function handlePliseAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[],
) {
  const tulItems = getPliseTulAccessoryItem(values, allAccessories);
  tulItems.forEach((item) => neededAccessories.push(item));

  const seritItem = getPliseSeritItem(values, allAccessories);
  if (seritItem) neededAccessories.push(seritItem);

  const ropeItem = getPliseRopeItem(values, allAccessories);
  if (ropeItem) neededAccessories.push(ropeItem);

  const beadItem = getPliseBeadItem(allAccessories, ropeItem);
  if (beadItem) neededAccessories.push(beadItem);

  const accessoryKitItem = getPliseAccessoryKitItem(values, allAccessories);
  if (accessoryKitItem) neededAccessories.push(accessoryKitItem);

  const magnetItem = getPliseMagnetItem(values, allAccessories);
  if (magnetItem) neededAccessories.push(magnetItem);

  return;
}
