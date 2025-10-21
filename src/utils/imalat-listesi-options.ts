export const getImalatListesiOptions = (
  productId?: string | null,
  optionId?: string | null
): { label: string; value: string }[] => {
  // Panjur için
  if (productId === "panjur") {
    const baseOptions = [
      { label: "Lamel", value: "Lamel" },
      { label: "Alt Parça", value: "Alt Parça" },
      { label: "Dikme", value: "Dikme" },
      { label: "Kutu", value: "Kutu" },
      { label: "Tambur Borusu", value: "Boru" },
      { label: "Yükseltme Profili", value: "Kasa Profili" },
      { label: "Ürün Önizlemesi", value: "preview" },
    ];

    // Montaj tipine göre ek seçenekler
    if (optionId === "monoblok") {
      return [...baseOptions];
    } else if (optionId === "distan") {
      return [...baseOptions];
    } else if (optionId === "yalitimli") {
      return [...baseOptions];
    }

    // Default panjur options
    return [...baseOptions];
  }

  // Sineklik için
  if (productId === "sineklik") {
    return [
      { label: "Ürün Önizlemesi", value: "preview" },
      { label: "Kasa Profili", value: "Kasa Profili" },
      { label: "Kanat Profili", value: "Kanat Profili" },
    ];
  }
  // Cam Balkon için
  if (productId === "cam-balkon") {
    return [
      { label: "Ürün Önizlemesi", value: "preview" },
      { label: "Cam Balkon 1", value: "Cam" },
      { label: "Cam Balkon2", value: "Balkon" },
    ];
  }

  // Default options (herhangi bir ürün belirtilmemişse)
  return [];
};
