import { PanjurSelections, PriceItem } from "@/types/panjur";
import {
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
} from "@/utils/panjur";
import { calculateSectionWidths } from "@/utils/shutter-calculations";
import {
  findYanKapakAccessoryPrice,
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
): PriceItem[] => {
  const neededAccessories: PriceItem[] = [];
  const dikmeCount = Number(sectionCount) * 2;

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

  // Yan Kapak - bölme sayısı kadar
  const yanKapak = findYanKapakAccessoryPrice(
    allAccessories,
    values.boxType,
    values.box_color
  );
  if (yanKapak) {
    neededAccessories.push({
      ...yanKapak,
      quantity: middleBarPositions.length + 1,
    });
  }

  // Motorlu aksesuarlar
  if (values.movementType === "motorlu") {
    const boruBasi = findBoruBasiAccessoryPrice(allAccessories, "motorlu");
    if (boruBasi)
      neededAccessories.push({
        ...boruBasi,
        quantity: calculateMotorQuantity(),
      });
    const rulman = findRulmanAccessoryPrice(allAccessories);
    if (rulman)
      neededAccessories.push({
        ...rulman,
        quantity: calculateMotorQuantity(),
      });
    const plaket = findPlaketAccessoryPrice(
      allAccessories,
      values.boxType,
      values.movementType
    );
    if (plaket)
      neededAccessories.push({
        ...plaket,
        quantity: calculateMotorQuantity(),
      });
  }

  // Manuel makaralı aksesuarlar
  if (values.movementType === "manuel" && values.manuelSekli === "makarali") {
    const boruBasi = findBoruBasiAccessoryPrice(allAccessories, "manuel");
    if (boruBasi)
      neededAccessories.push({
        ...boruBasi,
        quantity: calculateMotorQuantity(),
      });
    const kasnak = findKasnakAccessoryPrice(allAccessories, values.boxType);
    if (kasnak)
      neededAccessories.push({
        ...kasnak,
        quantity: calculateMotorQuantity(),
      });
    const rulman = findRulmanAccessoryPrice(allAccessories);
    if (rulman)
      neededAccessories.push({
        ...rulman,
        quantity: calculateMotorQuantity() * 2,
      });
    const windeMakara = findWindeMakaraAccessoryPrice(allAccessories);
    if (windeMakara)
      neededAccessories.push({
        ...windeMakara,
        quantity: calculateMotorQuantity(),
      });
    const kordonMakara = findKordonMakaraAccessoryPrice(allAccessories);
    if (kordonMakara)
      neededAccessories.push({
        ...kordonMakara,
        quantity: calculateMotorQuantity(),
      });
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
      if (found) neededAccessories.push({ ...found, quantity: acc.quantity });
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

    neededAccessories.push({ ...pvcTapa, quantity: totalTapaQuantity });

    const zimbaTeli = findZimbaTeliAccessoryPrice(allAccessories);
    if (zimbaTeli)
      neededAccessories.push({ ...zimbaTeli, quantity: totalTapaQuantity });
  }

  // Çelik Askı - her bölme için ayrı hesapla
  const celikAski = findCelikAskiAccessoryPrice(
    allAccessories,
    values.dikmeType
  );
  if (celikAski) {
    const sectionWidths = calculateSectionWidths(width, middleBarPositions);
    let totalAskiQuantity = 0;

    sectionWidths.forEach((sectionWidth) => {
      const lamelWidthForSection = calculateLamelGenisligi(
        sectionWidth,
        values.dikmeType
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

    neededAccessories.push({
      ...celikAski,
      quantity: totalAskiQuantity,
    });
  }

  // Alt Parça Lastiği - her bölme için ayrı hesapla
  const altParcaLastigi = findAltParcaLastigiAccessoryPrice(
    allAccessories,
    values.dikmeType
  );
  if (altParcaLastigi) {
    const sectionWidths = calculateSectionWidths(width, middleBarPositions);
    let totalLastikLength = 0;

    sectionWidths.forEach((sectionWidth) => {
      const lamelWidthForSection = calculateLamelGenisligi(
        sectionWidth,
        values.dikmeType
      );
      const widthInMeters = lamelWidthForSection / 1000;
      totalLastikLength += widthInMeters;
    });

    neededAccessories.push({
      ...altParcaLastigi,
      quantity: totalLastikLength, // toplam uzunluk (metre)
      unit: "Metre",
    });
  }

  // Stoper Konik
  if (
    (values.lamelTickness === "39_sl" || values.lamelTickness === "45_se") &&
    values.manuelSekli === "makarali"
  ) {
    const stoperKonik = findStoperKonikAccessoryPrice(allAccessories);
    if (stoperKonik)
      neededAccessories.push({
        ...stoperKonik,
        quantity: Number(sectionCount) * 2,
      });
  }

  // Kilitli Alt Parça
  if (values.subPart === "kilitli_alt_parca") {
    const kilitliAccessories = findKilitliAltParcaAccessories(allAccessories);
    for (const acc of kilitliAccessories) {
      neededAccessories.push({
        ...acc,
        quantity: Number(sectionCount),
      });
    }
  }

  // Lamel Denge Makarası
  if (values.dikmeType.startsWith("midi_") && values.boxType === "250mm") {
    const dengeMakarasi = findDengeMakarasiAccessoryPrice(allAccessories);
    if (dengeMakarasi)
      neededAccessories.push({
        ...dengeMakarasi,
        quantity: Number(sectionCount),
      });
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
    for (const acc of miniDikmeAccessories) {
      neededAccessories.push(acc);
    }
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
    neededAccessories.push({
      ...selectedMotor,
      quantity: calculateMotorQuantity(),
    });
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
      const currentDikme =
        i === 0 || i === totalDikmeCount - 1 ? "Yan" : "Orta";
      const dikmeHeightForSection =
        calculateDikmeHeight(
          relevantSectionHeight,
          values.boxType,
          values.dikmeType,
          optionId,
          currentDikme
        ) / 1000; // metre cinsine çevir

      // Her dikme için sağında ve solunda olmak üzere 2 tane kıl fitili
      totalKilFitiliLength += dikmeHeightForSection * 2;
    }

    neededAccessories.push({
      ...kilFitili,
      quantity: totalKilFitiliLength, // toplam metre cinsinden
      unit: "Metre",
    });
  }

  return neededAccessories;
};
