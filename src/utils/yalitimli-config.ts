import { PanjurSelections, SelectedProduct } from "@/types/panjur";

// Yalıtımlı panjur konfigürasyonu
export type YalitimliConfig = {
  includedPrices: string[];
  excludedAccessoryKeywords: string[];
  includedProducts: string[];
  accessoryIncludeKeywords?: string[];
};

// Ürün tip sıralama konfigürasyonu
export type ProductSortConfig = {
  typeOrder: string[];
};

// Ürünlere göre sıralama konfigürasyonları
export const productSortConfigs: Record<string, ProductSortConfig> = {
  panjur: {
    typeOrder: [
      "panjur_kutu_profilleri",
      "panjur_lamel_profilleri",
      "panjur_alt_parça_profilleri",
      "panjur_dikme_profilleri",
      "panjur_tambur_boru_profilleri",
    ],
  },
  sineklik: {
    typeOrder: [
      "sineklik_profilleri",
      "sineklik_kasa_profilleri",
      "sineklik_kanat_profilleri",
    ],
  },
  pencere: {
    typeOrder: [
      "pencere_profilleri",
      "pencere_kasa_profilleri",
      "pencere_kanat_profilleri",
    ],
  },
  kapi: {
    typeOrder: [
      "kapi_profilleri",
      "kapi_kasa_profilleri",
      "kapi_kanat_profilleri",
    ],
  },
};

export const yalitimliConfigs: Record<string, YalitimliConfig> = {
  boxWithMotor: {
    includedPrices: ["tambur", "box"],
    excludedAccessoryKeywords: [],
    includedProducts: ["box", "tambur"],
  },
  emptyBox: {
    includedPrices: ["box"],
    excludedAccessoryKeywords: [],
    includedProducts: ["box"],
    accessoryIncludeKeywords: [
      "yan kapak",
      "orta kapak",
      "fullset t sac",
      "pimli galvaniz",
    ],
  },
  detail_withoutBox: {
    includedPrices: [
      "lamel",
      "subPart",
      "dikme",
      "yukseltmeProfili",
      "remote",
      "smarthome",
      "receiver",
    ],
    excludedAccessoryKeywords: [
      "kutu",
      "tambur",
      "boru",
      "motor",
      "makara",
      "kasnak",
      "yan kapak",
      "orta kapak",
      "fullset t sac",
      "pimli galvaniz",
    ],
    includedProducts: [
      "lamel",
      "subPart",
      "dikme",
      "yukseltmeProfili",
      "remote",
      "smarthome",
      "receiver",
    ],
  },
  detail_onlyMotor: {
    includedPrices: [
      "lamel",
      "subPart",
      "dikme",
      "tambur",
      "yukseltmeProfili",
      "remote",
      "smarthome",
      "receiver",
    ],
    excludedAccessoryKeywords: [
      "kutu",
      "yan kapak",
      "orta kapak",
      "fullset t sac",
      "pimli galvaniz",
    ],
    includedProducts: [
      "lamel",
      "subPart",
      "dikme",
      "tambur",
      "yukseltmeProfili",
      "remote",
      "smarthome",
      "receiver",
    ],
  },
};

export const getYalitimliConfigKey = (
  values: PanjurSelections
): string | null => {
  if (values.boxsetType === "boxWithMotor") return "boxWithMotor";
  if (values.boxsetType === "emptyBox") return "emptyBox";
  if (values.yalitimliType === "detail") {
    if (values.yalitimliDetailType === "withoutBox") return "detail_withoutBox";
    if (values.yalitimliDetailType === "onlyMotor") return "detail_onlyMotor";
  }
  return null;
};

export const filterYalitimliAccessories = (
  config: YalitimliConfig,
  accessoryItems: SelectedProduct[]
): SelectedProduct[] => {
  return accessoryItems.filter((acc) => {
    const description = acc.description.toLowerCase();

    // Eğer sadece belirli anahtar kelimeler dahil edilecekse
    if (
      config.accessoryIncludeKeywords &&
      config.accessoryIncludeKeywords.length > 0
    ) {
      return config.accessoryIncludeKeywords.some((keyword) =>
        description.includes(keyword)
      );
    }

    // Eğer belirli anahtar kelimeler hariç tutulacaksa
    if (config.excludedAccessoryKeywords.length > 0) {
      return !config.excludedAccessoryKeywords.some((keyword) =>
        description.includes(keyword)
      );
    }

    return true;
  });
};

type PriceComponents = {
  totalLamelPrice: number;
  subPartPrice: number;
  totalDikmePrice: number;
  boxPrice: number;
  tamburPrice: number;
  yukseltmeProfiliPrice: number;
  remotePrice: number;
  smarthomePrice: number;
  receiverPrice: number;
};

export const calculateYalitimliPrice = (
  config: YalitimliConfig,
  priceComponents: PriceComponents,
  accessoryItems?: SelectedProduct[]
): number => {
  const {
    totalLamelPrice,
    subPartPrice,
    totalDikmePrice,
    boxPrice,
    tamburPrice,
    yukseltmeProfiliPrice,
    remotePrice,
    smarthomePrice,
    receiverPrice,
  } = priceComponents;

  const priceMap: Record<string, number> = {
    lamel: totalLamelPrice,
    subPart: subPartPrice,
    dikme: totalDikmePrice,
    box: boxPrice,
    tambur: tamburPrice,
    yukseltmeProfili: yukseltmeProfiliPrice,
    remote: remotePrice,
    smarthome: smarthomePrice,
    receiver: receiverPrice,
  };

  let totalPrice = 0;
  config.includedPrices.forEach((priceKey) => {
    totalPrice += priceMap[priceKey] || 0;
  });

  // Aksesuarları filtrele ve ekle
  const filteredAccessories = filterYalitimliAccessories(
    config,
    accessoryItems || []
  );
  totalPrice += filteredAccessories.reduce(
    (total: number, acc: SelectedProduct) => total + acc.totalPrice,
    0
  );

  return totalPrice;
};

// Ürüne göre sıralama konfigürasyonu al
export const getProductSortConfig = (productId: string): string[] => {
  const config = productSortConfigs[productId];
  if (!config) {
    // Default sıralama
    return [
      "panjur_kutu_profilleri",
      "panjur_lamel_profilleri",
      "panjur_alt_parça_profilleri",
      "panjur_dikme_profilleri",
      "sineklik_profilleri",
      "panjur_tambur_boru_profilleri",
    ];
  }
  return config.typeOrder;
};
