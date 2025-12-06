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

// Bölme genişliklerini hesaplayan yardımcı fonksiyon
export function findSectionWidths(
  middleBarPositions: number[],
  width: number
): number[] {
  let positions = [0, ...middleBarPositions, width];
  if (middleBarPositions.length === 0) {
    positions = [0, width];
  }
  return positions.slice(0, -1).map((pos, i) => positions[i + 1] - pos);
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
  movementType: "manuel" | "motorlu",
  optionId: string = "distan"
): number | null => {
  const boxSize = boxType.replace("mm", "");
  const lamelType = lamelTickness.split("_")[0];
  return (
    maxLamelHeights[optionId]?.[boxSize]?.[lamelType]?.[movementType] ?? null
  );
};

export const getDikmeGenisligi = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 53 : 62;
};

export const getLamelDusmeValue = (
  dikmeType: string,
  optionId: string,
  sectionIndex: number,
  totalSections: number
): number => {
  if (optionId === "monoblok") {
    // Monoblok için dikme tiplerini bölme pozisyonuna göre belirle
    let leftDikmeValue: number;
    let rightDikmeValue: number;

    // Sol dikme tipi
    if (sectionIndex === 0) {
      // İlk bölme: sol dikme yan (tam değer)
      leftDikmeValue = 43; // Yan dikme - tam değer
    } else {
      // Diğer bölmeler: sol dikme orta (yarı değer - paylaşımlı)
      leftDikmeValue = 40 / 2; // Orta dikme - yarı değer (20)
    }

    // Sağ dikme tipi
    if (sectionIndex === totalSections - 1) {
      // Son bölme: sağ dikme yan (tam değer)
      rightDikmeValue = 43; // Yan dikme - tam değer
    } else {
      // Diğer bölmeler: sağ dikme orta (yarı değer - paylaşımlı)
      rightDikmeValue = 40 / 2; // Orta dikme - yarı değer (20)
    }

    // İki dikmenin toplamı
    return leftDikmeValue + rightDikmeValue;
  }

  // Distan için mevcut hesaplama (dikme tipi dikkate alınarak)
  return dikmeType.startsWith("mini_") ? 74 : 90;
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
  size?: number
): SelectedProduct => {
  const sizeMetre = size ? size / 1000 : undefined;

  return {
    ...priceItem,
    quantity,
    totalPrice: sizeMetre
      ? sizeMetre * parseFloat(priceItem.price) * quantity
      : parseFloat(priceItem.price) * quantity,
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
    lamelGenisligi
  );
  return [parseFloat(matchingLamel.price), selectedProduct];
};

/**
 * Her bölmenin alt parça genişliğini middleBarPositions ve width ile hesaplar.
 * @param prices
 * @param subPart
 * @param color
 * @param middleBarPositions Bölme ayrım noktaları (mm cinsinden)
 * @param width Toplam genişlik (mm)
 * @returns Array<{ price: number, selectedProduct: SelectedProduct | null, width: number }>
 */
export const findSubPartPrice = (
  prices: PriceItem[],
  subPart: string,
  color: string,
  middleBarPositions: number[],
  width: number
): Array<{
  price: number;
  selectedProduct: SelectedProduct | null;
  width: number;
}> => {
  // Bölme genişliklerini hesapla
  const sectionWidths = findSectionWidths(middleBarPositions, width);
  return findSubPartPriceWithWidths(prices, subPart, color, sectionWidths);
};

export const findSubPartPriceWithWidths = (
  prices: PriceItem[],
  subPart: string,
  color: string,
  sectionWidths: number[]
): Array<{
  price: number;
  selectedProduct: SelectedProduct | null;
  width: number;
}> => {
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
  if (!matchingSubPart) {
    // Hiçbir bölme için alt parça bulunamazsa, hepsi null döner
    return Array(sectionWidths.length)
      .fill(0)
      .map(() => ({ price: 0, selectedProduct: null, width: 0 }));
  }

  // Her bölme için alt parça fiyatı ve ürününü oluştur
  return sectionWidths.map((sectionWidth, index) => {
    // Fiyatı: metre fiyatı * bölme genişliği (metre)
    const metreFiyati = parseFloat(matchingSubPart.price);
    const genislikMetre = sectionWidth / 1000;
    const price = Number((metreFiyati * genislikMetre).toFixed(2));
    const selectedProduct = createSelectedProduct(
      matchingSubPart,
      1,
      sectionWidth
    );

    // Bölme bilgisini ekle
    if (selectedProduct) {
      selectedProduct.description = `${selectedProduct.description} (Bölme ${
        index + 1
      })`;
      selectedProduct.totalPrice = price;
    }

    return {
      price,
      selectedProduct,
      width: sectionWidth,
    };
  });
};

