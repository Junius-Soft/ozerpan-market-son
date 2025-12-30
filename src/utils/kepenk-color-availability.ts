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
  // product-prices.json'daki renk değerlerini form'daki renk ID'lerine map et
  const colorMapping: Record<string, string[]> = {
    "alüminyum": ["aluminyum"],
    "rall_boya": ["ral_boyali"],
    "antrasit_gri": ["ral_7016"],
    "beyaz": ["beyaz", "ral_9005"], // beyaz hem kendi hem de ral_9005 için kullanılabilir
    "krem": ["ral_8017"],
    "metalik_gri": ["ral_8017"],
    "ekstruzyonhh": ["aluminyum"], // se_77 için özel durum
  };

  // product-prices.json'dan bu lamel tipi için mevcut renkleri bul
  const lamelPrices = prices.filter(
    (p) => p.type === "kepenk_lamel_profilleri" && p.lamel_type === lamelType
  );

  const availableColorsInJson = lamelPrices.map((p) => p.color.toLowerCase());

  // Form'daki renk ID'lerini topla
  const availableFormColors = new Set<string>();

  availableColorsInJson.forEach((jsonColor) => {
    const mappedColors = colorMapping[jsonColor] || [jsonColor];
    mappedColors.forEach((formColor) => availableFormColors.add(formColor));
  });

  // Özel durumlar
  // se_77 için ekstruzyonhh -> aluminyum olarak göster
  if (lamelType === "se_77" && availableColorsInJson.includes("ekstruzyonhh")) {
    availableFormColors.add("aluminyum");
  }

  // se_78 için alüminyum zaten var
  if (lamelType === "se_78" && availableColorsInJson.includes("alüminyum")) {
    availableFormColors.add("aluminyum");
  }

  return Array.from(availableFormColors);
}

