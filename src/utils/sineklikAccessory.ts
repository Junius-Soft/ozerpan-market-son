import { PriceItem } from "@/types/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getMenteseliKasaKoseTakozuItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, menteseliOpeningType } = values;
  if (menteseliOpeningType === "disaAcilim") return undefined;

  const takozStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378317031200"
    : "378317041200";

  const takoz = allAccessories.find((item) => {
    return item.stock_code === takozStockCode;
  });
  if (!takoz) return undefined;

  return { ...takoz, quantity: 4 };
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

  return { ...takoz, quantity: 4 };
}

export function getMenteseliPencereMentesesiItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, menteseliOpeningType } = values;

  if (menteseliOpeningType === "iceAcilim") return undefined;

  const menteseStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378332232000"
    : "378332251100";

  const mentese = allAccessories.find((item) => {
    return item.stock_code === menteseStockCode;
  });
  if (!mentese) return undefined;

  return { ...mentese, quantity: 4 };
}

export function getMenteseliFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const fitilStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const measurement = ((width + height) * 2) / 1000;
  const pricePerPiece = measurement * parseFloat(fitil.price);

  return {
    ...fitil,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
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

  const measurement: number = (width / 1000) * (height / 1000);
  const pricePerPiece: number = measurement * parseFloat(tul.price);

  return {
    ...tul,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
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

  const measurement: number = (width / 1000) * (height / 1000);
  const pricePerPiece = measurement * parseFloat(tul.price);

  return {
    ...tul,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
}

export function getSabitFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const fitilStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const measurement = ((width + height) * 2) / 1000;
  const pricePerPiece = measurement * parseFloat(fitil.price);

  return {
    ...fitil,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
}

export function getSabitKoseTakozuAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color } = values;

  const takozStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378332101100"
    : "378332102000";

  const takoz = allAccessories.find((item) => {
    return item.stock_code === takozStockCode;
  });
  if (!takoz) return undefined;

  return { ...takoz, quantity: 4 };
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

  const quantity =
    pliseOpeningType === "dikey"
      ? Math.ceil(height / 30 + 2)
      : Math.ceil(width / 30 + 2);

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

  const pricePerPiece = parseFloat(tul.price) * 0.03 * (measurement / 1000);

  if (["double", "centralPack"].includes(pliseOpeningType)) {
    const quantityPerTul = Math.ceil(quantity / 2);

    for (let i = 0; i < 2; i++) {
      items.push({
        ...tul,
        pricePerPiece: pricePerPiece,
        quantity: quantityPerTul,
        measurement: measurement,
      });
    }
  } else {
    items.push({
      ...tul,
      pricePerPiece: pricePerPiece,
      quantity: quantity,
      measurement: measurement,
    });
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
  const pricePerPiece: number = (measurement / 1000) * parseFloat(serit.price);

  return {
    ...serit,
    quantity: quantity,
    pricePerPiece: pricePerPiece,
    measurement: measurement,
  };
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
  const pricePerPiece = (measurement / 1000) * parseFloat(magnet.price);

  return {
    ...magnet,
    quantity: quantity,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
}

export function getPliseAccessoryKitItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { kasaType, color } = values;

  let kitStockCode;

  if (kasaType === "esiksiz") {
    kitStockCode = ["metalik_gri", "beyaz"].includes(color)
      ? "378250161200"
      : "378261801900";
  } else {
    kitStockCode = ["metalik_gri", "beyaz"].includes(color)
      ? "378242201900"
      : "378250141200";
  }

  const kit = allAccessories.find((item) => item.stock_code === kitStockCode);
  if (!kit) return undefined;

  kit.quantity = 1;

  return { ...kit, quantity: 1, pricePerPiece: parseFloat(kit.price) };
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

  return {
    ...bead,
    quantity: quantity,
    pricePerPiece: parseFloat(bead.price),
  };
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

  const pricePerPiece = measurement * parseFloat(rope.price);

  return {
    ...rope,
    measurement: measurement,
    quantity: quantity,
    pricePerPiece: pricePerPiece,
  };
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

  const measurement = (width / 1000) * (height / 1000);
  const pricePerPiece = measurement * parseFloat(tul.price);

  return {
    ...tul,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
}

export function getSurmeFitilAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[]
): PriceItem | undefined {
  const { color, width, height } = values;

  const fitilStockCode = ["metalik_gri", "beyaz"].includes(color)
    ? "378335101100"
    : "378335201100";

  const fitil = allAccessories.find((item) => {
    return item.stock_code === fitilStockCode;
  });
  if (!fitil) return undefined;

  const measurement = ((width + height) * 2) / 1000;
  const pricePerPiece = measurement * parseFloat(fitil.price);

  return {
    ...fitil,
    quantity: 1,
    measurement: measurement,
    pricePerPiece: pricePerPiece,
  };
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