export const findDikmePrice = (
  prices: PriceItem[],
  dikmeType: string,
  color: string,
  quantity: number,
  dikmeHeight: number,
  optionId: string,
  currentDikme: "Yan" | "Orta"
): [number, SelectedProduct | null] => {
  let dikmePrices: PriceItem[];
  let normalizedColor = normalizeColor(color);
  let searchPattern: string;
  let dikmeWidth: string;

  if (optionId === "monoblok") {
    // Monoblok için PVC dikme profilleri
    const pvcType =
      currentDikme === "Yan"
        ? "pvc_panjur_yan_dikme_profilleri"
        : "pvc_panjur_orta_dikme_profilleri";

    dikmePrices = prices.filter((p) => p.type === pvcType);

    // Monoblok için dikme genişlikleri: mini 39mm, midi 55mm
    dikmeWidth = dikmeType.startsWith("mini_") ? "39" : "55";

    const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
    searchPattern = `${typePrefix} Pvc ${currentDikme} Dikme ${dikmeWidth} mm ${normalizedColor}`;
  } else {
    // Distan (mevcut hesaplama)
    dikmePrices = prices.filter((p) => p.type === "panjur_dikme_profilleri");

    const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
    dikmeWidth = dikmeType.startsWith("mini_") ? "53" : "60";
    searchPattern = `${typePrefix} Dikme ${dikmeWidth} mm ${normalizedColor}`;
  }

  let matchingDikme = dikmePrices.find((p) => p.description === searchPattern);

  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if (!matchingDikme && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    if (optionId === "monoblok") {
      const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
      searchPattern = `${typePrefix} Pvc ${currentDikme} Dikme ${dikmeWidth} mm ${normalizedColor}`;
    } else {
      const typePrefix = dikmeType.startsWith("mini_") ? "Mini" : "Midi";
      searchPattern = `${typePrefix} Dikme ${dikmeWidth} mm ${normalizedColor}`;
    }
    matchingDikme = dikmePrices.find((p) => p.description === searchPattern);
  }

  if (!matchingDikme) return [0, null];

  // Monoblok için adet düzeltmesi
  let finalQuantity = quantity;
  if (optionId === "monoblok" && currentDikme === "Orta") {
    // Monoblok orta dikmeler 1 adet
    finalQuantity = 1;
  }

  const selectedProduct = createSelectedProduct(
    matchingDikme,
    finalQuantity,
    dikmeHeight
  );
  // Fiyat ölçüye göre hesaplanıyor (metre cinsinden yükseklik * adet)
  return [selectedProduct.totalPrice, selectedProduct];
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
  const boxPrices = prices.filter((p) => p.type === "panjur_kutu_profilleri");
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
      ? createSelectedProduct(matchingFrontBox, 1, systemWidth)
      : undefined,
    selectedBackBox: matchingBackBox
      ? createSelectedProduct(matchingBackBox, 1, systemWidth)
      : undefined,
  };
};

// Monoblok kutu parçası bulucu yardımcı fonksiyon
const findMonoblokBoxComponent = (
  prices: PriceItem[],
  componentName: string,
  normalizedColor: string,
  quantity: number,
  systemWidth: number
): { product: SelectedProduct | null; price: number } => {
  let component = prices.find(
    (p) => p.description === `${componentName} ${normalizedColor}`
  );

  // Eğer bulunamazsa Beyaz ile dene
  if (!component && normalizedColor !== "Beyaz") {
    component = prices.find((p) => p.description === `${componentName} Beyaz`);
  }

  if (!component) return { product: null, price: 0 };

  const product = createSelectedProduct(component, quantity, systemWidth);
  if (quantity > 1) {
    product.description = `${product.description} (${quantity} Adet)`;
    product.totalPrice = parseFloat(component.price) * quantity;
  }

  return { product, price: product.totalPrice };
};

