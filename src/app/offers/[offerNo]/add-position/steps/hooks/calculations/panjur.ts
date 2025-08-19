import {
  PriceItem,
  CalculationResult,
  SelectedProduct,
  PanjurSelections,
} from "@/types/panjur";
import {
  findLamelPrice,
  findSubPartPriceWithWidths,
  findDikmePrice,
  findBoxPrice,
  findSmartHomePrice,
  findRemotePrice,
  findReceiverPrice,
  findTamburProfiliAccessoryPrice,
  findYukseltmeProfiliPrice,
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
  findSectionWidths,
} from "@/utils/panjur";
import { findEffectiveSections } from "@/utils/shutter-calculations";
import { ProductTab } from "@/documents/products";

export const calculatePanjur = (
  values: PanjurSelections,
  prices: PriceItem[],
  accessories: PriceItem[],
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[],
  optionId: string,
  availableTabs?: ProductTab[]
): CalculationResult => {
  const errors: string[] = [];

  const systemWidth = calculateSystemWidth(
    values.width,
    values.dikmeOlcuAlmaSekli,
    values.dikmeType
  );

  // Her bölmenin genişliklerini hesapla
  const sectionWidths = findSectionWidths(middleBarPositions, values.width);

  // Her bölme için sistem genişliklerini hesapla
  const sectionSystemWidths = sectionWidths.map((sectionWidth) =>
    calculateSystemWidth(
      sectionWidth,
      values.dikmeOlcuAlmaSekli,
      values.dikmeType
    )
  );
  // Her bölme için sistem yüksekliklerini hesapla
  const sectionSystemHeights = sectionHeights.map((sectionHeight) =>
    calculateSystemHeight(
      sectionHeight,
      values.kutuOlcuAlmaSekli,
      values.boxType
    )
  );

  // Her dikme için yüksekliği hesapla (bitişik bölmelerin maksimumuna göre)
  const calculateDikmeHeightsForSections = (
    sectionSystemHeights: number[]
  ): number[] => {
    if (sectionSystemHeights.length === 1) {
      // Tek bölme: sadece o bölmenin yüksekliği
      return [
        calculateDikmeHeight(
          sectionSystemHeights[0],
          values.boxType,
          values.dikmeType
        ),
        calculateDikmeHeight(
          sectionSystemHeights[0],
          values.boxType,
          values.dikmeType
        ),
      ];
    }

    const dikmeHeights: number[] = [];

    // Sol dikme (sadece ilk bölme)
    dikmeHeights.push(
      calculateDikmeHeight(
        sectionSystemHeights[0],
        values.boxType,
        values.dikmeType
      )
    );

    // Orta dikmeler (bitişik iki bölmenin maksimumu)
    for (let i = 0; i < sectionSystemHeights.length - 1; i++) {
      const maxHeight = Math.max(
        sectionSystemHeights[i],
        sectionSystemHeights[i + 1]
      );
      dikmeHeights.push(
        calculateDikmeHeight(maxHeight, values.boxType, values.dikmeType)
      );
    }

    // Sağ dikme (sadece son bölme)
    dikmeHeights.push(
      calculateDikmeHeight(
        sectionSystemHeights[sectionSystemHeights.length - 1],
        values.boxType,
        values.dikmeType
      )
    );

    return dikmeHeights;
  };

  const dikmeHeights = calculateDikmeHeightsForSections(sectionSystemHeights);

  // Her bölme için lamel genişlikleri
  const sectionLamelWidths = sectionSystemWidths.map(
    (sectionSystemWidth, index) =>
      calculateLamelGenisligi(
        sectionSystemWidth,
        values.dikmeType,
        optionId,
        index,
        sectionSystemWidths.length
      )
  );

  // Her bölme için lamel sayıları
  const sectionLamelCounts = sectionSystemHeights.map((sectionSystemHeight) =>
    calculateLamelCount(
      sectionSystemHeight,
      values.boxType,
      values.lamelTickness
    )
  );

  // Price calculations - her bölme için ayrı hesapla
  let totalLamelPrice = 0;
  const lamelSelectedProducts: SelectedProduct[] = [];

  // Her bölme için lamel fiyatı hesapla
  sectionLamelWidths.forEach((lamelGenisligi, index) => {
    const lamelCount = sectionLamelCounts[index];
    const [lamelUnitPrice, lamelSelectedProduct] = findLamelPrice(
      prices,
      values.lamelTickness,
      values.lamelType,
      values.lamel_color,
      lamelCount,
      lamelGenisligi
    );

    const lamelGenisligiMetre = lamelGenisligi / 1000;
    const sectionLamelPrice = lamelUnitPrice * lamelGenisligiMetre * lamelCount;
    totalLamelPrice += sectionLamelPrice;

    if (lamelSelectedProduct) {
      // Bölme bilgisini ekleyerek ürünü kaydet
      lamelSelectedProducts.push({
        ...lamelSelectedProduct,
        description: `${lamelSelectedProduct.description} (Bölme ${index + 1})`,
        totalPrice: sectionLamelPrice,
      });
    }
  });

  // Alt parça fiyatı hesaplama - sectionLamelWidths kullanarak optimize edilmiş
  const subPartResults = findSubPartPriceWithWidths(
    prices,
    values.subPart,
    values.subPart_color || values.lamel_color,
    sectionLamelWidths
  );

  // Toplam alt parça fiyatı ve ürünleri
  const subPartPrice = subPartResults.reduce((sum, r) => sum + r.price, 0);
  // Alt parça ürünlerini topluca ekle
  const subPartSelectedProducts: SelectedProduct[] = subPartResults
    .map((r) => r.selectedProduct)
    .filter((p): p is SelectedProduct => !!p);

  // Dikme fiyatı hesaplama - pozisyona göre adet sayısı
  let totalDikmePrice = 0;
  const dikmeSelectedProducts: SelectedProduct[] = [];

  // Her dikme pozisyonu için fiyat hesapla
  dikmeHeights.forEach((dikmeHeight: number, index: number) => {
    // Dikme adet sayısını pozisyona göre belirle
    const dikmeCountAtPosition =
      index === 0 || index === dikmeHeights.length - 1
        ? 1 // Sol ve sağ dikmeler: 1'er adet
        : 2; // Orta dikmeler: 2'şer adet

    const dikmePosition =
      index === 0
        ? "Sol"
        : index === dikmeHeights.length - 1
        ? "Sağ"
        : `Orta (${index})`;

    const currentDikme =
      index === 0 || index === dikmeHeights.length - 1 ? "Yan" : "Orta";

    const [dikmeUnitPrice, dikmeSelectedProduct] = findDikmePrice(
      prices,
      values.dikmeType,
      values.dikme_color || values.lamel_color,
      dikmeCountAtPosition,
      dikmeHeight,
      optionId,
      currentDikme
    );

    const dikmePriceForThisPosition = dikmeUnitPrice * dikmeCountAtPosition;
    totalDikmePrice += dikmePriceForThisPosition;

    if (dikmeSelectedProduct) {
      // Dikme pozisyon bilgisini ekleyerek ürünü kaydet

      const adetText = dikmeSelectedProduct.quantity + " Adet";

      dikmeSelectedProducts.push({
        ...dikmeSelectedProduct,
        description: `${dikmeSelectedProduct.description} (${dikmePosition} Dikme - ${adetText})`,
        totalPrice: dikmePriceForThisPosition,
      });
    }
  });

  const { frontPrice, backPrice, selectedFrontBox, selectedBackBox } =
    findBoxPrice(prices, values.boxType, values.box_color, systemWidth);
  const boxPrice = frontPrice + backPrice;

  // Uzaktan kumanda fiyatı hesaplama
  const [remotePrice, remoteSelectedProduct] = findRemotePrice(
    prices,
    values.remote
  );

  // Akıllı ev sistemi fiyatlandırması
  const [smarthomePrice, smarthomeSelectedProduct] = findSmartHomePrice(
    prices,
    values.smarthome
  );

  // Get the movement tab
  const movementTab = availableTabs?.find((tab) => tab.id === "movement");

  // Calculate receiver price
  const [receiverPrice, receiverSelectedProduct] = findReceiverPrice(
    prices,
    values.receiver,
    movementTab
  );

  // Tambur Profili fiyatı hesaplama
  // Motor sorumluluklarını sectionConnections'a göre hesapla
  const motorResponsibleGroups = findEffectiveSections(
    values.width,
    values.width, // totalHeight yerine totalWidth kullanıyoruz (eski davranışı korumak için)
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    false // Tüm grupları döndür
  ) as Array<{ sectionIndices: number[]; width: number; height: number }>;

  // Her motor/makara grubu için tambur profili fiyatı hesapla
  let totalTamburPrice = 0;
  const tamburSelectedProducts: SelectedProduct[] = [];

  // Manuel ve motorlu durumda her grup için ayrı tambur
  motorResponsibleGroups.forEach((group, groupIndex) => {
    const [unitTamburPrice, tamburSelectedProduct] =
      findTamburProfiliAccessoryPrice(prices, values.movementType, group.width);

    if (tamburSelectedProduct) {
      const sectionInfo = group.sectionIndices
        .map((s) => `Bölme ${s + 1}`)
        .join(", ");

      const groupName =
        values.movementType === "manuel"
          ? `Makara ${groupIndex + 1}`
          : `Motor ${groupIndex + 1}`;

      tamburSelectedProducts.push({
        ...tamburSelectedProduct,
        description: `${tamburSelectedProduct.description} (${groupName} - ${sectionInfo})`,
        totalPrice: unitTamburPrice,
      });
    }

    totalTamburPrice += unitTamburPrice;
  });

  const tamburPrice = totalTamburPrice;

  // Yükseltme Profili fiyatı hesaplama (dikmeAdapter === "double_sided" veya "triple_sided" ise)
  let yukseltmeProfiliPrice = 0;
  const yukseltmeProfiliSelectedProducts: SelectedProduct[] = [];

  if (["double_sided", "triple_sided"].includes(values.dikmeAdapter)) {
    // Dikey yükseltme profilleri - her dikme pozisyonu için
    dikmeHeights.forEach((dikmeHeight: number, index: number) => {
      // Dikme adet sayısını pozisyona göre belirle
      const dikmeCountAtPosition =
        index === 0 || index === dikmeHeights.length - 1
          ? 1 // Sol ve sağ dikmeler: 1'er adet
          : 2; // Orta dikmeler: 2'şer adet

      // Yükseltme profili dikme yüksekliğine göre değil, sistem yüksekliğine göre hesaplanıyor
      // Bu yüzden dikme pozisyonuna karşılık gelen sistem yüksekliğini bulmalıyız
      let relevantSystemHeight: number;
      if (index === 0) {
        // Sol dikme - ilk bölmenin sistem yüksekliği
        relevantSystemHeight = sectionSystemHeights[0];
      } else if (index === dikmeHeights.length - 1) {
        // Sağ dikme - son bölmenin sistem yüksekliği
        relevantSystemHeight =
          sectionSystemHeights[sectionSystemHeights.length - 1];
      } else {
        // Orta dikme - bitişik iki bölmenin maksimumu
        relevantSystemHeight = Math.max(
          sectionSystemHeights[index - 1],
          sectionSystemHeights[index]
        );
      }

      const [sectionYukseltmePrice, sectionYukseltmeSelectedProduct] =
        findYukseltmeProfiliPrice(
          prices,
          values.dikme_color || values.lamel_color,
          dikmeCountAtPosition,
          relevantSystemHeight
        );

      yukseltmeProfiliPrice += sectionYukseltmePrice;

      if (sectionYukseltmeSelectedProduct) {
        // Dikme pozisyon bilgisini ekleyerek ürünü kaydet
        const dikmePosition =
          index === 0
            ? "Sol"
            : index === dikmeHeights.length - 1
            ? "Sağ"
            : `Orta (${index})`;

        const adetText = dikmeCountAtPosition === 1 ? "1 Adet" : "2 Adet";

        yukseltmeProfiliSelectedProducts.push({
          ...sectionYukseltmeSelectedProduct,
          description: `${sectionYukseltmeSelectedProduct.description} (${dikmePosition} Dikme - ${adetText})`,
          totalPrice: sectionYukseltmePrice,
        });
      }
    });

    // Triple sided için ek yatay yükseltme profili (üst tarafa)
    if (values.dikmeAdapter === "triple_sided") {
      const [yatayYukseltmePrice, yatayYukseltmeSelectedProduct] =
        findYukseltmeProfiliPrice(
          prices,
          values.dikme_color || values.lamel_color,
          1, // 1 adet
          values.width // Yatay profil için sistem genişliği kullanılıyor
        );

      yukseltmeProfiliPrice += yatayYukseltmePrice;

      if (yatayYukseltmeSelectedProduct) {
        yukseltmeProfiliSelectedProducts.push({
          ...yatayYukseltmeSelectedProduct,
          description: `${yatayYukseltmeSelectedProduct.description} (Üst Yatay Profil - 1 Adet)`,
          totalPrice: yatayYukseltmePrice,
        });
      }
    }
  }

  // Aksesuarların fiyatını hesapla
  const accessoriesPrice = (accessories || []).reduce((total, acc) => {
    return total + parseFloat(acc.price) * (acc.quantity || 1);
  }, 0);

  const rawTotalPriceEUR =
    totalLamelPrice +
    subPartPrice +
    totalDikmePrice +
    boxPrice +
    tamburPrice +
    yukseltmeProfiliPrice +
    remotePrice +
    smarthomePrice +
    receiverPrice +
    accessoriesPrice;

  const totalPrice = rawTotalPriceEUR;

  // Aksesuarları SelectedProduct formatına dönüştür ve tüm ürünleri birleştir
  const productItems = [
    ...lamelSelectedProducts,
    ...subPartSelectedProducts,
    ...dikmeSelectedProducts,
    selectedFrontBox,
    selectedBackBox,
    ...tamburSelectedProducts,
    ...yukseltmeProfiliSelectedProducts,
    remoteSelectedProduct,
    smarthomeSelectedProduct,
    receiverSelectedProduct,
  ].filter(
    (product): product is SelectedProduct =>
      product !== null && product !== undefined
  );

  const selectedProducts = {
    products: productItems,
    accessories: accessories || [],
  };

  return {
    totalPrice,
    selectedProducts,
    errors,
  };
};
