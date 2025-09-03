import { PriceItem, SelectedProduct } from "@/types/panjur";
import { createSelectedProduct, normalizeColor } from "./panjur";

// Yan Kapak fiyatı bulucu
export function findYanKapakAccessoryPrice(
  accessories: PriceItem[],
  boxType: string,
  boxColor: string
): PriceItem | null {
  let desc = "";
  switch (boxType) {
    case "137mm":
      desc = `137 Yan Kapak 45 Pimli ${normalizeColor(boxColor)}`;
      break;
    case "165mm":
      desc = `165 Yan Kapak 45 Pimli ${normalizeColor(boxColor)}`;
      break;
    case "205mm":
      desc = `205 Yan Kapak 45 Pimli ${normalizeColor(boxColor)}`;
      break;
    case "250mm":
      desc = `250 Yan Kapak 45 Motor ${normalizeColor(boxColor)}`;
      break;
    default:
      return null;
  }
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes(desc.toLowerCase())
    ) || null
  );
}

// Boru Başı fiyatı bulucu (motorlu/manuel)
export function findBoruBasiAccessoryPrice(
  accessories: PriceItem[],
  movementType: string
): PriceItem | null {
  if (movementType === "motorlu") {
    return (
      accessories.find((acc) =>
        acc.description.toLowerCase().includes("60 boru başı rulmanlı siyah")
      ) || null
    );
  } else {
    return (
      accessories.find((acc) =>
        acc.description.toLowerCase().includes("40 boru başı rulmanlı siyah")
      ) || null
    );
  }
}

// Rulman fiyatı bulucu
export function findRulmanAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("rulman 12x28")
    ) || null
  );
}

// Plaket fiyatı bulucu (sadece 250mm kutu ve motorlu)
export function findPlaketAccessoryPrice(
  accessories: PriceItem[],
  boxType: string,
  movementType: string
): PriceItem | null {
  if (boxType === "250mm" && movementType === "motorlu") {
    return (
      accessories.find((acc) =>
        acc.description
          .toLowerCase()
          .includes("plaket 100x100 12 mm pimli galvaniz")
      ) || null
    );
  }
  return null;
}

// Kasnak fiyatı bulucu (makaralı manuel)
export function findKasnakAccessoryPrice(
  accessories: PriceItem[],
  boxType: string
): PriceItem | null {
  const kasnakDesc =
    boxType === "137mm"
      ? "40x125 kasnak rulmanlı siyah"
      : "40x140 kasnak rulmanlı siyah";
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes(kasnakDesc.toLowerCase())
    ) || null
  );
}

// Winde Otomatik Makara fiyatı bulucu
export function findWindeMakaraAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("winde otomatik makara")
    ) || null
  );
}

// Kordon Geçme Makara fiyatı bulucu
export function findKordonMakaraAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("kordon geçme makarası 14 mm pvc")
    ) || null
  );
}

// Redüktörlü aksesuarlar için isimle bulucu
export function findAccessoryByName(
  accessories: PriceItem[],
  name: string
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes(name.toLowerCase())
    ) || null
  );
}

// PVC Tapa fiyatı bulucu
export function findPvcTapaAccessoryPrice(
  accessories: PriceItem[],
  dikmeType: string
): PriceItem | null {
  const tapaType = dikmeType.startsWith("mini_") ? "SL-39" : "SL-55";
  const searchTapaKey = `pvc tapa ${tapaType}`.toLowerCase();
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes(searchTapaKey)
    ) || null
  );
}

// Zımba Teli fiyatı bulucu
export function findZimbaTeliAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("zımba teli 5")
    ) || null
  );
}

// Çelik Askı fiyatı bulucu
export function findCelikAskiAccessoryPrice(
  accessories: PriceItem[],
  dikmeType: string
): PriceItem | null {
  const askiType = dikmeType.startsWith("mini_")
    ? "130 mm ( SL 39 )"
    : "170 mm ( SL 55 )";
  return (
    accessories.find((acc) =>
      acc.description
        .toLowerCase()
        .includes(`çelik askı ${askiType}`.toLowerCase())
    ) || null
  );
}

