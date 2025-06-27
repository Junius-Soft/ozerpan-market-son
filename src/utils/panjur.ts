import { LamelProperties } from "@/types/panjur";
import { lamelProperties, maxLamelHeights } from "@/constants/panjur";
import { PriceItem, SelectedProduct } from "@/types/panjur";
import { ProductTab } from "@/documents/products";

// Arayüz tanımları
export interface TabField {
  id: string;
  name: string;
  type: string;
  options: Array<{
    id?: string;
    name: string;
  }>;
}

export interface TabContent {
  fields: TabField[];
}

export interface Tab {
  id: string;
  content: TabContent;
}

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
  return dikmeType.startsWith("mini_") ? 75 : 90;
};

export const normalizeColor = (color: string): string => {
  return color
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const createSelectedProduct = (
  priceItem: PriceItem,
  quantity: number,
  size: string = "-"
): SelectedProduct => {
  return {
    ...priceItem,
    quantity,
    totalPrice: parseFloat(priceItem.price) * quantity,
    unit: "Adet",
    size,
  };
};

export const findLamelPrice = (
  prices: PriceItem[],
  lamelTickness: string,
  lamelType: string,
  color: string,
  quantity: number,
  lamelGenisligi: number
): [number, SelectedProduct | null] => {
  const lamelPrices = prices.filter(
    (p) => p.type === "panjur_lamel_profilleri"
  );
  let normalizedColor = normalizeColor(color);

  const thickness = lamelTickness.split("_")[0];
  const typeStr =
    lamelType === "aluminyum_poliuretanli" ? "Poliüretanlı" : "Ekstrüzyon";
  let searchPattern = `${thickness} mm Alüminyum ${typeStr} Lamel ${normalizedColor}`;

  let matchingLamel = lamelPrices.find((p) => p.description === searchPattern);

  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if (!matchingLamel && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    searchPattern = `${thickness} mm Alüminyum ${typeStr} Lamel ${normalizedColor}`;
    matchingLamel = lamelPrices.find((p) => p.description === searchPattern);
  }

  if (!matchingLamel) return [0, null];

  const selectedProduct = createSelectedProduct(
    matchingLamel,
    quantity,
    lamelGenisligi + " mm"
  );
  return [parseFloat(matchingLamel.price), selectedProduct];
};

export const findSubPartPrice = (
  prices: PriceItem[],
  subPart: string,
  color: string,
  lamelGenisligi: number
): [number, SelectedProduct | null] => {
  const subPartPrices = prices.filter(
    (p) => p.type === "panjur_alt_parça_profilleri"
  );
  let normalizedColor = normalizeColor(color);

  const subPartType = subPart.split("_")[0];
  const normalizedSubPart =
    subPartType.charAt(0).toUpperCase() + subPartType.slice(1).toLowerCase();

  let searchPattern = `${normalizedSubPart} Alt Parça ${normalizedColor}`;

  let matchingSubPart = subPartPrices.find(
    (p) => p.description === searchPattern
  );

  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if (!matchingSubPart && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    searchPattern = `${normalizedSubPart} Alt Parça ${normalizedColor}`;
    matchingSubPart = subPartPrices.find(
      (p) => p.description === searchPattern
    );
  }

  if (!matchingSubPart) return [0, null];

  const selectedProduct = createSelectedProduct(
    matchingSubPart,
    1,
    lamelGenisligi + " mm"
  );
  return [parseFloat(matchingSubPart.price), selectedProduct];
};

export const findDikmePrice = (
  prices: PriceItem[],
  dikmeType: string,
  color: string,
  quantity: number,
  dikmeHeight: number
): [number, SelectedProduct | null] => {
  const dikmePrices = prices.filter(
    (p) => p.type === "panjur_dikme_profilleri"
  );
  let normalizedColor = normalizeColor(color);

  const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
  const dikmeWidth = dikmeType.startsWith("mini_") ? "53" : "60";

  let searchPattern = `${typePrefix} Dikme ${dikmeWidth} mm ${normalizedColor}`;

  let matchingDikme = dikmePrices.find((p) => p.description === searchPattern);

  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if (!matchingDikme && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    searchPattern = `${typePrefix} Dikme ${dikmeWidth} mm ${normalizedColor}`;
    matchingDikme = dikmePrices.find((p) => p.description === searchPattern);
  }

  if (!matchingDikme) return [0, null];

  const selectedProduct = createSelectedProduct(
    matchingDikme,
    quantity,
    dikmeHeight + " mm"
  );
  return [parseFloat(matchingDikme.price), selectedProduct];
};

export const findBoxPrice = (
  prices: PriceItem[],
  boxType: string,
  color: string,
  systemWidth: number
): {
  frontPrice: number;
  backPrice: number;
  selectedFrontBox?: SelectedProduct;
  selectedBackBox?: SelectedProduct;
} => {
  const boxPrices = prices.filter((p) => p.type === "kutu_profilleri");
  let normalizedColor = normalizeColor(color);

  // Convert box type (e.g., "137mm" to "137")
  const boxSize = boxType.replace("mm", "");

  // Search patterns for front and back box profiles
  let frontPattern = `${boxSize} - ÖN 45 Alüminyum Kutu ${normalizedColor}`;
  let backPattern = `${boxSize} - ARKA 90 Alüminyum Kutu ${normalizedColor}`;

  let matchingFrontBox = boxPrices.find((p) => p.description === frontPattern);
  let matchingBackBox = boxPrices.find((p) => p.description === backPattern);

  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if ((!matchingFrontBox || !matchingBackBox) && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    frontPattern = `${boxSize} - ÖN 45 Alüminyum Kutu ${normalizedColor}`;
    backPattern = `${boxSize} - ARKA 90 Alüminyum Kutu ${normalizedColor}`;
    if (!matchingFrontBox) {
      matchingFrontBox = boxPrices.find((p) => p.description === frontPattern);
    }
    if (!matchingBackBox) {
      matchingBackBox = boxPrices.find((p) => p.description === backPattern);
    }
  }

  return {
    frontPrice: matchingFrontBox ? parseFloat(matchingFrontBox.price) : 0,
    backPrice: matchingBackBox ? parseFloat(matchingBackBox.price) : 0,
    selectedFrontBox: matchingFrontBox
      ? createSelectedProduct(matchingFrontBox, 1, systemWidth + " mm")
      : undefined,
    selectedBackBox: matchingBackBox
      ? createSelectedProduct(matchingBackBox, 1, systemWidth + " mm")
      : undefined,
  };
};

export const findSmartHomePrice = (
  prices: PriceItem[],
  smartHomeType: string | undefined
): [number, SelectedProduct | null] => {
  if (smartHomeType === "yok" || smartHomeType === "") return [0, null];
  const smarthomePrices = prices.filter(
    (price) => price.type.toLowerCase() === "akilli_ev_sistemleri"
  );
  const searchKey =
    smartHomeType === "mosel_dd_7002_b"
      ? "Mosel DD 7002 B"
      : "Somfy TAHOMA SWİTCH Pro";
  const smarthomeItem = smarthomePrices.find((price) =>
    price.description.includes(searchKey)
  );

  if (!smarthomeItem) return [0, null];

  const smarthomePrice = parseFloat(smarthomeItem.price);
  const smarthomeSelectedProduct = createSelectedProduct(smarthomeItem, 1);

  return [smarthomePrice, smarthomeSelectedProduct];
};

export const calculateSystemWidth = (
  width: number,
  dikmeOlcuAlmaSekli: string,
  dikmeType: string
): number => {
  const dikmeGenisligi = getDikmeGenisligi(dikmeType);
  let systemWidth = width;

  switch (dikmeOlcuAlmaSekli) {
    case "dikme_haric":
      systemWidth = width + 2 * dikmeGenisligi - 10;
      break;
    case "tek_dikme":
      systemWidth = width + dikmeGenisligi - 10;
      break;
    case "dikme_dahil":
      systemWidth = width - 10;
      break;
  }

  return systemWidth;
};

export const calculateSystemHeight = (
  height: number,
  kutuOlcuAlmaSekli: string,
  boxType: string
): number => {
  const kutuYuksekligi = getBoxHeight(boxType);
  return kutuOlcuAlmaSekli === "kutu_haric" ? height + kutuYuksekligi : height;
};

export const calculateLamelCount = (
  systemHeight: number,
  boxType: string,
  lamelTickness: string
): number => {
  const kutuYuksekligi = getBoxHeight(boxType);
  const lamelHeight = Number(lamelTickness.split("_")[0]);
  const dikmeYuksekligiKertmeHaric = systemHeight - kutuYuksekligi;
  const lamelSayisi = Math.ceil(dikmeYuksekligiKertmeHaric / lamelHeight);
  console.log({
    kutuYuksekligi,
    dikmeYuksekligiKertmeHaric,
    lamelHeight,
    lamelSayisi,
  });
  return lamelSayisi + 1;
};

export const calculateLamelGenisligi = (
  systemWidth: number,
  dikmeType: string
): number => {
  const lamelDusmeValue = getLamelDusmeValue(dikmeType);
  return systemWidth - lamelDusmeValue;
};

export const calculateDikmeHeight = (
  systemHeight: number,
  boxType: string,
  dikmeType: string
): number => {
  if (dikmeType.includes("orta")) return 0;

  const kutuYuksekligi = getBoxHeight(boxType);
  const kertmePayi = getKertmePayi(dikmeType);
  return systemHeight - kutuYuksekligi + kertmePayi;
};

// Türkçe karakter dönüşümlerini yapan yardımcı fonksiyon
const turkishToAscii = (text: string): string => {
  const charMap: { [key: string]: string } = {
    ı: "i",
    ğ: "g",
    ü: "u",
    ş: "s",
    ö: "o",
    ç: "c",
    İ: "I",
    Ğ: "G",
    Ü: "U",
    Ş: "S",
    Ö: "O",
    Ç: "C",
  };
  return text
    .toLowerCase()
    .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (char) => charMap[char] || char);
};