export const findMonoblokBoxPrice = (
  prices: PriceItem[],
  boxType: string,
  color: string,
  systemWidth: number
): {
  totalPrice: number;
  selectedProducts: SelectedProduct[];
} => {
  const monoblokBoxPrices = prices.filter(
    (p) => p.type === "monoblok_panjur_kutu_profilleri"
  );
  const normalizedColor = normalizeColor(color);
  const boxSize = boxType.replace("mm", "");

  const selectedProducts: SelectedProduct[] = [];
  let totalPrice = 0;

  // Kutu konfigürasyonları
  const configs: Record<string, Array<{ name: string; quantity: number }>> = {
    "185x220": [
      { name: "165 Kutu Kapak", quantity: 2 },
      { name: "200 Kutu Kapak", quantity: 1 },
      { name: "200 Kutu Alt Kapak", quantity: 1 },
      { name: "Kutu Tampon Çıtası", quantity: 1 },
      { name: "165 mm Yalıtım Beyaz", quantity: 1 },
    ],
    "185": [
      { name: "165 Kutu Kapak", quantity: 3 },
      { name: "165 Kutu Alt Kapak", quantity: 1 },
      { name: "Kutu Tampon Çıtası", quantity: 1 },
    ],
    "220": [
      { name: "200 Kutu Kapak", quantity: 3 },
      { name: "200 Kutu Alt Kapak", quantity: 1 },
      { name: "Kutu Tampon Çıtası", quantity: 1 },
    ],
    "220x255": [
      { name: "235 Kutu Kapak Yalıtımlı", quantity: 1 },
      { name: "235 Kutu Alt Kapak Yalıtımlı", quantity: 1 },
      { name: "200 Kutu Kapak", quantity: 2 },
      { name: "Kutu Tampon Çıtası", quantity: 1 },
      { name: "200 mm Yalıtım Beyaz", quantity: 1 },
    ],
  };

  const config = configs[boxSize];
  if (config) {
    config.forEach(({ name, quantity }) => {
      // Yalıtım parçaları için renk kontrolü yapma (her zaman Beyaz)
      const useColor = name.includes("Yalıtım") ? "Beyaz" : normalizedColor;
      const { product, price } = findMonoblokBoxComponent(
        monoblokBoxPrices,
        name,
        useColor,
        quantity,
        systemWidth
      );

      if (product) {
        selectedProducts.push(product);
        totalPrice += price;
      }
    });
  }

  return {
    totalPrice,
    selectedProducts,
  };
};

