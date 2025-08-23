import { PriceItem } from "@/types/panjur";
import { normalizeColor } from "@/utils/panjur";

// Yan Kapak fiyatı bulucu
export function findYanKapakAccessoryPrice(
  accessories: PriceItem[],
  boxType: string,
  boxColor: string
): PriceItem | null {
  let desc = "";
  console.log({ boxType, boxColor });
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
): PriceItem[] {
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
      return found ? { ...found, quantity: item.quantity } : null;
    })
    .filter(Boolean) as PriceItem[];
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
