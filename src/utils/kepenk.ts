import { LamelProperties } from "@/types/kepenk";
import { lamelProperties } from "@/constants/kepenk";
import { PriceItem, SelectedProduct } from "@/types/kepenk";

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

export const getLamelProperties = (lamelType: string): LamelProperties => {
  return lamelProperties[lamelType];
};

export const getBoxHeight = (boxType: string): number => {
  return parseInt(boxType.replace("mm", ""));
};

// Kepenk için dikme genişliği (Excel'den)
export const getDikmeGenisligi = (dikmeType: string): number => {
  return dikmeType === "77_lik" ? 100 : 140; // 77'lik: 100mm, 100'lük: 140mm
};

// Kepenk için lamel düşme değeri (Excel'den)
export const getLamelDusmeValue = (dikmeType: string): number => {
  return dikmeType === "77_lik" ? 67 : 70; // 77'lik: 67mm, 100'lük: 70mm
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


// Lamel sayısı hesaplama
// Formül: ((Yükseklik - (Kutu Payı / 2)) / Lamel Kapama Yüzeyi) + 1
export const calculateLamelCount = (
  systemHeight: number,
  lamelType: string,
  boxHeight: number
): number => {
  // Lamel tiplerine göre kapama yüzeyi
  const kapamaYuzeyi: Record<string, number> = {
    st_77: 77,
    sl_77: 77,
    se_77: 77,
    se_78: 78,
    st_100: 96,
    sl_100: 96,
  };

  const kapamaYuzeyiMm = kapamaYuzeyi[lamelType] || 77;
  // Yeni formül: ((Yükseklik - (Kutu Payı / 2)) / Kapama Yüzeyi) + 1
  const adjustedHeight = systemHeight - (boxHeight / 2);
  return Math.floor(adjustedHeight / kapamaYuzeyiMm) + 1;
};

// Lamel genişliği hesaplama
// Formül: Genişlik - (Dikme Payı) × 2
export const calculateLamelGenisligi = (
  systemWidth: number,
  dikmeType: string
): number => {
  const lamelDusme = getLamelDusmeValue(dikmeType);
  // 2 dikme için dikme payı çıkarılır
  return systemWidth - 2 * lamelDusme;
};


// Lamel fiyatı bulma
export const findLamelPrice = (
  prices: PriceItem[],
  lamelType: string,
  color: string,
  quantity: number,
  lamelGenisligi: number
): [number, SelectedProduct | null] => {
  const lamelPrices = prices.filter(
    (p) => p.type === "kepenk_lamel_profilleri" && p.lamel_type === lamelType
  );

  let matchingLamel = lamelPrices.find(
    (p) => p.color.toLowerCase() === color.toLowerCase()
  );

  // Eğer bulunamazsa, beyaz ile tekrar dene
  if (!matchingLamel) {
    matchingLamel = lamelPrices.find(
      (p) => p.color.toLowerCase() === "beyaz"
    );
  }

  if (!matchingLamel) return [0, null];

  const selectedProduct = createSelectedProduct(
    matchingLamel,
    quantity,
    lamelGenisligi
  );
  return [selectedProduct.totalPrice, selectedProduct];
};

// Alt parça fiyatı bulma
export const findSubPartPrice = (
  prices: PriceItem[],
  lamelType: string,
  color: string,
  sectionWidths: number[]
): Array<{
  price: number;
  selectedProduct: SelectedProduct | null;
  width: number;
}> => {
  const subPartPrices = prices.filter(
    (p) => p.type === "kepenk_alt_parca_profilleri"
  );

  // Lamel tipine göre alt parça seç
  const altParcaType = lamelType.includes("100") ? "100_lu" : "77_li";
  
  // Renk filtresi ekle (eğer renk eşleşmezse, varsayılan olarak ilk uygun olanı kullan)
  let matchingSubPart = subPartPrices.find(
    (p) => p.lamel_type === altParcaType && 
           p.color?.toLowerCase() === color.toLowerCase()
  );

  // Eğer renk eşleşmezse, lamel tipine göre ilk uygun olanı kullan
  if (!matchingSubPart) {
    matchingSubPart = subPartPrices.find(
      (p) => p.lamel_type === altParcaType
    );
  }

  if (!matchingSubPart) {
    return sectionWidths.map((width) => ({ price: 0, selectedProduct: null, width }));
  }

  return sectionWidths.map((width) => {
    const selectedProduct = createSelectedProduct(matchingSubPart!, 1, width);
    return {
      price: selectedProduct.totalPrice,
      selectedProduct,
      width,
    };
  });
};

// Dikme fiyatı bulma
export const findDikmePrice = (
  prices: PriceItem[],
  dikmeType: string,
  color: string,
  height: number
): [number, SelectedProduct | null] => {
  const dikmePrices = prices.filter(
    (p) => p.type === "kepenk_dikme_profilleri" && p.dikme_type === dikmeType
  );

  let matchingDikme = dikmePrices.find(
    (p) => p.color.toLowerCase() === color.toLowerCase()
  );

  if (!matchingDikme && dikmePrices.length > 0) {
    matchingDikme = dikmePrices[0];
  }

  if (!matchingDikme) return [0, null];

  const selectedProduct = createSelectedProduct(matchingDikme, 2, height); // 2 adet dikme
  return [selectedProduct.totalPrice, selectedProduct];
};

// Kutu fiyatı bulma - Hem ön hem arka kutu bileşenlerini bulur
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
  const boxPrices = prices.filter(
    (p) => p.type === "kepenk_kutu_profilleri" && p.kutu_type?.includes(boxType)
  );

  // Ön ve arka kutu bileşenlerini bul
  const boxSize = boxType.replace("mm", "");
  const frontBox = boxPrices.find(
    (p) => p.kutu_type?.includes(`${boxSize}_on45`) || p.description?.includes("ÖN 45")
  );
  const backBox = boxPrices.find(
    (p) => p.kutu_type?.includes(`${boxSize}_arka90`) || p.description?.includes("ARKA 90")
  );

  return {
    frontPrice: frontBox ? parseFloat(frontBox.price) : 0,
    backPrice: backBox ? parseFloat(backBox.price) : 0,
    selectedFrontBox: frontBox
      ? createSelectedProduct(frontBox, 1, systemWidth)
      : undefined,
    selectedBackBox: backBox
      ? createSelectedProduct(backBox, 1, systemWidth)
      : undefined,
  };
};