// Alt Parça Lastiği fiyatı bulucu
export function findAltParcaLastigiAccessoryPrice(
  accessories: PriceItem[],
  dikmeType: string
): PriceItem | null {
  const lastikType = dikmeType.startsWith("mini_")
    ? "39'luk alt parça lastiği gri"
    : "55'lik alt parça lastiği gri";
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes(lastikType.toLowerCase())
    ) || null
  );
}

// Stoper Konik fiyatı bulucu
export function findStoperKonikAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("stoper konik")
    ) || null
  );
}

// Kilitli Alt Parça aksesuarları bulucu
export function findKilitliAltParcaAccessories(
  accessories: PriceItem[]
): PriceItem[] {
  const names = [
    "alt parça sürgüsü yuvarlak galvaniz",
    "alt parça sürgüsü yassı galvaniz",
  ];
  return names
    .map(
      (name) =>
        accessories.find((acc) =>
          acc.description.toLowerCase().includes(name)
        ) || null
    )
    .filter(Boolean) as PriceItem[];
}

// Lamel Denge Makarası bulucu
export function findDengeMakarasiAccessoryPrice(
  accessories: PriceItem[]
): PriceItem | null {
  return (
    accessories.find((acc) =>
      acc.description.toLowerCase().includes("55'lik lamel denge makarası")
    ) || null
  );
}

// Mini dikme aksesuarları bulucu
export function findMiniDikmeAccessories(
  accessories: PriceItem[],
  dikmeCount: number,
  movementType: string,
  makaraliTip: string
): SelectedProduct[] {
  // Sadece movementType manuel ve makaraliTip makasli ise ekle
  if (movementType !== "manuel" || makaraliTip !== "makasli") {
    return [];
  }
  const names = [
    { name: "panjur dikme makası", quantity: dikmeCount },
    { name: "panjur dikme menteşesi", quantity: dikmeCount },
  ];
  return names
    .map((item) => {
      const found = accessories.find((acc) =>
        acc.description.toLowerCase().includes(item.name)
      );
      return found ? createSelectedProduct(found, item.quantity) : null;
    })
    .filter(Boolean) as SelectedProduct[];
}

export const findMotorPrice = (
  prices: PriceItem[],
  movementType: "manuel" | "motorlu",
  motorMarka?: string,
  motorModel?: string,
  motorSekli?: string
): PriceItem | null => {
  if (movementType !== "motorlu" || !motorMarka || !motorModel || !motorSekli)
    return null;

  const motorPrices = prices.filter(
    (price) => price.type.toLowerCase() === "panjur_motorlari"
  );

  const motorType = motorSekli.startsWith("alicili_")
    ? "Alıcılı Motor"
    : "Motor";
  const searchKey = `${motorMarka} ${motorModel.replace(
    /_/g,
    " "
  )} ${motorType}`.toLowerCase();

  const motorItem = motorPrices.find((price) =>
    price.description.toLowerCase().includes(searchKey)
  );

  return motorItem ?? null;
};

