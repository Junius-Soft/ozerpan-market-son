import { PriceItem } from "@/types/panjur";
import { createSelectedProduct, normalizeColor } from "@/utils/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getMenteseliKasaKoseTakozuItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, menteseliOpeningType } = values;
  if (menteseliOpeningType === "disaAcilim") return undefined;

  const normalizedColor = normalizeColor(color);
  const takozStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378317031200"
    : "378317041200";

  const takoz = allAccessories.find((item) => {
    return item.stock_code === takozStockCode;
  });
  if (!takoz) return undefined;

  return createSelectedProduct(takoz, 4);
}

export function getMenteseliKanatTakozuItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const takozStockCode = "378317051200";

  const takoz = allAccessories.find((item) => {
    return item.stock_code === takozStockCode;
  });
  if (!takoz) return undefined;

  return createSelectedProduct(takoz, 4);
}

export function getMenteseliPencereMentesesiItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, menteseliOpeningType } = values;

  if (menteseliOpeningType === "iceAcilim") return undefined;

  const normalizedColor = normalizeColor(color);
  const menteseStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378332232000"
    : "378332251100";

  const mentese = allAccessories.find((item) => {
    return item.stock_code === menteseStockCode;
  });
  if (!mentese) return undefined;

  return createSelectedProduct(mentese, 4);
}

export function getMenteseliMiknatisItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { width, height, menteseliOpeningType } = values;

  if (menteseliOpeningType !== "iceAcilim") return undefined;

  const miknatisStockCode = "378322001100";
  const miknatis = allAccessories.find((item) => {
    return item.stock_code === miknatisStockCode;
  });
  if (!miknatis) return undefined;

  const measurement = (width * 4 + height * 2) / 1000;

  return createSelectedProduct(miknatis, 1, measurement);
}

export function getMenteseliFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const normalizedColor = normalizeColor(color);
  const fitilStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const size = (width + height) * 2;
  return createSelectedProduct(fitil, 1, size);
}

export function getMenteseliTulAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { width, height, tulType } = values;

  const tul = allAccessories.find((item) => {
    if (tulType === "normal") {
      return item.stock_code === "378212401900";
    }
    if (tulType === "kedi") {
      return item.stock_code === "378212701900";
    }
  });
  if (!tul) return undefined;

  // m² hesaplama - alan bazlı
  const areaM2 = (width * height) / 1_000_000;

  // m² bazlı fiyatlandırma
  const product = createSelectedProduct(tul, 1);
  // totalPrice'ı m² bazlı hesapla (price zaten m² fiyatı)
  product.totalPrice = Number((areaM2 * parseFloat(tul.price || "0")).toFixed(2));
  product.size = areaM2; // m² cinsinden sakla (gösterim için)
  return product;
}

export function getSabitTulAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { width, height, tulType } = values;

  const tul = allAccessories.find((item) => {
    if (tulType === "normal") {
      return item.stock_code === "378212401900";
    }
    if (tulType === "kedi") {
      return item.stock_code === "378212701900";
    }
  });
  if (!tul) return undefined;

  // m² hesaplama - alan bazlı
  const areaM2 = (width * height) / 1_000_000;

  // m² bazlı fiyatlandırma
  const product = createSelectedProduct(tul, 1);
  // totalPrice'ı m² bazlı hesapla (price zaten m² fiyatı)
  product.totalPrice = Number((areaM2 * parseFloat(tul.price || "0")).toFixed(2));
  product.size = areaM2; // m² cinsinden sakla (gösterim için)
  return product;
}

export function getSabitFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const normalizedColor = normalizeColor(color);
  const fitilStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const size = (width + height) * 2;
  return createSelectedProduct(fitil, 1, size);
}

export function getSabitKoseTakozuAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color } = values;

  const normalizedColor = normalizeColor(color);
  const takozStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378332101100"
    : "378332102000";

  const takoz = allAccessories.find((item) => {
    return item.stock_code === takozStockCode;
  });
  if (!takoz) return undefined;

  return createSelectedProduct(takoz, 4);
}

export function getPliseTulAccessoryItems(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem[] {
  const { width, height, tulType, pliseOpeningType, kasaType } = values;

  const items: PriceItem[] = [];

  const tul = allAccessories.find((item) => {
    if (tulType === "normal") {
      return item.stock_code === "378151200200";
    }

    if (tulType === "kedi") {
      return item.stock_code === "378212201900";
    }
  });

  if (!tul) return [];

  // m² hesaplama - tül katı yerine alan bazlı
  let areaM2: number;

  if (kasaType === "esiksiz") {
    // Eşiksiz kasa için alan hesaplama
    const effectiveWidth = width;
    const effectiveHeight = height - 31;
    areaM2 = (effectiveWidth * effectiveHeight) / 1_000_000;
  } else {
    // Normal kasa için alan hesaplama
    let effectiveWidth: number;
    let effectiveHeight: number;

    if (pliseOpeningType === "dikey") {
      effectiveWidth = width - 55;
      effectiveHeight = height;
    } else {
      effectiveWidth = width;
      effectiveHeight = height - 55;
    }
    areaM2 = (effectiveWidth * effectiveHeight) / 1_000_000;
  }

  // Double ve centralPack için alanı ikiye böl
  if (["double", "centralPack"].includes(pliseOpeningType)) {
    const areaPerTul = areaM2 / 2;
    for (let i = 0; i < 2; i++) {
      // m² bazlı fiyatlandırma - size kullanmıyoruz, direkt m² ile çarpıyoruz
      const product = createSelectedProduct(tul, 1);
      // totalPrice'ı m² bazlı hesapla (price zaten m² fiyatı olmalı)
      product.totalPrice = Number((areaPerTul * parseFloat(tul.price || "0")).toFixed(2));
      product.size = areaPerTul; // m² değerini size olarak sakla (gösterim için)
      items.push(product);
    }
  } else {
    // m² bazlı fiyatlandırma
    const product = createSelectedProduct(tul, 1);
    // totalPrice'ı m² bazlı hesapla (price zaten m² fiyatı olmalı)
    product.totalPrice = areaM2 * parseFloat(tul.price || "0");
    product.size = areaM2; // m² değerini size olarak sakla (gösterim için)
    items.push(product);
  }

  return items;
}

export function getPliseSeritItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const serit = allAccessories.find(
    (item) => item.stock_code === "378313041200"
  );
  if (!serit) return undefined;

  const { width, height, pliseOpeningType, kasaType } = values;

  let measurement: number;

  if (kasaType === "esiksiz") {
    measurement = height - 31;
  } else {
    if (pliseOpeningType === "dikey") {
      measurement = width - 55;
    } else {
      measurement = height - 55;
    }
  }

  const quantity: number = ["dikey", "yatay"].includes(pliseOpeningType)
    ? 2
    : 4;
  return createSelectedProduct(serit, quantity, measurement);
}

