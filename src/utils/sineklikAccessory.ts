import { PriceItem, SelectedProduct } from "@/types/panjur";
import { SineklikSelections } from "@/types/sineklik";

export function getPliseTulAccessoryItem(
  values: SineklikSelections,
  allAccessories: PriceItem[],
): SelectedProduct[] {
  const { width, height, tulType, pliseOpeningType, kasaType } = values;

  const items: SelectedProduct[] = [];

  const tul = allAccessories.find((item) => {
    if (tulType === "normal") {
      return item.stock_code == "378212401900";
    }

    if (tulType === "kedi") {
      return item.stock_code == "378212201900";
    }
  });

  if (!tul) return [];

  const quantity =
    pliseOpeningType === "dikey"
      ? Math.ceil(height / 30 + 2)
      : Math.ceil(width / 30 + 2);

  let measurement: number;

  if (pliseOpeningType === "dikey") {
    measurement = width - 55;
  } else {
    if (kasaType === "esiksiz" && pliseOpeningType === "yatay") {
      measurement = height - 31;
    } else {
      measurement = height - 55;
    }
  }

  if (["double", "centralPack"].includes(pliseOpeningType)) {
    const quantityPerTul = Math.ceil(quantity / 2);
    const totalPrice =
      parseFloat(tul.price) * quantityPerTul * 0.03 * (measurement / 1000);

    for (let i = 0; i < 2; i++) {
      items.push({
        ...tul,
        totalPrice: totalPrice,
        quantity: quantityPerTul,
        measurement: measurement,
        size: "",
      });
    }
  } else {
    const totalPrice =
      parseFloat(tul.price) * quantity * 0.03 * (measurement / 1000);

    items.push({
      ...tul,
      totalPrice: totalPrice,
      quantity: quantity,
      measurement: measurement,
      size: "",
    });
  }
  return items;
}

export function getPliseSeritItem(
  values: SineklikSelections,
  allAccessories: PriceItem[],
): SelectedProduct | undefined {
  const serit = allAccessories.find(
    (item) => item.stock_code == "378313041200",
  );
  if (!serit) return undefined;

  const { width, height, pliseOpeningType, kasaType } = values;

  let measurement: number;

  if (pliseOpeningType === "dikey") {
    measurement = width - 55;
  } else {
    if (kasaType === "esiksiz" && pliseOpeningType === "yatay") {
      measurement = height - 31;
    } else {
      measurement = height - 55;
    }
  }
  const quantity: number = ["dikey", "yatay"].includes(pliseOpeningType)
    ? 2
    : 4;
  const totalPrice: number =
    ((quantity * measurement) / 1000) * parseFloat(serit.price);

  return {
    ...serit,
    quantity: quantity,
    totalPrice: totalPrice,
    measurement: measurement,
    size: "",
  };
}

export function getPliseMagnetItem(
  values: SineklikSelections,
  allAccessories: PriceItem[],
): SelectedProduct | undefined {
  const { pliseOpeningType, height } = values;

  if (pliseOpeningType !== "double") return undefined;

  const magnet = allAccessories.find(
    (item) => item.stock_code === "378322001200",
  );
  if (!magnet) return undefined;

  const quantity = 2;
  const measurement = height - 50;
  const totalPrice =
    ((quantity * measurement) / 1000) * parseFloat(magnet.price);

  return {
    ...magnet,
    quantity: quantity,
    measurement: measurement,
    totalPrice: totalPrice,
    size: "",
  };
}

export function getPliseAccessoryKitItem(
  values: SineklikSelections,
  allAccessories: PriceItem[],
): SelectedProduct | undefined {
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

  const kit = allAccessories.find((item) => item.stock_code == kitStockCode);
  if (!kit) return undefined;

  kit.quantity = 1;

  return { ...kit, quantity: 1, totalPrice: parseFloat(kit.price), size: "" };
}

export function getPliseBeadItem(
  allAccessories: PriceItem[],
  ropeItem: PriceItem | undefined,
): SelectedProduct | undefined {
  if (!ropeItem) return;

  const bead = allAccessories.find((item) => item.stock_code == "378317021200");
  if (!bead) return undefined;

  const quantity = !!ropeItem.quantity ? ropeItem.quantity : 1;
  const totalPrice = parseFloat(bead.price) * quantity;

  return {
    ...bead,
    quantity: quantity,
    totalPrice: totalPrice,
    size: "",
  };
}

export function getPliseRopeItem(
  values: SineklikSelections,
  allAccessories: PriceItem[],
): SelectedProduct | undefined {
  const rope = allAccessories.find((item) => item.stock_code == "378314001200");
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

  const totalPrice = quantity * measurement * parseFloat(rope.price);

  return {
    ...rope,
    measurement: measurement,
    quantity: quantity,
    totalPrice: totalPrice,
    size: "",
  };
}
