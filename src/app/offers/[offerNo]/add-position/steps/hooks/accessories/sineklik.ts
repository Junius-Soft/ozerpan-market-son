import { SineklikSelections } from "@/types/sineklik";
import { PriceItem, SelectedProduct } from "@/types/panjur";
import {
  getPliseTulAccessoryItems,
  getPliseSeritItem,
  getPliseRopeItem,
  getPliseBeadItem,
  getPliseAccessoryKitItem,
  getPliseMagnetItem,
  getSurmeTulAccessoryItem,
  getSurmeFitilAccessoryItem,
  getSurmeKasaTakozuItem,
  getSurmeKanatTakozuItem,
  getSurmeTekerlekItem,
  getSabitTulAccessoryItem,
  getSabitFitilAccessoryItem,
  getSabitKoseTakozuAccessoryItem,
  getMenteseliTulAccessoryItem,
  getMenteseliFitilAccessoryItem,
  getMenteseliKasaKoseTakozuItem,
  getMenteseliKanatTakozuItem,
  getMenteseliPencereMentesesiItem,
  getMenteseliMiknatisItem,
} from "@/utils/sineklikAccessory";

export const calculateSineklikAccessories = (
  values: SineklikSelections,
  allAccessories: PriceItem[]
): SelectedProduct[] => {
  const neededAccessories: SelectedProduct[] = [];

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
  neededAccessories: PriceItem[]
) {
  const tulItem = getMenteseliTulAccessoryItem(values, allAccessories);
  if (tulItem) neededAccessories.push(tulItem);

  const fitilItem = getMenteseliFitilAccessoryItem(values, allAccessories);
  if (fitilItem) neededAccessories.push(fitilItem);

  const kasaKoseTakozuItem = getMenteseliKasaKoseTakozuItem(
    values,
    allAccessories
  );
  if (kasaKoseTakozuItem) neededAccessories.push(kasaKoseTakozuItem);

  const kanatTakozuItem = getMenteseliKanatTakozuItem(values, allAccessories);
  if (kanatTakozuItem) neededAccessories.push(kanatTakozuItem);

  const pencereMentesesiItem = getMenteseliPencereMentesesiItem(
    values,
    allAccessories
  );
  if (pencereMentesesiItem) neededAccessories.push(pencereMentesesiItem);

  const miknatisItem = getMenteseliMiknatisItem(values, allAccessories);
  if (miknatisItem) neededAccessories.push(miknatisItem);
}

function handleSabitAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[]
) {
  const tulItem = getSabitTulAccessoryItem(values, allAccessories);
  if (tulItem) neededAccessories.push(tulItem);

  const fitilItem = getSabitFitilAccessoryItem(values, allAccessories);
  if (fitilItem) neededAccessories.push(fitilItem);

  const koseTakozuItem = getSabitKoseTakozuAccessoryItem(
    values,
    allAccessories
  );
  if (koseTakozuItem) neededAccessories.push(koseTakozuItem);
}

function handleSurmeAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[]
) {
  const tulItem = getSurmeTulAccessoryItem(values, allAccessories);
  if (tulItem) neededAccessories.push(tulItem);

  const fitilItem = getSurmeFitilAccessoryItem(values, allAccessories);
  if (fitilItem) neededAccessories.push(fitilItem);

  const kasaTakozuItem = getSurmeKasaTakozuItem(allAccessories);
  if (kasaTakozuItem) neededAccessories.push(kasaTakozuItem);

  const kanatTakozuItem = getSurmeKanatTakozuItem(allAccessories);
  if (kanatTakozuItem) neededAccessories.push(kanatTakozuItem);

  const tekerlekItem = getSurmeTekerlekItem(allAccessories);
  if (tekerlekItem) neededAccessories.push(tekerlekItem);
}

function handlePliseAccessories(
  values: SineklikSelections,
  allAccessories: PriceItem[],
  neededAccessories: PriceItem[]
) {
  const tulItems = getPliseTulAccessoryItems(values, allAccessories);
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
