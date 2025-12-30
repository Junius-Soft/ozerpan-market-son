// İmalat listesi filtreleme için type mapping
// Seçilen tip (value) ile ürün type'larını eşleştir

export const imalatTypeMapping: Record<string, string[]> = {
  // Panjur tipleri
  "Lamel": [
    "panjur_lamel_profilleri",
    "panjur_lamel_aksesuarları",
  ],
  "Dikme": [
    "panjur_dikme_profilleri",
    "panjur_dikme_aksesuarları",
  ],
  "Kutu": [
    "panjur_kutu_profilleri",
    "monoblok_panjur_kutu_profilleri",
    "yalitimli_panjur_kutu_profilleri",
    "panjur_kutu_aksesuarları",
    "monoblok_panjur_kutu_aksesuarları",
    "yalitimli_panjur_kutu_aksesuarlari",
  ],
  "Alt Parça": [
    "panjur_alt_parça_profilleri",
    "panjur_alt_parça_aksesuarları",
  ],
  "Boru": [
    "panjur_tambur_boru_profilleri",
    "panjur_tambur_boru_aksesuarları",
  ],
  "Kasa Profili": [
    "sineklik_profilleri",
    "sineklik_kasa_profilleri",
    "panjur_yukseltme_profilleri",
    "profil", // Sürme sineklik ray profilleri için
  ],
  "Kanat Profili": [
    "sineklik_kanat_profilleri",
    "profil", // Sürme sineklik kanat profilleri için
  ],
  
  // Cam Balkon tipleri
  "cam_balkon_profiller": ["cam_balkon_profiller"],
  "cam_balkon_aksesuar": ["cam_balkon_aksesuar"],
  
  // Kepenk tipleri
  "Kepenk Lamel": [
    "kepenk_lamel_profilleri",
    "kepenk_lamel_aksesuarlari",
  ],
  "Kepenk Dikme": [
    "kepenk_dikme_profilleri",
    "kepenk_dikme_aksesuarlari",
  ],
  "Kepenk Kutu": [
    "kepenk_kutu_profilleri",
    "kepenk_kutu_aksesuarlari",
  ],
  "Kepenk Alt Parça": [
    "kepenk_alt_parca_profilleri",
    "kepenk_alt_parca_aksesuarlari",
  ],
  
  // Preview için özel tip (hiçbir ürünü filtrelemez, hepsini gösterir)
  "preview": [],
};

/**
 * Seçilen tiplere göre ürün type'larını döndürür
 */
export function getTypeFilters(selectedTypes: string[]): string[] {
  const allTypes: string[] = [];
  
  selectedTypes.forEach((selectedType) => {
    const mappedTypes = imalatTypeMapping[selectedType];
    if (mappedTypes && mappedTypes.length > 0) {
      allTypes.push(...mappedTypes);
    }
    // Eğer "preview" seçilmişse, tüm ürünler gösterilir (boş array döner)
    if (selectedType === "preview") {
      // Preview için özel işlem yok, boş bırakıyoruz
    }
  });
  
  return [...new Set(allTypes)]; // Unique type'ları döndür
}

/**
 * Ürünün seçilen tiplerden birine uyup uymadığını kontrol eder
 */
export function matchesSelectedTypes(
  productType: string | undefined,
  productDescription: string | undefined,
  selectedTypes: string[]
): boolean {
  // Eğer hiç tip seçilmemişse veya "preview" seçilmişse, tüm ürünleri göster
  if (selectedTypes.length === 0 || selectedTypes.includes("preview")) {
    return true;
  }
  
  // Type mapping'e göre kontrol et
  const allowedTypes = getTypeFilters(selectedTypes);
  
  // Eğer ürünün type'ı allowedTypes içindeyse, göster
  if (productType && allowedTypes.includes(productType)) {
    return true;
  }
  
  // Fallback: Description'da arama yap (eski mantık)
  const prodDesc = (productDescription || "").toLowerCase().trim();
  const normalizedTypes = selectedTypes.map((t) => t.toLowerCase().trim());
  
  return normalizedTypes.some((type) => prodDesc.includes(type));
}