// Kumanda model isimlerini normalize eden fonksiyon
const normalizeRemoteName = (remoteName: string): string => {
  // Önce alt çizgileri boşluğa çeviriyoruz
  const spaced = remoteName.replace(/_/g, " ");
  // Kelimelerin ilk harflerini büyük yapıyoruz
  const capitalized = spaced
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return capitalized;
};

export const findRemotePrice = (
  prices: PriceItem[],
  remote: string | undefined
): [number, SelectedProduct | null] => {
  if (!remote) return [0, null];

  // Otomasyon kumandalarını filtrele
  const remotePrices = prices.filter((p) => p.type === "otomasyon_kumandalar");

  const normalizedSearchName = normalizeRemoteName(remote);

  // Kumandayı bul
  const matchingRemote = remotePrices.find((p) => {
    // Hem orijinal stringi hem de ascii versiyonunu kontrol et
    const description = p.description || "";
    const normalizedDesc = turkishToAscii(description);
    const normalizedSearch = turkishToAscii(normalizedSearchName);

    return (
      normalizedDesc.includes(normalizedSearch) ||
      description.includes(normalizedSearchName)
    );
  });

  if (!matchingRemote) {
    // console.log("Remote not found:", normalizedSearchName);
    return [0, null];
  }

  const selectedProduct = createSelectedProduct(matchingRemote, 1);
  return [parseFloat(matchingRemote.price), selectedProduct];
};

