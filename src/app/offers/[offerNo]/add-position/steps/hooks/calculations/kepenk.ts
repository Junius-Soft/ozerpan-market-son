import {
  PriceItem,
  CalculationResult,
  SelectedProduct,
  KepenkSelections,
} from "@/types/kepenk";
import {
  calculateLamelCount,
  calculateLamelGenisligi,
  findLamelPrice,
  findSubPartPrice,
  findDikmePrice,
  findBoxPrice,
  findTamburPrice,
  findMotorPrice,
  getBoxHeight,
} from "@/utils/kepenk";
import { selectKepenkMotor } from "@/utils/kepenk-motor-selection";

export const calculateKepenk = (
  values: KepenkSelections,
  prices: PriceItem[],
  accessoryItems: SelectedProduct[]
): CalculationResult => {
  const errors: string[] = [];

  // Lamel tipine göre otomatik dikme, kutu ve tambur seçimi
  const is100mm = values.lamelType.includes("100");
  const dikmeType = is100mm ? "100_luk" : "77_lik";
  const boxType = is100mm ? "350mm" : "300mm";
  // Tambur tipi başlangıçta lamel tipine göre belirlenir, ama motor seçimine göre değişebilir
  let tamburType = is100mm ? "102mm" : "70mm";

  const systemWidth = values.width;
  const systemHeight = values.height;

  // Kutu yüksekliğini hesapla (lamel sayısı hesaplaması için gerekli)
  const boxHeight = getBoxHeight(boxType);

  // Gözlü lamel kontrolü
  const hasGozluLamel = values.gozluLamelVar && 
    values.gozluLamelBaslangic !== undefined && 
    values.gozluLamelBitis !== undefined &&
    values.gozluLamelBaslangic > 0 &&
    values.gozluLamelBitis > values.gozluLamelBaslangic &&
    values.gozluLamelBitis <= systemHeight;

  let normalLamelHeight = systemHeight;
  let gozluLamelHeight = 0;
  let gozluLamelBaslangic = 0;
  let gozluLamelBitis = 0;

  if (hasGozluLamel) {
    gozluLamelBaslangic = values.gozluLamelBaslangic!;
    gozluLamelBitis = values.gozluLamelBitis!;
    gozluLamelHeight = gozluLamelBitis - gozluLamelBaslangic;
    // Normal lamel: 0-başlangıç ve bitiş-yükseklik arası
    normalLamelHeight = gozluLamelBaslangic + (systemHeight - gozluLamelBitis);
  }

  // Normal lamel sayısı ve genişliği hesapla
  const normalLamelCount = calculateLamelCount(normalLamelHeight, values.lamelType, boxHeight);
  const lamelGenisligi = calculateLamelGenisligi(systemWidth, dikmeType);

  // Normal lamel fiyatı hesapla
  let lamelPrice = 0;
  let lamelSelectedProduct: SelectedProduct | null = null;
  
  if (normalLamelHeight > 0) {
    const [normalPrice, normalProduct] = findLamelPrice(
      prices,
      values.lamelType,
      "beyaz",
      normalLamelCount,
      lamelGenisligi
    );
    lamelPrice += normalPrice;
    if (normalProduct) {
      lamelSelectedProduct = normalProduct;
    }
  }

  // Gözlü lamel fiyatı hesapla (varsa)
  let gozluLamelPrice = 0;
  let gozluLamelSelectedProduct: SelectedProduct | null = null;
  
  if (hasGozluLamel && gozluLamelHeight > 0) {
    const gozluLamelCount = calculateLamelCount(gozluLamelHeight, "se_78", boxHeight);
    // Gözlü lamel için renk: "alüminyum" (product-prices.json'da color: "alüminyum")
    const [gozluPrice, gozluProduct] = findLamelPrice(
      prices,
      "se_78",
      "alüminyum", // Gözlü lamel için alüminyum rengi kullan
      gozluLamelCount,
      lamelGenisligi
    );
    gozluLamelPrice += gozluPrice;
    if (gozluProduct) {
      // Gözlü lamel için açıklama ekle
      gozluLamelSelectedProduct = {
        ...gozluProduct,
        description: `${gozluProduct.description} (Gözlü: ${gozluLamelBaslangic}-${gozluLamelBitis}mm)`,
      };
    } else {
      // Gözlü lamel bulunamadıysa hata ekle
      errors.push("Gözlü lamel ürünü bulunamadı (se_78, alüminyum)");
    }
  }

  // Alt parça fiyatı hesapla
  // Excel'e göre: "Lamel Genişliği ile Aynı Sistem Adedi Kadar"
  // Alt parça ölçüsü lamel genişliği kadar olmalı, sistem genişliği değil!
  const sectionWidths = [lamelGenisligi]; // Sistem genişliği yerine lamel genişliği kullan
  const subPartResults = findSubPartPrice(
    prices,
    values.lamelType,
    "alüminyum",
    sectionWidths
  );

  const subPartPrice = subPartResults.reduce(
    (sum, result) => sum + result.price,
    0
  );
  const subPartSelectedProducts = subPartResults
    .map((result) => result.selectedProduct)
    .filter((p) => p !== null) as SelectedProduct[];

  // Dikme yüksekliği = sistem yüksekliği - kutu yüksekliği
  // Excel'e göre: "Dikme Boyu = Sistem Yüksekliği - Kutu Yüksekliği"
  const dikmeHeight = values.height - boxHeight; // + yerine - kullan

  const [dikmePrice, dikmeSelectedProduct] = findDikmePrice(
    prices,
    dikmeType,
    "alüminyum",
    dikmeHeight
  );

  // Kutu fiyatı hesapla - Hem ön hem arka kutu bileşenleri
  const {
    frontPrice,
    backPrice,
    selectedFrontBox,
    selectedBackBox,
  } = findBoxPrice(prices, boxType, "alüminyum", systemWidth);
  const boxPrice = frontPrice + backPrice;

  // Motor fiyatı hesapla (sadece motorlu ise)
  // Motor seçimi tambur tipini değiştirebilir, bu yüzden önce motor seçilmeli
  let motorPrice = 0;
  let motorSelectedProduct: SelectedProduct | null = null;
  if (values.movementType === "motorlu") {
    // Sistem alanını hesapla (m²)
    const systemAreaM2 = (systemWidth * systemHeight) / 1000000;
    
    // Excel tablosuna göre uygun motoru seç
    // Önce mevcut tambur tipine göre kontrol et
    let selectedMotorModel = selectKepenkMotor(
      values.lamelType,
      systemAreaM2,
      tamburType
    );

    // Eğer uygun motor bulunamazsa ve 77'lik lamel ise, 102mm tambur motorlarını da kontrol et
    if (!selectedMotorModel && !is100mm) {
      const alternativeTamburType = "102mm";
      selectedMotorModel = selectKepenkMotor(
        values.lamelType,
        systemAreaM2,
        alternativeTamburType
      );
      
      // Eğer 102mm tambur motorları uygunsa, tambur tipini güncelle
      if (selectedMotorModel) {
        tamburType = alternativeTamburType;
      }
    }

    if (selectedMotorModel) {
      [motorPrice, motorSelectedProduct] = findMotorPrice(
        prices,
        selectedMotorModel,
        "reduktorlu"
      );
    } else {
      // Uygun motor bulunamazsa hata ver ve motor seçme
      errors.push(
        `Uygun motor bulunamadı. Sistem alanı (${systemAreaM2.toFixed(2)} m²) mevcut motor kapasitelerini aşıyor. Lütfen sistem ölçülerini küçültün veya farklı bir lamel tipi seçin.`
      );
      // Motor seçilmedi, motorPrice ve motorSelectedProduct zaten 0 ve null
    }
  }

  // Tambur fiyatı hesapla (motor seçiminden sonra, tambur tipi güncellenmiş olabilir)
  // Motorlu sistemlerde tambur ölçüsünden 6 cm (60mm) düşülür
  const tamburOlcusu = values.movementType === "motorlu" 
    ? systemWidth - 60 
    : systemWidth;
  
  const [tamburPrice, tamburSelectedProduct] = findTamburPrice(
    prices,
    tamburType,
    values.lamelType,
    tamburOlcusu
  );

  // Aksesuar fiyatlarını hesapla
  const accessoryTotalPrice = accessoryItems.reduce(
    (sum, acc) => sum + (acc.totalPrice || 0),
    0
  );

  // Toplam fiyat (aksesuarlar dahil)
  const totalPrice =
    lamelPrice +
    gozluLamelPrice +
    subPartPrice +
    dikmePrice +
    boxPrice +
    tamburPrice +
    motorPrice +
    accessoryTotalPrice;

  // Seçili ürünleri topla
  const products: SelectedProduct[] = [
    lamelSelectedProduct,
    gozluLamelSelectedProduct,
    ...subPartSelectedProducts,
    dikmeSelectedProduct,
    selectedBackBox, // Arka kutu
    selectedFrontBox, // Ön kutu
    tamburSelectedProduct,
    motorSelectedProduct,
  ].filter((p) => p !== null && p !== undefined) as SelectedProduct[];

  return {
    totalPrice,
    selectedProducts: {
      products,
      accessories: accessoryItems,
    },
    errors,
  };
};