// Tambur fiyatı bulma
export const findTamburPrice = (
  prices: PriceItem[],
  tamburType: string,
  lamelType: string,
  systemWidth: number
): [number, SelectedProduct | null] => {
  const tamburPrices = prices.filter(
    (p) =>
      p.type === "kepenk_tambur_boru_profilleri" &&
      p.tambur_type === tamburType
  );

  let matchingTambur = tamburPrices.find((p) => 
    p.lamel_type?.includes(lamelType.replace("_", "-").toUpperCase())
  );

  if (!matchingTambur && tamburPrices.length > 0) {
    matchingTambur = tamburPrices[0];
  }

  if (!matchingTambur) return [0, null];

  const selectedProduct = createSelectedProduct(matchingTambur, 1, systemWidth);
  return [selectedProduct.totalPrice, selectedProduct];
};

// Motor fiyatı bulma
export const findMotorPrice = (
  prices: PriceItem[],
  motorModel: string,
  motorTip: string
): [number, SelectedProduct | null] => {
  const motorPrices = prices.filter(
    (p) =>
      p.type === "kepenk_motorlar" &&
      p.motor_model === motorModel &&
      p.motor_type === motorTip
  );

  const matchingMotor = motorPrices[0];

  if (!matchingMotor) return [0, null];

  const selectedProduct = createSelectedProduct(matchingMotor, 1);
  return [selectedProduct.totalPrice, selectedProduct];
};