export const findReceiverPrice = (
  prices: PriceItem[],
  receiver: string | undefined,
  movementTab?: ProductTab
): [number, SelectedProduct | null] => {
  if (!receiver || receiver === "yok" || !movementTab) return [0, null];

  // Get receiver name from the movement tab's receiver field
  const receiverField = movementTab.content?.fields?.find(
    (field) => field.id === "receiver"
  );

  if (!receiverField?.options) return [0, null];

  // Find the option matching the selected receiver ID
  const receiverOption = receiverField.options.find(
    (option) => option.id === receiver
  );
  if (!receiverOption?.name) return [0, null];

  // Find matching receiver price in the price list
  const receiverPrices = prices.filter((p) => p.type === "otomasyon_alıcılar");
  const receiverItem = receiverPrices.find(
    (price) => price.description === receiverOption.name
  );

  if (!receiverItem) return [0, null];

  return [
    parseFloat(receiverItem.price),
    createSelectedProduct(receiverItem, 1),
  ];
};

// Tambur Profili fiyatı bulucu
export function findTamburProfiliAccessoryPrice(
  prices: PriceItem[],
  movementType: string,
  width: number
): [number, SelectedProduct | null] {
  const tamburType =
    movementType === "manuel"
      ? "40mm Sekizgen Boru 0,40"
      : "60mm Sekizgen Boru 0,60";
  const tambur = prices.find((acc) =>
    acc.description.toLowerCase().includes(tamburType.toLowerCase())
  );
  if (!tambur) return [0, null];
  // Tambur ölçüsü: motorlu ise width-80mm, manuel ise width-60mm
  const tamburWidth = movementType === "motorlu" ? width - 80 : width - 60;
  return [
    parseFloat(tambur.price),
    createSelectedProduct(tambur, 1, tamburWidth + " mm"),
  ];
}