export function getPliseMagnetItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { pliseOpeningType, height } = values;

  if (pliseOpeningType !== "double") return undefined;

  const magnet = allAccessories.find(
    (item) => item.stock_code === "378322001200"
  );
  if (!magnet) return undefined;

  const quantity = 2;
  const measurement = height - 50;
  return createSelectedProduct(magnet, quantity, measurement);
}

export function getPliseAccessoryKitItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { kasaType, color } = values;
  const normalizedColor = normalizeColor(color);

  let kitStockCode;

  if (kasaType === "esiksiz") {
    kitStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
      ? "378250161200"
      : "378261801900";
  } else {
    kitStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
      ? "378242201900"
      : "378250141200";
  }

  const kit = allAccessories.find((item) => item.stock_code === kitStockCode);
  if (!kit) return undefined;

  return createSelectedProduct(kit, 1);
}

export function getPliseBeadItem(
  allAccessories: PriceItem[],
  ropeItem: PriceItem | undefined
): PriceItem | undefined {
  if (!ropeItem) return;

  const bead = allAccessories.find(
    (item) => item.stock_code === "378317021200"
  );
  if (!bead) return undefined;

  const quantity = !!ropeItem.quantity ? ropeItem.quantity : 1;

  return createSelectedProduct(bead, quantity);
}

export function getPliseRopeItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const rope = allAccessories.find(
    (item) => item.stock_code === "378314001200"
  );
  if (!rope) return undefined;

  const { width, height, pliseOpeningType } = values;

  let quantity;
  let measurement;

  if (pliseOpeningType === "dikey") {
    quantity = width < 1500 ? 4 : width < 2100 ? 6 : 8;
    measurement = Math.ceil(((width + height + 150) / 1000) * 10) / 10;
  } else {
    quantity = height < 1500 ? 4 : height < 2100 ? 6 : 8;
    measurement = Math.ceil(((width + height + 150) / 1000) * 10) / 10;
    if (["double", "centralPack"].includes(pliseOpeningType)) {
      quantity *= 2;
      measurement /= 2;
    }
  }

  return createSelectedProduct(rope, quantity, measurement);
}

export function getSurmeTulAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { tulType, width, height } = values;

  const tul = allAccessories.find((item) => {
    if (tulType === "normal") {
      return item.stock_code === "378212401900";
    }

    if (tulType === "kedi") {
      return item.stock_code === "378212701900";
    }
  });

  if (!tul) return undefined;

  // m² hesaplama - alan bazlı
  const areaM2 = (width * height) / 1_000_000;

  // m² bazlı fiyatlandırma
  const product = createSelectedProduct(tul, 1);
  // totalPrice'ı m² bazlı hesapla (price zaten m² fiyatı)
  product.totalPrice = Number((areaM2 * parseFloat(tul.price || "0")).toFixed(2));
  product.size = areaM2; // m² cinsinden sakla (gösterim için)
  return product;
}

export function getSurmeFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const normalizedColor = normalizeColor(color);
  const fitilStockCode = ["Metalik Gri", "Beyaz"].includes(normalizedColor)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const size = (width + height) * 2;
  return createSelectedProduct(fitil, 1, size);
}

export function getSurmeKasaTakozuItem(
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const kasaTakozuStockCode = "378143260000";
  const quantity = 4;

  const kasaTakozu = allAccessories.find((item) => {
    return item.stock_code === kasaTakozuStockCode;
  });
  if (!kasaTakozu) return undefined;

  return {
    ...kasaTakozu,
    quantity: quantity,
  };
}

export function getSurmeKanatTakozuItem(
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const kanatTakozuStockCode = "378143270000";
  const quantity = 4;

  const kanatTakozu = allAccessories.find((item) => {
    return item.stock_code === kanatTakozuStockCode;
  });
  if (!kanatTakozu) return undefined;

  return {
    ...kanatTakozu,
    quantity: quantity,
  };
}

export function getSurmeTekerlekItem(
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const tekerlekStockCode = "378143280000";
  const quantity = 2;

  const tekerlek = allAccessories.find((item) => {
    return item.stock_code === tekerlekStockCode;
  });
  if (!tekerlek) return undefined;

  return {
    ...tekerlek,
    quantity: quantity,
  };
}
