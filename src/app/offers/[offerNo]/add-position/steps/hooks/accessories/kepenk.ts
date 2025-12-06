import { PriceItem, SelectedProduct, KepenkSelections } from "@/types/kepenk";
import { createSelectedProduct, calculateLamelGenisligi, getBoxHeight, calculateLamelCount } from "@/utils/kepenk";

export const calculateKepenkAccessories = (
  values: KepenkSelections,
  allAccessories: PriceItem[]
): SelectedProduct[] => {
  const neededAccessories: SelectedProduct[] = [];

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
  const altParcaLastigi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_alt_parca_aksesuarlari" &&
      acc.lamel_type === (is100mm ? "100_lu" : "77_li")
  );

  if (altParcaLastigi) {
    const selectedProduct = createSelectedProduct(
      altParcaLastigi,
      1,
      lamelGenisligi
    );
    neededAccessories.push(selectedProduct);
  }

  // 77'lik Lamel Denge Makarası Beyaz
  if (!is100mm) {
    const lamelDengeMakarasi = allAccessories.find(
      (acc) =>
        acc.type === "kepenk_dikme_aksesuarlari" &&
        acc.dikme_type === "77_lik" &&
        acc.description.toLowerCase().includes("lamel denge makarası")
    );

    if (lamelDengeMakarasi) {
      const selectedProduct = createSelectedProduct(lamelDengeMakarasi, 2);
      neededAccessories.push(selectedProduct);
    }
  }

  // Dikme Pleksi - Her dikme için 1 adet, toplam 2 adet
  const dikmePleksi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.description.toLowerCase().includes("dikme pleksi") &&
      (acc.dikme_type === dikmeType || acc.dikme_type === "all")
  );

  if (dikmePleksi) {
    const selectedProduct = createSelectedProduct(
      dikmePleksi,
      2,
      dikmeHeight
    );
    neededAccessories.push(selectedProduct);
  }

  // Kıl Fitil
  const kilFitil = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_dikme_aksesuarlari" &&
      acc.dikme_type === dikmeType &&
      (acc.description.includes("067x") || acc.description.includes("06'x")) &&
      (is100mm ? acc.description.includes("1800") : acc.description.includes("1200"))
  );

  if (kilFitil) {
    const totalKilFitilLength = 4 * dikmeHeight;
    const selectedProduct = createSelectedProduct(
      kilFitil,
      1,
      totalKilFitilLength
    );
    neededAccessories.push(selectedProduct);
  }

  // Zımba Çivisi 8 mm
  const zimbaCivisi = allAccessories.find(
    (acc) =>
      acc.type === "kepenk_lamel_aksesuarlari" &&
      acc.description.toLowerCase().includes("zımba çivisi")
  );

  if (zimbaCivisi) {
    const totalLamelCount = calculateLamelCount(values.height, values.lamelType, boxHeight);
    const zimbaCivisiQuantity = totalLamelCount * 2;
    const selectedProduct = createSelectedProduct(zimbaCivisi, zimbaCivisiQuantity);
    neededAccessories.push(selectedProduct);
  }

  // Tambur Aksesuarları - Motorlu sistemlerde
  if (values.movementType === "motorlu") {
    const tamburType = is100mm ? "102mm" : "70mm";
    
    const tamburAksesuarlari = allAccessories.filter(
      (acc) =>
        acc.type === "kepenk_tambur_aksesuarlari" &&
        (acc.tambur_type === tamburType || acc.tambur_type === "all") &&
        acc.hareket_tip === "motorlu"
    );
    
    tamburAksesuarlari.forEach((aksesuar) => {
      const selectedProduct = createSelectedProduct(aksesuar, 1);
      neededAccessories.push(selectedProduct);
    });
  }

  return neededAccessories;
};
