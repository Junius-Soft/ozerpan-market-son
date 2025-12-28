import { PanjurSelections, PriceItem, SelectedProduct } from "@/types/panjur";
import {
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
  createSelectedProduct,
} from "@/utils/panjur";
import { calculateSectionWidths } from "@/utils/shutter-calculations";
import {
  findYanKapakAccessoryPrice,
  findMonoblokYanKapakAccessoryPrice,
  findMonoblokEkAksesuarlar,
  findYalitimliYanKapakAccessoryPrice,
  findYalitimliEkAksesuarlar,
  findBoruBasiAccessoryPrice,
  findRulmanAccessoryPrice,
  findPlaketAccessoryPrice,
  findKasnakAccessoryPrice,
  findWindeMakaraAccessoryPrice,
  findKordonMakaraAccessoryPrice,
  findAccessoryByName,
  findPvcTapaAccessoryPrice,
  findZimbaTeliAccessoryPrice,
  findCelikAskiAccessoryPrice,
  findAltParcaLastigiAccessoryPrice,
  findStoperKonikAccessoryPrice,
  findKilitliAltParcaAccessories,
  findDengeMakarasiAccessoryPrice,
  findMiniDikmeAccessories,
  findMotorPrice,
} from "@/utils/accessory";

export const calculatePanjurAccessories = (
  values: PanjurSelections,
  allAccessories: PriceItem[],
  middleBarPositions: number[],
  sectionHeights: number[],
  sectionMotors: boolean[],
  sectionCount: string | null,
  optionId: string
): SelectedProduct[] => {
  const neededAccessories: SelectedProduct[] = [];

  // Dikme sayısı hesaplama - optionId'ye göre farklı
  const dikmeCount = (() => {
    const sectionCountNum = Number(sectionCount);
    if (optionId === "distan") {
      // Distan için: her bölme için 2 dikme (sol + sağ)
      return sectionCountNum * 2;
    } else {
      // Monoblok ve yalıtımlı için: 2 yan dikme + (bölme sayısı - 1) orta dikme
      return 2 + (sectionCountNum - 1);
    }
  })();

  const calculateMotorQuantity = () => {
    return sectionMotors.filter((motor) => motor).length;
  };

  const width = calculateSystemWidth(
    values.width,
    values.dikmeOlcuAlmaSekli,
    values.dikmeType
  );
  const height = calculateSystemHeight(
    values.height,
    values.kutuOlcuAlmaSekli,
    values.boxType
  );

  // Yan Kapak - optionId'ye göre farklı fonksiyon kullan
  if (optionId === "monoblok") {
    // Monoblok için yeni fonksiyonlar
    const monoblokYanKapaklar = findMonoblokYanKapakAccessoryPrice(
      allAccessories,
      values.box_color,
      values.boxType
    );
    neededAccessories.push(...monoblokYanKapaklar);

    // Monoblok ek aksesuarları
    const monoblokEkAksesuarlar = findMonoblokEkAksesuarlar(
      allAccessories,
      values.boxType,
      values.box_color,
      dikmeCount
    );
    neededAccessories.push(...monoblokEkAksesuarlar);
  } else if (optionId === "yalitimli") {
    // Yalıtımlı kutu için yeni fonksiyon
    // EmptyBox durumunda sadece yan kapak, orta kapak yok
    const yalitimliYanKapaklar = findYalitimliYanKapakAccessoryPrice(
      allAccessories,
      values.boxType,
      values.box_color,
      dikmeCount,
      values.boxsetType === "emptyBox"
    );
    neededAccessories.push(...yalitimliYanKapaklar);

    // Yalıtımlı kutu ek aksesuarları (fullset T sac ve plaket)
    // EmptyBox durumunda bu aksesuarlar eklenmez
    if (values.boxsetType !== "emptyBox") {
      const yalitimliEkAksesuarlar = findYalitimliEkAksesuarlar(allAccessories);
      neededAccessories.push(...yalitimliEkAksesuarlar);
    }
  } else {
    // Distan için eski fonksiyon - bölme sayısı kadar
    const yanKapak = findYanKapakAccessoryPrice(
      allAccessories,
      values.boxType,
      values.box_color
    );
    if (yanKapak) {
      const selectedProduct = createSelectedProduct(
        yanKapak,
        middleBarPositions.length + 1
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Motorlu aksesuarlar
  if (values.movementType === "motorlu") {
    const boruBasi = findBoruBasiAccessoryPrice(allAccessories, "motorlu");
    if (boruBasi) {
      const selectedProduct = createSelectedProduct(
        boruBasi,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }

    const rulman = findRulmanAccessoryPrice(allAccessories);
    if (rulman) {
      const selectedProduct = createSelectedProduct(
        rulman,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }

    const plaket = findPlaketAccessoryPrice(
      allAccessories,
      values.boxType,
      values.movementType
    );
    if (plaket) {
      const selectedProduct = createSelectedProduct(
        plaket,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Manuel makaralı aksesuarlar
  if (values.movementType === "manuel" && values.manuelSekli === "makarali") {
    const boruBasi = findBoruBasiAccessoryPrice(allAccessories, "manuel");
    if (boruBasi) {
      const selectedProduct = createSelectedProduct(
        boruBasi,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }

    const kasnak = findKasnakAccessoryPrice(allAccessories, values.boxType);
    if (kasnak) {
      const selectedProduct = createSelectedProduct(
        kasnak,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }

    const rulman = findRulmanAccessoryPrice(allAccessories);
    if (rulman) {
      const selectedProduct = createSelectedProduct(
        rulman,
        calculateMotorQuantity() * 2
      );
      neededAccessories.push(selectedProduct);
    }

    const windeMakara = findWindeMakaraAccessoryPrice(allAccessories);
    if (windeMakara) {
      const selectedProduct = createSelectedProduct(
        windeMakara,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }

    const kordonMakara = findKordonMakaraAccessoryPrice(allAccessories);
    if (kordonMakara) {
      const selectedProduct = createSelectedProduct(
        kordonMakara,
        calculateMotorQuantity()
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Manuel redüktörlü aksesuarlar
  if (values.movementType === "manuel" && values.manuelSekli === "reduktorlu") {
    const redAksesuarlar = [
      {
        name: "40 boru başı rulmanlı siyah",
        quantity: calculateMotorQuantity(),
      },
      { name: "rulman 12x28", quantity: calculateMotorQuantity() },
      {
        name: "panjur redüktörü beyaz",
        quantity: calculateMotorQuantity(),
      },
      {
        name: "redüktör boru başı 40 mm-C 371 uyumlu",
        quantity: calculateMotorQuantity(),
      },
      {
        name: "Ara kol-C 371 uyumlu",
        quantity: calculateMotorQuantity(),
      },
      {
        name: "Çevirme kolu-1200 mm",
        quantity: calculateMotorQuantity(),
      },
    ];
    for (const acc of redAksesuarlar) {
      const found = findAccessoryByName(allAccessories, acc.name);
      if (found) {
        const selectedProduct = createSelectedProduct(found, acc.quantity);
        neededAccessories.push(selectedProduct);
      }
    }
  }

  // PVC Tapa ve Zımba Teli - her bölme için ayrı hesapla
  const pvcTapa = findPvcTapaAccessoryPrice(allAccessories, values.dikmeType);
  if (pvcTapa) {
    let totalTapaQuantity = 0;
    const sectionCount = middleBarPositions.length + 1;

    // Her bölme için lamel sayısını hesapla ve topla
    for (let i = 0; i < sectionCount; i++) {
      // Her bölmenin kendi yüksekliğini kullan, yoksa genel yüksekliği kullan
      const sectionHeight = sectionHeights[i] || height;
      const finalLamelCount = calculateLamelCount(
        sectionHeight,
        values.boxType,
        values.lamelTickness
      );
      const tapaQuantity =
        finalLamelCount % 2 === 0 ? finalLamelCount : finalLamelCount + 1;
      totalTapaQuantity += tapaQuantity;
    }

    const selectedProduct = createSelectedProduct(pvcTapa, totalTapaQuantity);
    neededAccessories.push(selectedProduct);

    const zimbaTeli = findZimbaTeliAccessoryPrice(allAccessories);
    if (zimbaTeli) {
      const selectedProduct = createSelectedProduct(
        zimbaTeli,
        totalTapaQuantity
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Çelik Askı - her bölme için ayrı hesapla
  const celikAski = findCelikAskiAccessoryPrice(
    allAccessories,
    values.dikmeType
  );
  if (celikAski) {
    const sectionWidths = calculateSectionWidths(width, middleBarPositions);
    let totalAskiQuantity = 0;

    sectionWidths.forEach((sectionWidth, sectionIndex) => {
      // Bölme indeksi ve toplam bölme sayısına göre dikme tiplerini belirle
      const lamelWidthForSection = calculateLamelGenisligi(
        sectionWidth,
        values.dikmeType,
        optionId,
        sectionIndex,
        sectionWidths.length
      );
      let askiQuantity = 2;
      if (lamelWidthForSection > 1000 && lamelWidthForSection <= 1500) {
        askiQuantity = 4;
      } else if (lamelWidthForSection > 1500 && lamelWidthForSection <= 2250) {
        askiQuantity = 6;
      } else if (lamelWidthForSection > 2250 && lamelWidthForSection <= 3500) {
        askiQuantity = 8;
      } else if (lamelWidthForSection > 3500) {
        askiQuantity = 10;
      }
      totalAskiQuantity += askiQuantity;
    });

    const selectedProduct = createSelectedProduct(celikAski, totalAskiQuantity);
    neededAccessories.push(selectedProduct);
  }

  // Alt Parça Lastiği - her bölme için ayrı hesapla
  const altParcaLastigi = findAltParcaLastigiAccessoryPrice(
    allAccessories,
    values.dikmeType
  );
  if (altParcaLastigi) {
    const sectionWidths = calculateSectionWidths(width, middleBarPositions);
    sectionWidths.forEach((sectionWidth, sectionIndex) => {
      // Bölme indeksi ve toplam bölme sayısına göre dikme tiplerini belirle
      const lamelWidthForSection = calculateLamelGenisligi(
        sectionWidth,
        values.dikmeType,
        optionId,
        sectionIndex,
        sectionWidths.length
      );
      // createSelectedProduct kullanarak tutarlı yapı oluştur
      const selectedProduct = createSelectedProduct(
        altParcaLastigi,
        1,
        lamelWidthForSection
      );
      selectedProduct.description = `${altParcaLastigi.description} (Bölme ${
        sectionIndex + 1
      })`;

      neededAccessories.push(selectedProduct);
    });
  }

  // Stoper Konik
  if (
    (values.lamelTickness === "39_sl" || values.lamelTickness === "45_se") &&
    values.movementType === "manuel" &&
    values.manuelSekli === "makarali"
  ) {
    const stoperKonik = findStoperKonikAccessoryPrice(allAccessories);
    if (stoperKonik) {
      const selectedProduct = createSelectedProduct(
        stoperKonik,
        Number(sectionCount) * 2
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Kilitli Alt Parça
  if (values.subPart === "kilitli_alt_parca") {
    const kilitliAccessories = findKilitliAltParcaAccessories(allAccessories);
    for (const acc of kilitliAccessories) {
      const selectedProduct = createSelectedProduct(acc, Number(sectionCount));
      neededAccessories.push(selectedProduct);
    }
  }

  // Lamel Denge Makarası
  if (values.dikmeType.startsWith("midi_") && values.boxType === "250mm") {
    const dengeMakarasi = findDengeMakarasiAccessoryPrice(allAccessories);
    if (dengeMakarasi) {
      const selectedProduct = createSelectedProduct(
        dengeMakarasi,
        Number(sectionCount)
      );
      neededAccessories.push(selectedProduct);
    }
  }

  // Mini dikme ve 39mm Alüminyum Poliüretanlı lamel aksesuarları
  if (
    values.dikmeType.startsWith("mini_") &&
    values.lamelTickness === "39_sl" &&
    values.lamelType === "aluminyum_poliuretanli"
  ) {
    const miniDikmeAccessories = findMiniDikmeAccessories(
      allAccessories,
      dikmeCount,
      values.movementType,
      values.makaraliTip ?? ""
    );
    neededAccessories.push(...miniDikmeAccessories);
  }

  // Motor fiyatı
  const selectedMotor = findMotorPrice(
    allAccessories,
    values.movementType,
    values.motorMarka,
    values.motorModel,
    values.motorSekli
  );
  if (selectedMotor) {
    const selectedProduct = createSelectedProduct(
      selectedMotor,
      calculateMotorQuantity()
    );
    neededAccessories.push(selectedProduct);
  }

  // Kıl Fitili ekle - her dikme için ayrı hesapla (her dikmenin sağında ve solunda)
  const kilFitiliName = "067x550 Standart Kıl Fitil";
  const kilFitili = allAccessories.find(
    (acc) => acc.description === kilFitiliName
  );
  if (kilFitili) {
    let totalKilFitiliLength = 0;
    const totalDikmeCount = middleBarPositions.length + 2; // sol dikme + orta dikmeler + sağ dikme

    // Her dikme için yüksekliğini hesapla
    for (let i = 0; i < totalDikmeCount; i++) {
      let relevantSectionHeight: number;

      if (i === 0) {
        // Sol dikme - ilk bölmenin yüksekliği
        relevantSectionHeight = sectionHeights[0] || height;
      } else if (i === totalDikmeCount - 1) {
        // Sağ dikme - son bölmenin yüksekliği
        const lastSectionIndex = middleBarPositions.length + 1 - 1;
        relevantSectionHeight = sectionHeights[lastSectionIndex] || height;
      } else {
        // Orta dikme - bitişik iki bölmenin maksimumu
        const leftSectionHeight = sectionHeights[i - 1] || height;
        const rightSectionHeight = sectionHeights[i] || height;
        relevantSectionHeight = Math.max(leftSectionHeight, rightSectionHeight);
      }

      const dikmeHeightForSection = calculateDikmeHeight(
        relevantSectionHeight,
        values.boxType,
        values.dikmeType,
        optionId
      ); // metre cinsine çevir
      // Her dikme için sağında ve solunda olmak üzere 2 tane kıl fitili
      totalKilFitiliLength += dikmeHeightForSection * 2;
    }

    const selectedProduct = createSelectedProduct(
      kilFitili,
      1,
      totalKilFitiliLength
    );
    selectedProduct.unit = "Metre";
    neededAccessories.push(selectedProduct);
  }

  return neededAccessories;
};