// Monoblok Yan Kapak fiyatı bulucu
export function findMonoblokYanKapakAccessoryPrice(
  accessories: PriceItem[],
  boxColor: string,
  boxType: string
): SelectedProduct[] {
  const results: SelectedProduct[] = [];
  const boxSize = boxType.replace("mm", "");

  // Yan kapak konfigürasyonları
  const configs: Record<string, Array<{ name: string; quantity: number }>> = {
    "185": [
      { name: "Yan Kapak 185mm (izolasyonsuz) Sağ", quantity: 1 },
      { name: "Yan Kapak 185mm (izolasyonsuz) Sol", quantity: 1 },
    ],
    "185x220": [
      { name: "Yan Kapak 185x220mm (izolasyonlu) Sağ", quantity: 1 },
      { name: "Yan Kapak 185x220mm (izolasyonlu) Sol", quantity: 1 },
    ],
    "220": [
      { name: "Yan kapak 220mm (izolasyonsuz) Sağ", quantity: 1 },
      { name: "Yan kapak 220mm (izolasyonsuz) Sol", quantity: 1 },
    ],
    "220x255": [
      { name: "Yan kapak 220x255mm (izolasyonlu) Sağ", quantity: 1 },
      { name: "Yan kapak 220x255mm (izolasyonlu) Sol", quantity: 1 },
    ],
  };

  const config = configs[boxSize];
  if (config) {
    config.forEach(({ name, quantity }) => {
      const accessory = accessories.find((acc) =>
        acc.description.includes(name)
      );
      if (accessory && quantity > 0) {
        const selectedProduct = createSelectedProduct(accessory, quantity);
        results.push(selectedProduct);
      }
    });
  }

  return results;
}

// Monoblok aksesuar parçası bulucu yardımcı fonksiyon
const findMonoblokAccessoryComponent = (
  accessories: PriceItem[],
  componentName: string,
  normalizedColor: string,
  quantity: number,
  needsColor: boolean = false
): SelectedProduct | null => {
  // Quantity 0 ise ekleme
  if (quantity === 0) {
    return null;
  }

  let searchPattern: string;

  if (needsColor) {
    // Renk kontrolü gereken aksesuarlar
    searchPattern = `${componentName} ${normalizedColor}`;
    let accessory = accessories.find((acc) =>
      acc.description.includes(searchPattern)
    );

    // Bulamazsa Beyaz ile dene
    if (!accessory && normalizedColor !== "Beyaz") {
      searchPattern = `${componentName} Beyaz`;
      accessory = accessories.find((acc) =>
        acc.description.includes(searchPattern)
      );
    }

    if (accessory) {
      return createSelectedProduct(accessory, quantity);
    }
  } else {
    // Renksiz aksesuarlar
    const accessory = accessories.find((acc) =>
      acc.description.includes(componentName)
    );
    if (accessory) {
      return createSelectedProduct(accessory, quantity);
    }
  }

  return null;
};