export const findYalitimliBoxPrice = (
  prices: PriceItem[],
  boxType: string,
  boxColor: string,
  systemWidth: number,
  boxsetType?: string
): {
  totalPrice: number;
  selectedProducts: SelectedProduct[];
} => {
  // Sadece yalıtımlı kutu profilleri
  const yalitimliBoxPrices = prices.filter(
    (p) => p.type === "yalitimli_panjur_kutu_profilleri"
  );
  const normalizedColor = normalizeColor(boxColor);
  const selectedProducts: SelectedProduct[] = [];
  let totalPrice = 0;

  // Kutu konfigürasyonları
  const configs: Record<
    string,
    Array<{ name: string; needsColor: boolean }>
  > = {
    "250mm_ithal": [
      { name: "25x25 Strafor Kutu İthal", needsColor: false },
      // emptyBox ise alt kapama ekleme
      ...(boxsetType === "emptyBox" ? [] : [{ name: "25x25 Strafor Kutu Alt Kapama", needsColor: true }]),
    ],
    "250mm_yerli": [
      { name: "25x25 Eps Panjur Kutusu Yerli", needsColor: false },
      // emptyBox ise alt kapama ekleme
      ...(boxsetType === "emptyBox" ? [] : [{ name: "25x25 Strafor Kutu Alt Kapama", needsColor: true }]),
    ],
    "300mm_yerli": [
      { name: "30x30 Eps Panjur Kutusu Yerli", needsColor: false },
      // emptyBox ise alt kapama ekleme
      ...(boxsetType === "emptyBox" ? [] : [{ name: "30x30 Strafor Kutu Alt Kapama", needsColor: true }]),
    ],
    "300mm_ithal": [
      { name: "30x30 Strafor Kutu İthal", needsColor: false },
      // emptyBox ise alt kapama ekleme
      ...(boxsetType === "emptyBox" ? [] : [{ name: "30x30 Strafor Kutu Alt Kapama", needsColor: true }]),
    ],
  };

  const config = configs[boxType];
  if (config) {
    config.forEach(({ name, needsColor }) => {
      // needsColor true ise renk ekle
      const searchName = needsColor ? `${name} ${normalizedColor}` : name;
      let productItem = yalitimliBoxPrices.find(
        (p) =>
          p.description.trim().toLowerCase() === searchName.trim().toLowerCase()
      );
      // Eğer bulunamazsa Beyaz ile dene
      if (!productItem && normalizedColor !== "Beyaz" && needsColor) {
        productItem = yalitimliBoxPrices.find(
          (p) =>
            p.description.trim().toLowerCase() ===
            `${name} Beyaz`.trim().toLowerCase()
        );
      }
      if (productItem) {
        const product = createSelectedProduct(productItem, 1, systemWidth);
        selectedProducts.push(product);
        totalPrice += product.totalPrice;
      }
    });
  }

  return {
    totalPrice,
    selectedProducts,
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

  return lamelSayisi + 1;
};

export const calculateLamelGenisligi = (
  systemWidth: number,
  dikmeType: string,
  optionId: string,
  sectionIndex: number,
  totalSections: number
): number => {
  const lamelDusmeValue = getLamelDusmeValue(
    dikmeType,
    optionId,
    sectionIndex,
    totalSections
  );
  return systemWidth + 10 - lamelDusmeValue;
};

export const calculateDikmeHeight = (
  systemHeight: number,
  boxType: string,
  dikmeType: string,
  optionId: string
): number => {
  const kutuYuksekligi = getBoxHeight(boxType);

  // Monoblok için kertme payı ekleme
  if (optionId === "monoblok") {
    return systemHeight - kutuYuksekligi;
  }

  // Distan ve yalıtımlı için kertme payı ekle
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

  // Hem panjur (otomasyon_kumandalar) hem de kepenk (kepenk_kumandalar) kumandalarını filtrele
  const remotePrices = prices.filter(
    (p) => p.type === "otomasyon_kumandalar" || p.type === "kepenk_kumandalar"
  );

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

  // Hem panjur (otomasyon_alıcılar) hem de kepenk (kepenk_alicilar) alıcılarını filtrele
  const receiverPrices = prices.filter(
    (p) => p.type === "otomasyon_alıcılar" || p.type === "kepenk_alicilar"
  );
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
  const selectedProduct = createSelectedProduct(tambur, 1, tamburWidth);
  // Fiyat ölçüye göre hesaplanıyor (metre cinsinden)
  const calculatedPrice = selectedProduct.totalPrice;
  return [calculatedPrice, selectedProduct];
}

export const findYukseltmeProfiliPrice = (
  prices: PriceItem[],
  dikmeColor: string,
  quantity: number,
  systemHeight: number
): [number, SelectedProduct | null] => {
  const yukseltmeProfiliPrices = prices.filter(
    (p) => p.type === "sineklik_profilleri"
  );
  let normalizedColor = normalizeColor(dikmeColor);
  let matchingProfili = yukseltmeProfiliPrices.find((p) =>
    p.description.toLowerCase().includes(normalizedColor.toLowerCase())
  );
  // Eğer bulunamazsa, Beyaz ile tekrar dene
  if (!matchingProfili && normalizedColor !== "Beyaz") {
    normalizedColor = "Beyaz";
    matchingProfili = yukseltmeProfiliPrices.find((p) =>
      p.description.includes(normalizedColor)
    );
  }
  if (!matchingProfili) return [0, null];

  const selectedProduct = createSelectedProduct(
    matchingProfili,
    quantity,
    systemHeight
  );
  // Fiyat ölçüye göre hesaplanıyor (metre cinsinden yükseklik * adet)
  return [selectedProduct.totalPrice, selectedProduct];
};

// En geniş bölmenin genişliğini hesaplayan fonksiyon
export const calculateMaxSectionWidth = (
  totalWidth: number,
  middleBarPositions: number[]
): number => {
  if (middleBarPositions.length === 0) {
    return totalWidth;
  }
  const sectionWidths = findSectionWidths(middleBarPositions, totalWidth);
  return Math.max(...sectionWidths);
};
