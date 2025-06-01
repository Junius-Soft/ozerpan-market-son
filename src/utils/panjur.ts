import { LamelProperties } from "@/types/panjur";
import { lamelProperties, maxLamelHeights } from "@/constants/panjur";
import { PriceItem, SelectedProduct } from "@/types/panjur";

export const getLamelProperties = (lamelTickness: string): LamelProperties => {
  return lamelProperties[lamelTickness];
};

export const getBoxHeight = (boxType: string): number => {
  return parseInt(boxType.replace("mm", ""));
};

export const getKertmePayi = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 20 : 25;
};

export const getMaxLamelHeight = (
  boxType: string,
  lamelTickness: string,
  movementType: "manuel" | "motorlu"
): number | null => {
  const boxSize = boxType.replace("mm", "");
  const lamelType = lamelTickness.split("_")[0];
  return maxLamelHeights[boxSize]?.[lamelType]?.[movementType] ?? null;
};

export const getDikmeGenisligi = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 53 : 62;
};

export const getLamelDusmeValue = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 37 : 45;
};

export const normalizeColor = (color: string): string => {
  return color
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const createSelectedProduct = (
  priceItem: PriceItem,
  quantity: number
): SelectedProduct => {
  return {
    ...priceItem,
    quantity,
    totalPrice: parseFloat(priceItem.price) * quantity,
  };
};

export const findLamelPrice = (
  prices: PriceItem[],
  lamelTickness: string,
  lamelType: string,
  color: string,
  quantity: number
): [number, SelectedProduct | null] => {
  const lamelPrices = prices.filter((p) => p.type === "lamel_profilleri");
  const normalizedColor = normalizeColor(color);

  const thickness = lamelTickness.split("_")[0];
  const typeStr =
    lamelType === "aluminyum_poliuretanli" ? "Poliüretanlı" : "Ekstrüzyon";
  const searchPattern = `${thickness} mm Alüminyum ${typeStr} Lamel ${normalizedColor}`;

  const matchingLamel = lamelPrices.find(
    (p) => p.description === searchPattern
  );

  if (!matchingLamel) return [0, null];

  const selectedProduct = createSelectedProduct(matchingLamel, quantity);
  return [parseFloat(matchingLamel.price), selectedProduct];
};

export const findSubPartPrice = (
  prices: PriceItem[],
  subPart: string,
  color: string
): [number, SelectedProduct | null] => {
  const subPartPrices = prices.filter((p) => p.type === "alt_parca");
  const normalizedColor = normalizeColor(color);

  const subPartType = subPart.split("_")[0];
  const normalizedSubPart =
    subPartType.charAt(0).toUpperCase() + subPartType.slice(1).toLowerCase();

  const searchPattern = `${normalizedSubPart} Alt Parça ${normalizedColor}`;

  const matchingSubPart = subPartPrices.find(
    (p) => p.description === searchPattern
  );

  if (!matchingSubPart) return [0, null];

  const selectedProduct = createSelectedProduct(matchingSubPart, 1);
  return [parseFloat(matchingSubPart.price), selectedProduct];
};

export const findDikmePrice = (
  prices: PriceItem[],
  dikmeType: string,
  color: string,
  quantity: number
): [number, SelectedProduct | null] => {
  const dikmePrices = prices.filter((p) => p.type === "dikme_profilleri");
  const normalizedColor = normalizeColor(color);

  const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
  const dikmeWidth = dikmeType.startsWith("mini_") ? "53" : "60";

  const searchPattern = `${typePrefix} Dikme ${dikmeWidth} mm ${normalizedColor}`;

  const matchingDikme = dikmePrices.find(
    (p) => p.description === searchPattern
  );

  if (!matchingDikme) return [0, null];

  const selectedProduct = createSelectedProduct(matchingDikme, quantity);
  return [parseFloat(matchingDikme.price), selectedProduct];
};

export const findBoxPrice = (
  prices: PriceItem[],
  boxType: string,
  color: string
): {
  frontPrice: number;
  backPrice: number;
  selectedFrontBox?: SelectedProduct;
  selectedBackBox?: SelectedProduct;
} => {
  const boxPrices = prices.filter((p) => p.type === "kutu_profilleri");
  const normalizedColor = normalizeColor(color);

  // Convert box type (e.g., "137mm" to "137")
  const boxSize = boxType.replace("mm", "");

  // Search patterns for front and back box profiles
  const frontPattern = `${boxSize} - ÖN 45 Alüminyum Kutu ${normalizedColor}`;
  const backPattern = `${boxSize} - ARKA 90 Alüminyum Kutu ${normalizedColor}`;

  const matchingFrontBox = boxPrices.find(
    (p) => p.description === frontPattern
  );
  const matchingBackBox = boxPrices.find((p) => p.description === backPattern);

  const frontPrice = matchingFrontBox ? parseFloat(matchingFrontBox.price) : 0;
  const backPrice = matchingBackBox ? parseFloat(matchingBackBox.price) : 0;

  // Create selected products
  const selectedFrontBox = matchingFrontBox
    ? createSelectedProduct(matchingFrontBox, 1)
    : undefined;
  const selectedBackBox = matchingBackBox
    ? createSelectedProduct(matchingBackBox, 1)
    : undefined;

  return {
    frontPrice,
    backPrice,
    selectedFrontBox,
    selectedBackBox,
  };
};

export const findSmartHomePrice = (
  prices: PriceItem[],
  smartHomeType: string | undefined
): [number, SelectedProduct | null] => {
  if (!smartHomeType) return [0, null];

  const smarthomePrices = prices.filter(
    (price) => price.type.toLowerCase() === "akilli_ev_sistemleri"
  );
  const searchKey = smartHomeType.toLowerCase().replace(/_/g, " ");
  const smarthomeItem = smarthomePrices.find((price) =>
    price.description.toLowerCase().includes(searchKey)
  );

  if (!smarthomeItem) return [0, null];

  const smarthomePrice = parseFloat(smarthomeItem.price);
  const smarthomeSelectedProduct = createSelectedProduct(smarthomeItem, 1);

  return [smarthomePrice, smarthomeSelectedProduct];
};
