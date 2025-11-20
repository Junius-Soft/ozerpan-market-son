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

  // Dikme Pleksi - Her dikme için 1 adet, toplam 2 adet (sol + sağ dikme)
  const dikmePleksiCandidates = allAccessories.filter(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.description.toLowerCase().includes("dikme pleksi")
  );
  console.log("[Kepenk Accessories] Dikme pleksi adayları:", dikmePleksiCandidates);
  console.log("[Kepenk Accessories] Aranan dikme_type:", dikmeType);
  
  const dikmePleksi = dikmePleksiCandidates.find(
    (acc) =>
      (acc.dikme_type === dikmeType || acc.dikme_type === "all")
  );

  console.log("[Kepenk Accessories] Dikme pleksi bulundu:", dikmePleksi);

  if (dikmePleksi) {
    // Her dikme için 1 adet pleksi, toplam 2 adet (sol + sağ dikme)
    const selectedProduct = createSelectedProduct(
      dikmePleksi,
      2, // İki dikme için 2 adet
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
    // Excel'e göre "Dikme miktarı kadar" = dikme * 4
    // Her dikme için 2 kat (üst ve alt) kıl fitil gerekir
    const totalKilFitilLength = 4 * dikmeHeight; // Dikme * 4
    const selectedProduct = createSelectedProduct(
      kilFitil,
      1, // Miktar 1, uzunluk toplam uzunluk
      totalKilFitilLength
    );
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Kıl fitil eklendi:", selectedProduct);
  }

  // Zımba Çivisi 8 mm - Excel'e göre:
  // Lamel Adedi Tek ise = (Lamel Adedi x 2)
  const zimbaCivisi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_lamel_aksesuarlari" &&
      acc.description.toLowerCase().includes("zımba çivisi")
  );

  console.log("[Kepenk Accessories] Zımba çivisi bulundu:", zimbaCivisi);

  if (zimbaCivisi) {
    // Toplam lamel sayısını hesapla (gözlü lamel varsa dahil)
    const totalLamelCount = calculateLamelCount(values.height, values.lamelType, boxHeight);
    
    // Excel'e göre: Lamel Adedi Tek ise = (Lamel Adedi x 2)
    // Çift için de aynı formülü kullanıyoruz
    const zimbaCivisiQuantity = totalLamelCount * 2;

    console.log("[Kepenk Accessories] Toplam lamel sayısı:", totalLamelCount);
    console.log("[Kepenk Accessories] Zımba çivisi miktarı:", zimbaCivisiQuantity);

    const selectedProduct = createSelectedProduct(zimbaCivisi, zimbaCivisiQuantity);
    neededAccessories.push(selectedProduct);
    console.log("[Kepenk Accessories] Zımba çivisi eklendi:", selectedProduct);
  }

  // Tambur Aksesuarları - Motorlu sistemlerde tambur tipine göre
  if (values.movementType === "motorlu") {
    // Tambur tipini belirle (başlangıçta lamel tipine göre)
    // Not: calculateKepenk içinde motor seçimine göre değişebilir ama burada başlangıç tipini kullanıyoruz
    const tamburType = is100mm ? "102mm" : "70mm";
    
    const tamburAksesuarlari = allAccessories.filter(
      (acc) =>
        acc.type === "kepenk_tambur_aksesuarlari" &&
        (acc.tambur_type === tamburType || acc.tambur_type === "all") &&
        acc.hareket_tip === "motorlu"
    );
    
    console.log("[Kepenk Accessories] Tambur aksesuarları:", tamburAksesuarlari);
    console.log("[Kepenk Accessories] Tambur tipi:", tamburType);
    
    // Her tambur aksesuarı için 1 adet ekle
    tamburAksesuarlari.forEach((aksesuar) => {
      const selectedProduct = createSelectedProduct(aksesuar, 1);
      neededAccessories.push(selectedProduct);
      console.log("[Kepenk Accessories] Tambur aksesuarı eklendi:", selectedProduct);
    });
  }

  console.log("[Kepenk Accessories] Toplam aksesuar sayısı:", neededAccessories.length);
  console.log("[Kepenk Accessories] Aksesuarlar:", neededAccessories);

  return neededAccessories;
};

