import { PriceItem } from "@/types/kepenk";

/**
 * Kepenk lamel tipine göre mevcut renkleri döndürür
 * @param prices Tüm fiyat listesi
 * @param lamelType Lamel tipi (st_77, sl_77, se_77, se_78, st_100, sl_100)
 * @returns Mevcut renk ID'lerinin listesi (form'daki renk ID'leri)
 */
export function getAvailableLamelColors(
  prices: PriceItem[],
  lamelType: string
): string[] {
  // product-prices.json'dan bu lamel tipi için mevcut renkleri bul
  const lamelPrices = prices.filter(
    (p) => p.type === "kepenk_lamel_profilleri" && p.lamel_type === lamelType
  );

  const availableColorsInJson = lamelPrices.map((p) => p.color.toLowerCase());

  // product-prices.json'daki renk değerlerini form'daki renk ID'lerine map et
  // Sadece gerçekten var olan renkleri map et
  const colorMapping: Record<string, string[]> = {
    "antrasit_gri": ["antrasit"],
    "metalik_gri": ["metalik_gri"],
    "beyaz": ["beyaz"],
    "rall_boya": ["ral_boyali"],
    "ral_boyalı": ["ral_boyali"]
  };

  // Form'daki renk ID'lerini topla
  const availableFormColors = new Set<string>();

  availableColorsInJson.forEach((jsonColor) => {
    const mappedColors = colorMapping[jsonColor] || [jsonColor];
    mappedColors.forEach((formColor) => availableFormColors.add(formColor));
  });

  return Array.from(availableFormColors);
}

