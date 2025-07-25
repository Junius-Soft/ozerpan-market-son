import { PanjurSelections, PriceItem } from "@/types/panjur";
import {
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
  calculateMaxSectionWidth,
} from "@/utils/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
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

interface AccessoryResult {
  accessories: PriceItem[];
}

export function useAccessories(values: PanjurSelections): AccessoryResult {
  const [accessories, setAccessories] = useState<PriceItem[]>([]);
  const searchParams = useSearchParams();

  // Redux state'lerini çek
  const middleBarPositions = useSelector(
    (state: RootState) => state.shutter.middleBarPositions
  );
  // const sectionHeights = useSelector(
  //   (state: RootState) => state.shutter.sectionHeights
  // );
  const sectionMotors = useSelector(
    (state: RootState) => state.shutter.sectionMotors
  );
  const sectionConnections = useSelector(
    (state: RootState) => state.shutter.sectionConnections
  );
  const sectionMotorPositions = useSelector(
    (state: RootState) => state.shutter.sectionMotorPositions
  );

  const sectionCount = searchParams.get("typeId");
  const productId = searchParams.get("productId");
  const dikmeCount = Number(sectionCount) * 2;

  const calculateMotorQuantity = useMemo(() => {
    return sectionMotors.filter((motor) => motor).length;
  }, [sectionMotors]);

  useEffect(() => {
    const fetchAndCalculateAccessories = async () => {
      try {
        const response = await fetch(`/api/accessories?productId=${productId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch accessories");
        }
        const data = await response.json();
        const allAccessories: PriceItem[] = data;
        const neededAccessories: PriceItem[] = [];

        if (allAccessories && productId === "panjur") {
          // En geniş bölmenin genişliğini hesapla
          const maxSectionWidth = calculateMaxSectionWidth(
            values?.width || 0,
            middleBarPositions
          );
          const width = calculateSystemWidth(
            maxSectionWidth,
            values.dikmeOlcuAlmaSekli,
            values.dikmeType
          );
          const height = calculateSystemHeight(
            values.height,
            values.kutuOlcuAlmaSekli,
            values.boxType
          );
          const lamelWidth = calculateLamelGenisligi(width, values.dikmeType);

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
            const boruBasi = findBoruBasiAccessoryPrice(
              allAccessories,
              "motorlu"
            );
            if (boruBasi)
              neededAccessories.push({
                ...boruBasi,
                quantity: calculateMotorQuantity,
              });
            const rulman = findRulmanAccessoryPrice(allAccessories);
            if (rulman)
              neededAccessories.push({
                ...rulman,
                quantity: calculateMotorQuantity,
              });
            const plaket = findPlaketAccessoryPrice(
              allAccessories,
              values.boxType,
              values.movementType
            );
            if (plaket)
              neededAccessories.push({
                ...plaket,
                quantity: calculateMotorQuantity,
              });
          }

          // Manuel makaralı aksesuarlar
          if (
            values.movementType === "manuel" &&
            values.manuelSekli === "makarali"
          ) {
            const boruBasi = findBoruBasiAccessoryPrice(
              allAccessories,
              "manuel"
            );
            if (boruBasi)
              neededAccessories.push({
                ...boruBasi,
                quantity: calculateMotorQuantity,
              });
            const kasnak = findKasnakAccessoryPrice(
              allAccessories,
              values.boxType
            );
            if (kasnak)
              neededAccessories.push({
                ...kasnak,
                quantity: calculateMotorQuantity,
              });
            const rulman = findRulmanAccessoryPrice(allAccessories);
            if (rulman)
              neededAccessories.push({
                ...rulman,
                quantity: calculateMotorQuantity * 2,
              });
            const windeMakara = findWindeMakaraAccessoryPrice(allAccessories);
            if (windeMakara)
              neededAccessories.push({
                ...windeMakara,
                quantity: calculateMotorQuantity,
              });
            const kordonMakara = findKordonMakaraAccessoryPrice(allAccessories);
            if (kordonMakara)
              neededAccessories.push({
                ...kordonMakara,
                quantity: calculateMotorQuantity,
              });
          }

          // Manuel redüktörlü aksesuarlar
          if (
            values.movementType === "manuel" &&
            values.manuelSekli === "reduktorlu"
          ) {
            const redAksesuarlar = [
              {
                name: "40 boru başı rulmanlı siyah",
                quantity: calculateMotorQuantity,
              },
              { name: "rulman 12x28", quantity: calculateMotorQuantity },
              {
                name: "panjur redüktörü beyaz",
                quantity: calculateMotorQuantity,
              },
              {
                name: "redüktör boru başı 40 mm-C 371 uyumlu",
                quantity: calculateMotorQuantity,
              },
              {
                name: "Ara kol-C 371 uyumlu",
                quantity: calculateMotorQuantity,
              },
              {
                name: "Çevirme kolu-1200 mm",
                quantity: calculateMotorQuantity,
              },
            ];
            for (const acc of redAksesuarlar) {
              const found = findAccessoryByName(allAccessories, acc.name);
              if (found)
                neededAccessories.push({ ...found, quantity: acc.quantity });
            }
          }

          // PVC Tapa ve Zımba Teli
          const pvcTapa = findPvcTapaAccessoryPrice(
            allAccessories,
            values.dikmeType
          );
          if (pvcTapa) {
            const finalLamelCount = calculateLamelCount(
              height,
              values.boxType,
              values.lamelTickness
            );
            const tapaQuantity =
              finalLamelCount % 2 === 0 ? finalLamelCount : finalLamelCount + 1;
            neededAccessories.push({ ...pvcTapa, quantity: tapaQuantity });
            const zimbaTeli = findZimbaTeliAccessoryPrice(allAccessories);
            if (zimbaTeli)
              neededAccessories.push({ ...zimbaTeli, quantity: tapaQuantity });
          }

          // Çelik Askı
          const celikAski = findCelikAskiAccessoryPrice(
            allAccessories,
            values.dikmeType
          );
          if (celikAski) {
            let askiQuantity = 2;
            if (lamelWidth > 1000 && lamelWidth <= 1500) {
              askiQuantity = 4;
            } else if (lamelWidth > 1500 && lamelWidth <= 2250) {
              askiQuantity = 6;
            } else if (lamelWidth > 2250 && lamelWidth <= 3500) {
              askiQuantity = 8;
            } else if (lamelWidth > 3500) {
              askiQuantity = 10;
            }
            neededAccessories.push({ ...celikAski, quantity: askiQuantity });
          }

          // Alt Parça Lastiği
          const altParcaLastigi = findAltParcaLastigiAccessoryPrice(
            allAccessories,
            values.dikmeType
          );
          if (altParcaLastigi) {
            const widthInMeters = lamelWidth / 1000;
            neededAccessories.push({
              ...altParcaLastigi,
              quantity: widthInMeters,
              unit: altParcaLastigi.unit,
            });
          }

          // Stoper Konik
          if (
            (values.lamelTickness === "39_sl" ||
              values.lamelTickness === "45_se") &&
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
            const kilitliAccessories =
              findKilitliAltParcaAccessories(allAccessories);
            for (const acc of kilitliAccessories) {
              neededAccessories.push({
                ...acc,
                quantity: Number(sectionCount),
              });
            }
          }

          // Lamel Denge Makarası
          if (
            values.dikmeType.startsWith("midi_") &&
            values.boxType === "250mm"
          ) {
            const dengeMakarasi =
              findDengeMakarasiAccessoryPrice(allAccessories);
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
              quantity: calculateMotorQuantity,
            });
          }

          // Kıl Fitili ekle
          const kilFitiliName = "067x550 Standart Kıl Fitil";
          const kilFitili = allAccessories.find(
            (acc) => acc.description === kilFitiliName
          );
          if (kilFitili) {
            const dikmeHeightMeter =
              calculateDikmeHeight(height, values.boxType, values.dikmeType) /
              1000;
            const kilFitiliOlcu = dikmeHeightMeter * 2;

            neededAccessories.push({
              ...kilFitili,
              quantity: kilFitiliOlcu, // metre cinsinden
              unit: "Metre",
            });
          }

          setAccessories(neededAccessories);
        }
      } catch (error) {
        console.error("Error calculating accessories:", error);
        setAccessories([]);
      }
    };
    fetchAndCalculateAccessories();
  }, [
    values,
    dikmeCount,
    productId,
    middleBarPositions,
    sectionMotors,
    sectionConnections,
    sectionMotorPositions,
    calculateMotorQuantity,
    sectionCount,
  ]);

  return { accessories };
}
