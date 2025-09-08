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
      { label: "Kasa Profili", value: "Kasa Profili" },
      { label: "Kanat Profili", value: "Kanat Profili" },
    ];
  }

  // Default options (herhangi bir ürün belirtilmemişse)
  return [];
};
