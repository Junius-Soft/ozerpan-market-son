import { PriceItem, SelectedProduct, KepenkSelections } from "@/types/kepenk";
import { createSelectedProduct, calculateLamelGenisligi, getBoxHeight, calculateLamelCount } from "@/utils/kepenk";

export const calculateKepenkAccessories = (
  values: KepenkSelections,
  allAccessories: PriceItem[]
): SelectedProduct[] => {
  const neededAccessories: SelectedProduct[] = [];

  // Debug: Aksesuar verilerini kontrol et
  console.log("[Kepenk Accessories] Total accessories:", allAccessories.length);
  console.log("[Kepenk Accessories] Values:", values);

  // Lamel tipine göre dikme tipi
  const is100mm = values.lamelType.includes("100");
  const dikmeType = is100mm ? "100_luk" : "77_lik";
  const boxType = is100mm ? "350mm" : "300mm";
  
  // Lamel genişliği hesapla (alt parça ölçüsü için gerekli)
  const lamelGenisligi = calculateLamelGenisligi(values.width, dikmeType);
  
  // Dikme yüksekliği hesapla (aksesuarlar için gerekli)
  const boxHeight = getBoxHeight(boxType);
  const dikmeHeight = values.height - boxHeight;

  // Alt Parça Lastiği - Excel'e göre "Alt Parça ölçüsü kadar"
  // Alt parça ölçüsü = lamel genişliği
  const altParcaAksesuarlari = allAccessories.filter(
    (acc) => acc.type === "kepenk_alt_parca_aksesuarlari"
  );
  console.log("[Kepenk Accessories] Alt parça aksesuarları:", altParcaAksesuarlari);
  
  const altParcaLastigi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_alt_parca_aksesuarlari" &&
      acc.lamel_type === (is100mm ? "100_lu" : "77_li")
  );

  console.log("[Kepenk Accessories] Alt parça lastiği bulundu:", altParcaLastigi);

  if (altParcaLastigi) {
    // Alt parça lastiği ölçüsü = alt parça ölçüsü = lamel genişliği
    const selectedProduct = createSelectedProduct(
      altParcaLastigi,
      1,
      lamelGenisligi
    );
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Alt parça lastiği eklendi:", selectedProduct);
  }

  // 77'lik Lamel Denge Makarası Beyaz - Excel'e göre "400 lük kutu da her sistem için 2 adet"
  // Not: 300mm kutu için de 2 adet kullanıyoruz (Excel'de 400mm yazıyor ama mantık aynı)
  if (!is100mm) {
    const dikmeAksesuarlari = allAccessories.filter(
      (acc) => acc.type === "kepenk_dikme_aksesuarlari"
    );
    console.log("[Kepenk Accessories] Dikme aksesuarları:", dikmeAksesuarlari);
    
    const lamelDengeMakarasi = allAccessories.find(
      (acc) =>
        acc.type === "kepenk_dikme_aksesuarlari" &&
        acc.dikme_type === "77_lik" &&
        acc.description.toLowerCase().includes("lamel denge makarası")
    );

    console.log("[Kepenk Accessories] Lamel denge makarası bulundu:", lamelDengeMakarasi);

    if (lamelDengeMakarasi) {
      // Her sistem için 2 adet
      const selectedProduct = createSelectedProduct(lamelDengeMakarasi, 2);
      neededAccessories.push(selectedProduct);
      console.log("[Kepenk Accessories] Lamel denge makarası eklendi:", selectedProduct);
    }
  }

  // Dikme Pleksi - Excel'e göre "77 lik Dikme miktarı kadar"
  const dikmePleksi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.description.toLowerCase().includes("dikme pleksi")
  );

  console.log("[Kepenk Accessories] Dikme pleksi bulundu:", dikmePleksi);

  if (dikmePleksi) {
    // Dikme yüksekliği kadar (metre cinsinden)
    const selectedProduct = createSelectedProduct(
      dikmePleksi,
      1,
      dikmeHeight
    );
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Dikme pleksi eklendi:", selectedProduct);
  }

  // Kıl Fitil - Excel'e göre "77 lik Dikme miktarı kadar" veya "100 lük Dikme miktarı kadar"
  // Excel'de: 067x1200 (77'lik için), 067x1800 (100'lük için)
  // "Dikme miktarı kadar" = 2 dikme * dikme yüksekliği = toplam uzunluk
  const kilFitilCandidates = allAccessories.filter(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.dikme_type === dikmeType &&
      (acc.description.includes("067x") || acc.description.includes("06'x"))
  );
  console.log("[Kepenk Accessories] Kıl fitil adayları:", kilFitilCandidates);
  
  const kilFitil = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.dikme_type === dikmeType &&
      (acc.description.includes("067x") || acc.description.includes("06'x")) &&
      (is100mm ? acc.description.includes("1800") : acc.description.includes("1200"))
  );

  console.log("[Kepenk Accessories] Kıl fitil bulundu:", kilFitil);

  if (kilFitil) {
    // Toplam uzunluk = 2 dikme * dikme yüksekliği
    // Excel'e göre "Dikme miktarı kadar" = toplam uzunluk
    const totalKilFitilLength = 2 * dikmeHeight; // 2 dikme için toplam uzunluk
    const selectedProduct = createSelectedProduct(
      kilFitil,
      1, // Miktar 1, uzunluk toplam uzunluk
      totalKilFitilLength
    );
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Kıl fitil eklendi:", selectedProduct);
  }

  // Zımba Çivisi 8 mm - Excel'e göre:
  // Lamel Adedi Tek ise = (Lamel Adedi / 2) + 1
  // Lamel Adedi Çift ise = (Lamel Adedi / 2)
  const zimbaCivisi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_lamel_aksesuarlari" &&
      acc.description.toLowerCase().includes("zımba çivisi")
  );

  console.log("[Kepenk Accessories] Zımba çivisi bulundu:", zimbaCivisi);

  if (zimbaCivisi) {
    // Toplam lamel sayısını hesapla (gözlü lamel varsa dahil)
    const totalLamelCount = calculateLamelCount(values.height, values.lamelType, boxHeight);
    
    // Tek/çift kontrolü
    let zimbaCivisiQuantity: number;
    if (totalLamelCount % 2 === 0) {
      // Çift: (Lamel Adedi / 2)
      zimbaCivisiQuantity = Math.floor(totalLamelCount / 2);
    } else {
      // Tek: (Lamel Adedi / 2) + 1
      zimbaCivisiQuantity = Math.floor(totalLamelCount / 2) + 1;
    }

    console.log("[Kepenk Accessories] Toplam lamel sayısı:", totalLamelCount);
    console.log("[Kepenk Accessories] Zımba çivisi miktarı:", zimbaCivisiQuantity);

    const selectedProduct = createSelectedProduct(zimbaCivisi, zimbaCivisiQuantity);
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Zımba çivisi eklendi:", selectedProduct);
  }

  console.log("[Kepenk Accessories] Toplam aksesuar sayısı:", neededAccessories.length);
  console.log("[Kepenk Accessories] Aksesuarlar:", neededAccessories);

  return neededAccessories;
};