// Monoblok Ek Aksesuarları bulucu
export function findMonoblokEkAksesuarlar(
  accessories: PriceItem[],
  boxType: string,
  boxColor: string,
  dikmeCount: number
): SelectedProduct[] {
  const results: SelectedProduct[] = [];
  const normalizedColor = normalizeColor(boxColor);
  const boxSize = boxType.replace("mm", "");
  const middleDikmeCount = dikmeCount - 2;
  // Aksesuar konfigürasyonları
  const configs: Record<
    string,
    Array<{ name: string; quantity: number; needsColor: boolean }>
  > = {
    "185": [
      { name: "Dış Kapak 185mm", quantity: 2, needsColor: true },
      { name: "İç Kapak 185mm", quantity: 2, needsColor: true },
      { name: "Yan Kapak Sürgüsü 185mm", quantity: 2, needsColor: false },
      {
        name: "Orta Kapak İç Soketi Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Orta Kapak 185mm Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 185mm / 40 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 185mm / 60 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "185x220": [
      { name: "Dış Kapak 185mm", quantity: 2, needsColor: true },
      { name: "İç Kapak 185x220mm", quantity: 2, needsColor: true },
      { name: "Yan Kapak Sürgüsü 185mm", quantity: 2, needsColor: false },
      {
        name: "Orta Kapak İç Soketi Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Orta Kapak 185mm Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 185mm / 40 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 185mm / 60 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "220": [
      { name: "Dış Kapak 220mm", quantity: 2, needsColor: true },
      { name: "İç Kapak 220mm", quantity: 2, needsColor: true },
      { name: "Yan Kapak Sürgüsü 220mm", quantity: 2, needsColor: false },
      {
        name: "Orta Kapak İç Soketi Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Orta Kapak 220mm Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 220mm / 40 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 220mm / 60 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "220x255": [
      { name: "Dış Kapak 220mm", quantity: 2, needsColor: true },
      { name: "İç Kapak 220x255mm", quantity: 2, needsColor: true },
      { name: "Yan Kapak Sürgüsü 220mm", quantity: 2, needsColor: false },
      {
        name: "Orta Kapak İç Soketi Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Orta Kapak 220mm Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 220mm / 40 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
      {
        name: "Geçiş Soketi 220mm / 60 Beyaz",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
  };

  const config = configs[boxSize];
  if (config) {
    config.forEach(({ name, quantity, needsColor }) => {
      const accessoryItem = findMonoblokAccessoryComponent(
        accessories,
        name,
        normalizedColor,
        quantity,
        needsColor
      );

      if (accessoryItem) {
        results.push(accessoryItem);
      }
    });
  }

  return results;
}

// Yalıtımlı kutu ek aksesuarları bulucu
export function findYalitimliEkAksesuarlar(
  accessories: PriceItem[]
): SelectedProduct[] {
  const results: SelectedProduct[] = [];

  // Yalıtımlı kutu aksesuarları ile filtrele
  const yalitimliAccessories = accessories.filter(
    (acc) => acc.type === "yalitimli_panjur_kutu_aksesuarlari"
  );

  // 2 adet Fullset T Sac
  const fullsetTSac = yalitimliAccessories.find((acc) =>
    acc.description.includes("Fullset T Sac")
  );
  if (fullsetTSac) {
    const selectedProduct = createSelectedProduct(fullsetTSac, 2);
    results.push(selectedProduct);
  }

  // 1 adet Plaket 100x100 12 mm Pimli Galvaniz
  const plaket = yalitimliAccessories.find((acc) =>
    acc.description.includes("Plaket 100x100 12 mm Pimli Galvaniz")
  );
  if (plaket) {
    const selectedProduct = createSelectedProduct(plaket, 1);
    results.push(selectedProduct);
  }

  return results;
}

// Yalıtımlı kutu yan kapak aksesuarları bulucu
export function findYalitimliYanKapakAccessoryPrice(
  accessories: PriceItem[],
  boxType: string,
  boxColor: string,
  dikmeCount: number
): SelectedProduct[] {
  const results: SelectedProduct[] = [];
  const normalizedColor = normalizeColor(boxColor);
  const middleDikmeCount = dikmeCount - 2;

  // Aksesuar konfigürasyonları
  const configs: Record<
    string,
    Array<{ name: string; quantity: number; needsColor: boolean }>
  > = {
    "250mm_ithal": [
      { name: "25x25 Yan Kapak Sac (Fullset)", quantity: 2, needsColor: false },
      {
        name: "25x25 Orta Kapak Sac Siyah",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "250mm_yerli": [
      { name: "25x25 Yan Kapak Sac (Fullset)", quantity: 2, needsColor: false },
      {
        name: "25x25 Orta Kapak Sac Siyah",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "300mm_ithal": [
      { name: "30x30 Yan Kapak Sac (Fullset)", quantity: 2, needsColor: false },
      {
        name: "30x30 Orta Kapak Sac Siyah",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
    "300mm_yerli": [
      { name: "30x30 Yan Kapak Sac (Fullset)", quantity: 2, needsColor: false },
      {
        name: "30x30 Orta Kapak Sac Siyah",
        quantity: middleDikmeCount,
        needsColor: false,
      },
    ],
  };

  const config = configs[boxType];
  if (config) {
    config.forEach(({ name, quantity, needsColor }) => {
      const accessoryItem = findMonoblokAccessoryComponent(
        accessories,
        name,
        normalizedColor,
        quantity,
        needsColor
      );
      if (accessoryItem) {
        results.push(accessoryItem);
      }
    });
  }

  return results;
}
