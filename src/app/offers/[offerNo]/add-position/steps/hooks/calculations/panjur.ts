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
  findMonoblokBoxPrice,
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
  findYalitimliBoxPrice,
} from "@/utils/panjur";
import { findEffectiveSections } from "@/utils/shutter-calculations";
import { ProductTab } from "@/documents/products";

/**
 * Dikme adet sayısını pozisyona ve montaj tipine göre hesaplar
 * @param index Dikme pozisyon indeksi
 * @param totalDikmeCount Toplam dikme sayısı
 * @param optionId Montaj tipi ("monoblok" veya "distan")
 * @returns Dikme adet sayısı
 */
const calculateDikmeCountAtPosition = (
  index: number,
  totalDikmeCount: number,
  optionId: string
): number => {
  if (index === 0 || index === totalDikmeCount - 1) {
    // Sol ve sağ dikmeler: her zaman 1'er adet
    return 1;
  } else {
    // Orta dikmeler: monoblok için 1 adet, distan için 2 adet
    return optionId === "monoblok" ? 1 : 2;
  }
};

export const calculatePanjur = (
  values: PanjurSelections,
  prices: PriceItem[],
  accessoryItems: SelectedProduct[],
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionConnections: string[],
  sectionMotors: boolean[],
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
          values.dikmeType,
          optionId
        ),
        calculateDikmeHeight(
          sectionSystemHeights[0],
          values.boxType,
          values.dikmeType,
          optionId
        ),
      ];
    }

    const dikmeHeights: number[] = [];

    // Sol dikme (sadece ilk bölme)
    dikmeHeights.push(
      calculateDikmeHeight(
        sectionSystemHeights[0],
        values.boxType,
        values.dikmeType,
        optionId
      )
    );

    // Orta dikmeler (bitişik iki bölmenin maksimumu)
    for (let i = 0; i < sectionSystemHeights.length - 1; i++) {
      const maxHeight = Math.max(
        sectionSystemHeights[i],
        sectionSystemHeights[i + 1]
      );
      dikmeHeights.push(
        calculateDikmeHeight(
          maxHeight,
          values.boxType,
          values.dikmeType,
          optionId
        )
      );
    }

    // Sağ dikme (sadece son bölme)
    dikmeHeights.push(
      calculateDikmeHeight(
        sectionSystemHeights[sectionSystemHeights.length - 1],
        values.boxType,
        values.dikmeType,
        optionId
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
    const [, lamelSelectedProduct] = findLamelPrice(
      prices,
      values.lamelTickness,
      values.lamelType,
      values.lamel_color,
      lamelCount,
      lamelGenisligi
    );

    // createSelectedProduct zaten totalPrice'ı doğru hesaplıyor, onu kullan
    const sectionLamelPrice = lamelSelectedProduct?.totalPrice ?? 0;
    totalLamelPrice += sectionLamelPrice;

    if (lamelSelectedProduct) {
      // Bölme bilgisini ekleyerek ürünü kaydet
      lamelSelectedProducts.push({
        ...lamelSelectedProduct,
        description: `${lamelSelectedProduct.description} (Bölme ${index + 1})`,
        // totalPrice zaten doğru hesaplanmış, override etme
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
    // Dikme adet sayısını pozisyona ve montaj tipine göre belirle
    const dikmeCountAtPosition = calculateDikmeCountAtPosition(
      index,
      dikmeHeights.length,
      optionId
    );

    const dikmePosition =
      index === 0
        ? "Sol"
        : index === dikmeHeights.length - 1
        ? "Sağ"
        : `Orta (${index})`;

    const currentDikme =
      index === 0 || index === dikmeHeights.length - 1 ? "Yan" : "Orta";

    const [dikmeTotalPrice, dikmeSelectedProduct] = findDikmePrice(
      prices,
      values.dikmeType,
      values.dikme_color || values.lamel_color,
      dikmeCountAtPosition,
      dikmeHeight,
      optionId,
      currentDikme
    );

    // dikmeTotalPrice zaten ölçü ve adet dahil hesaplanmış fiyat
    const dikmePriceForThisPosition = dikmeTotalPrice;
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

  // Box price hesaplama - optionId'ye göre farklı fonksiyon kullan
  let boxPrice = 0;
  const boxSelectedProducts: SelectedProduct[] = [];

  if (optionId === "monoblok") {
    // Monoblok için yeni fonksiyon kullan
    const { totalPrice, selectedProducts } = findMonoblokBoxPrice(
      prices,
      values.boxType,
      values.box_color,
      systemWidth
    );
    boxPrice = totalPrice;
    boxSelectedProducts.push(...selectedProducts);
  } else if (optionId === "yalitimli") {
    // Yalıtımlı için yeni fonksiyon
    const { totalPrice, selectedProducts } = findYalitimliBoxPrice(
      prices,
      values.boxType,
      values.box_color,
      systemWidth,
      values.boxsetType,
      values.yalitimliType,
      values.lamel_color // Kompozit kapama için lamel rengi kullanılacak
    );
    boxPrice = totalPrice;
    boxSelectedProducts.push(...selectedProducts);
  } else {
    // Distan için eski fonksiyon kullan
    const { frontPrice, backPrice, selectedFrontBox, selectedBackBox } =
      findBoxPrice(prices, values.boxType, values.box_color, systemWidth);
    boxPrice = frontPrice + backPrice;

    // Distan box ürünlerini de boxSelectedProducts'a ekle
    if (selectedFrontBox) boxSelectedProducts.push(selectedFrontBox);
    if (selectedBackBox) boxSelectedProducts.push(selectedBackBox);
  }

  // Get the movement tab
  const movementTab = availableTabs?.find((tab) => tab.id === "movement");

  // Uzaktan kumanda fiyatı hesaplama
  const [remotePrice, remoteSelectedProduct] = findRemotePrice(
    prices,
    values.remote,
    movementTab
  );

  // Akıllı ev sistemi fiyatlandırması
  const [smarthomePrice, smarthomeSelectedProduct] = findSmartHomePrice(
    prices,
    values.smarthome
  );

  // Calculate receiver price
  const [receiverPrice, receiverSelectedProduct] = findReceiverPrice(
    prices,
    values.receiver,
    movementTab
  );

  // Tambur Profili fiyatı hesaplama
  // Motor sorumluluklarını sectionConnections'a göre hesapla
  // Ham genişliklerle grupları bul
  const rawGroups = findEffectiveSections(
    values.width,
    values.width, // totalHeight yerine totalWidth kullanıyoruz (eski davranışı korumak için)
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    false // Tüm grupları döndür
  ) as Array<{ sectionIndices: number[]; width: number; height: number }>;

  // Sistem genişlikleriyle yeniden hesapla
  const allEffectiveGroups = rawGroups.map((group) => {
    // Bu gruptaki bölmelerin sistem genişliklerini topla
    const totalSystemWidth = group.sectionIndices.reduce(
      (total, sectionIndex) => {
        return total + sectionSystemWidths[sectionIndex];
      },
      0
    );

    return {
      ...group,
      width: totalSystemWidth, // Ham genişlik yerine sistem genişliği kullan
    };
  });

  // Sadece motor/makara bulunan grupları filtrele
  // Bir grupta en az bir bölmede motor var ise o grup tambur/motor/makara gerektirir
  const motorResponsibleGroups = allEffectiveGroups.filter((group) => {
    // Bu grupta en az bir bölmede motor/makara var mı kontrol et
    return group.sectionIndices.some(
      (sectionIndex) => sectionMotors[sectionIndex] === true
    );
  });

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
      // Dikme adet sayısını pozisyona ve montaj tipine göre belirle
      const dikmeCountAtPosition = calculateDikmeCountAtPosition(
        index,
        dikmeHeights.length,
        optionId
      );

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

  // Paketleme ücreti hesaplama
  const calculatePackagingCost = (basePrice: number): number => {
    if (values.packagingType === "var") {
      return basePrice * 0.05; // %5
    }
    return 0;
  };

  const rawTotalPriceEUR = (() => {
    // Yalıtımlı kutu için özel hesaplama
    if (optionId === "yalitimli") {
      if (values.boxsetType === "boxWithMotor") {
        // Sadece tambur ve kutu fiyatı
        return tamburPrice + boxPrice;
      } else if (values.boxsetType === "emptyBox") {
        // Boş kutu: lamel, dikme, alt parça, kutu dahil, tambur ve motor hariç
        return (
          totalLamelPrice +
          subPartPrice +
          totalDikmePrice +
          boxPrice +
          yukseltmeProfiliPrice +
          remotePrice +
          smarthomePrice +
          receiverPrice +
          (accessoryItems || [])
            .filter((acc) => {
              const description = acc.description.toLowerCase();
              // Sadece yan kapak aksesuarları, kutu ile ilgili diğer aksesuarlar hariç
              return (
                description.includes("yan kapak") &&
                !description.includes("fullset t sac") &&
                !description.includes("pimli galvaniz") &&
                !description.includes("kompozit") &&
                !description.includes("orta kapak")
              );
            })
            .reduce(
              (total: number, acc: SelectedProduct) => total + acc.totalPrice,
              0
            )
        );
      } else if (values.yalitimliType === "detail") {
        if (values.yalitimliDetailType === "withoutBox") {
          // Kutu, kutu bileşenleri, tambur ve (motor/makara) hariç - sadece lamel, dikme, alt parça
          return (
            totalLamelPrice +
            subPartPrice +
            totalDikmePrice +
            yukseltmeProfiliPrice +
            remotePrice +
            smarthomePrice +
            receiverPrice +
            (accessoryItems || [])
              .filter((acc) => {
                const description = acc.description.toLowerCase();
                return !(
                  description.includes("kutu") ||
                  description.includes("tambur") ||
                  description.includes("boru") ||
                  description.includes("motor") ||
                  description.includes("makara") ||
                  description.includes("kasnak")
                );
              })
              .reduce(
                (total: number, acc: SelectedProduct) => total + acc.totalPrice,
                0
              )
          );
        } else if (values.yalitimliDetailType === "onlyMotor") {
          // Kutu ve kutu bileşenleri hariç, tambur ve (motor/makara) dahil
          return (
            totalLamelPrice +
            subPartPrice +
            totalDikmePrice +
            tamburPrice +
            yukseltmeProfiliPrice +
            remotePrice +
            smarthomePrice +
            receiverPrice +
            (accessoryItems || [])
              .filter((acc) => {
                const description = acc.description.toLowerCase();
                return !description.includes("kutu");
              })
              .reduce(
                (total: number, acc: SelectedProduct) => total + acc.totalPrice,
                0
              )
          );
        }
      }
    }

    // Diğer durumlar için normal hesaplama
    return (
      totalLamelPrice +
      subPartPrice +
      totalDikmePrice +
      boxPrice +
      tamburPrice +
      yukseltmeProfiliPrice +
      remotePrice +
      smarthomePrice +
      receiverPrice +
      (accessoryItems || []).reduce(
        (total: number, acc: SelectedProduct) => total + acc.totalPrice,
        0
      )
    );
  })();

  // Paketleme ücreti hesaplama ve ekleme
  const packagingCost = calculatePackagingCost(rawTotalPriceEUR);
  const totalPrice = rawTotalPriceEUR + packagingCost;

  // Paketleme selectedProduct'ını oluştur
  const packagingSelectedProduct: SelectedProduct | null =
    packagingCost > 0
      ? {
          stock_code: "PAKET-001",
          description: "Paketleme Ücreti (%5)",
          uretici_kodu: "PAKET-001",
          price: packagingCost.toString(),
          quantity: 1,
          totalPrice: packagingCost,
          type: "packaging",
          color: "",
          unit: "adet",
        }
      : null;

  // Tüm ürünleri birleştir (aksesuarlar hariç) - yalıtımlı kutu için özel filtreleme
  const productItems = (() => {
    if (optionId === "yalitimli") {
      if (values.boxsetType === "boxWithMotor") {
        // Sadece tambur ve kutu ürünleri
        return [...boxSelectedProducts, ...tamburSelectedProducts].filter(
          (product): product is SelectedProduct =>
            product !== null && product !== undefined
        );
      } else if (values.boxsetType === "emptyBox") {
        // Boş kutu: lamel, dikme, alt parça, kutu dahil, tambur ve motor hariç
        return [
          ...lamelSelectedProducts,
          ...subPartSelectedProducts,
          ...dikmeSelectedProducts,
          ...boxSelectedProducts,
          ...yukseltmeProfiliSelectedProducts,
          remoteSelectedProduct,
          smarthomeSelectedProduct,
          receiverSelectedProduct,
        ].filter(
          (product): product is SelectedProduct =>
            product !== null && product !== undefined
        );
      } else if (values.yalitimliType === "detail") {
        if (values.yalitimliDetailType === "withoutBox") {
          // Kutu, tambur hariç - sadece lamel, dikme, alt parça, yükseltme profili
          return [
            ...lamelSelectedProducts,
            ...subPartSelectedProducts,
            ...dikmeSelectedProducts,
            ...yukseltmeProfiliSelectedProducts,
            remoteSelectedProduct,
            smarthomeSelectedProduct,
            receiverSelectedProduct,
          ].filter(
            (product): product is SelectedProduct =>
              product !== null && product !== undefined
          );
        } else if (values.yalitimliDetailType === "onlyMotor") {
          // Kutu hariç, tambur dahil
          return [
            ...lamelSelectedProducts,
            ...subPartSelectedProducts,
            ...dikmeSelectedProducts,
            ...tamburSelectedProducts,
            ...yukseltmeProfiliSelectedProducts,
            remoteSelectedProduct,
            smarthomeSelectedProduct,
            receiverSelectedProduct,
          ].filter(
            (product): product is SelectedProduct =>
              product !== null && product !== undefined
          );
        }
      }
    }

    // Diğer durumlar için normal ürün listesi
    return [
      ...lamelSelectedProducts,
      ...subPartSelectedProducts,
      ...dikmeSelectedProducts,
      ...boxSelectedProducts, // Hem monoblok hem distan box ürünleri
      ...tamburSelectedProducts,
      ...yukseltmeProfiliSelectedProducts,
      remoteSelectedProduct,
      smarthomeSelectedProduct,
      receiverSelectedProduct,
    ].filter(
      (product): product is SelectedProduct =>
        product !== null && product !== undefined
    );
  })();

  const selectedProducts = {
    products: productItems,
    accessories: (() => {
      // Yalıtımlı kutu için aksesuarları da filtrele
      if (optionId === "yalitimli") {
        if (values.boxsetType === "boxWithMotor") {
          // Sadece tambur ve kutu ile ilgili aksesuarlar
          const filteredAccessories = (accessoryItems || []).filter((acc) => {
            const description = acc.description.toLowerCase();
            return (
              description.includes("boru") ||
              description.includes("tambur") ||
              description.includes("kutu") ||
              description.includes("motor") ||
              description.includes("yan kapak") ||
              description.includes("orta kapak") ||
              description.includes("fullset t sac") ||
              description.includes("pimli galvaniz")
            );
          });
          // Paketleme ücretini ekle
          return packagingSelectedProduct
            ? [...filteredAccessories, packagingSelectedProduct]
            : filteredAccessories;
        } else if (values.boxsetType === "emptyBox") {
          // EmptyBox için sadece yan kapak aksesuarları (full T sac ve plaket yok)
          const filteredAccessories = (accessoryItems || []).filter((acc) => {
            const description = acc.description.toLowerCase();
            return (
              description.includes("yan kapak")
              // fullset t sac ve pimli galvaniz (plaket) çıkarıldı
            );
          });
          // Paketleme ücretini ekle
          return packagingSelectedProduct
            ? [...filteredAccessories, packagingSelectedProduct]
            : filteredAccessories;
        } else if (values.yalitimliType === "detail") {
          if (values.yalitimliDetailType === "withoutBox") {
            // Kutu, tambur, motor/makara aksesuarları hariç
            const filteredAccessories = (accessoryItems || []).filter((acc) => {
              const description = acc.description.toLowerCase();
              return !(
                description.includes("kutu") ||
                description.includes("tambur") ||
                description.includes("boru") ||
                description.includes("motor") ||
                description.includes("makara") ||
                description.includes("kasnak") ||
                description.includes("yan kapak") ||
                description.includes("orta kapak") ||
                description.includes("fullset t sac") ||
                description.includes("pimli galvaniz")
              );
            });
            // Paketleme ücretini ekle
            return packagingSelectedProduct
              ? [...filteredAccessories, packagingSelectedProduct]
              : filteredAccessories;
          } else if (values.yalitimliDetailType === "onlyMotor") {
            // Kutu aksesuarları hariç, tambur ve motor/makara aksesuarları dahil
            const filteredAccessories = (accessoryItems || []).filter((acc) => {
              const description = acc.description.toLowerCase();
              return !(
                description.includes("kutu") ||
                description.includes("yan kapak") ||
                description.includes("orta kapak") ||
                description.includes("fullset t sac") ||
                description.includes("pimli galvaniz")
              );
            });
            // Paketleme ücretini ekle
            return packagingSelectedProduct
              ? [...filteredAccessories, packagingSelectedProduct]
              : filteredAccessories;
          }
        }
      }

      // Diğer durumlar için tüm aksesuarlar
      const baseAccessories = accessoryItems || [];
      // Paketleme ücretini aksesuarlar listesine ekle
      return packagingSelectedProduct
        ? [...baseAccessories, packagingSelectedProduct]
        : baseAccessories;
    })(),
  };

  return {
    totalPrice,
    selectedProducts,
    errors,
  };
};
