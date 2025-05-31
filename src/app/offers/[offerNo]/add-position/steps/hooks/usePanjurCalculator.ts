import { useState, useEffect, useCallback } from "react";
import { PriceItem, CalculationResult, PanjurSelections } from "@/types/panjur";
import {
  getLamelProperties,
  getBoxHeight,
  getKertmePayi,
  getMaxLamelHeight,
  getDikmeGenisligi,
  getLamelDusmeValue,
} from "@/utils/panjur";

// Custom hook
export const usePanjurCalculator = (selections: PanjurSelections) => {
  const [result, setResult] = useState<CalculationResult>({
    systemWidth: 0,
    systemHeight: 0,
    lamelCount: 0,
    lamelGenisligi: 0,
    lamelPrice: 0,
    postHeight: 0,
    postCount: 2,
    boxHeight: 0,
    subPartWidth: 0,
    totalPriceTL: 0,
    errors: [],
  });

  const [prices, setPrices] = useState<PriceItem[]>([]);

  const findLamelPrice = useCallback(
    (lamelTickness: string, lamelType: string, color: string): number => {
      const lamelPrices = prices.filter((p) => p.type === "lamel_profilleri");
      const normalizedColor = color
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      const thickness = lamelTickness.split("_")[0];
      const typeStr =
        lamelType === "aluminyum_poliuretanli" ? "Poliüretanlı" : "Ekstrüzyon";
      const searchPattern = `${thickness} mm Alüminyum ${typeStr} Lamel ${normalizedColor}`;

      const matchingLamel = lamelPrices.find(
        (p) => p.description === searchPattern
      );
      return matchingLamel ? parseFloat(matchingLamel.price) : 0;
    },
    [prices]
  );

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/api/product-prices?productId=panjur`);
        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    const calculate = () => {
      const errors: string[] = [];
      let postHeight = 0;

      const kertmePayi = getKertmePayi(selections.dikmeType);
      const dikmeGenisligi = getDikmeGenisligi(selections.dikmeType);
      const kutuYuksekligi = getBoxHeight(selections.boxType);

      let systemWidth = selections.width;
      switch (selections.dikmeOlcuAlmaSekli) {
        case "dikme_haric":
          systemWidth = selections.width + 2 * dikmeGenisligi - 10;
          break;
        case "tek_dikme":
          systemWidth = selections.width + dikmeGenisligi - 10;
          break;
        case "dikme_dahil":
          systemWidth = selections.width - 10;
          break;
      }

      let systemHeight = selections.height;
      if (selections.kutuOlcuAlmaSekli === "kutu_haric") {
        systemHeight = selections.height + kutuYuksekligi;
      }

      const maxHeight = getMaxLamelHeight(
        selections.boxType,
        selections.lamelTickness,
        selections.movementType
      );
      if (maxHeight !== null && systemHeight > maxHeight) {
        errors.push(
          `Seçilen yükseklik (${systemHeight}mm), bu kutu tipi ve lamel kalınlığı için maksimum değeri (${maxHeight}mm) aşıyor.`
        );
      }

      const lamelHeight = Number(selections.lamelTickness.split("_")[0]);
      if (!selections.dikmeType.includes("orta")) {
        postHeight = systemHeight - kutuYuksekligi + kertmePayi;
      }

      const lamelDusmeValue = getLamelDusmeValue(selections.dikmeType);
      const lamelGenisligi = systemWidth - lamelDusmeValue;

      const dikmeYuksekligiKertmeHaric = systemHeight - kutuYuksekligi;
      const lamelSayisi = Math.ceil(dikmeYuksekligiKertmeHaric / lamelHeight);
      const lamelCount = lamelSayisi + 1;

      const lamelProps = getLamelProperties(selections.lamelTickness);

      const alanM2 = (systemWidth * systemHeight) / 1000000;
      if (alanM2 > lamelProps?.maksimumKullanimAlani) {
        errors.push(
          `Seçilen ölçüler maksimum kullanım alanını (${
            lamelProps.maksimumKullanimAlani
          }m²) aşıyor. Mevcut alan: ${alanM2.toFixed(2)}m²`
        );
      }

      if (systemWidth > lamelProps?.tavsiyeEdilenMaksimumEn) {
        errors.push(
          `Seçilen genişlik (${systemWidth}mm) tavsiye edilen maksimum genişliği (${lamelProps?.tavsiyeEdilenMaksimumEn}mm) aşıyor.`
        );
      }

      const lamelUnitPrice = findLamelPrice(
        selections.lamelTickness,
        selections.lamelType,
        selections.lamel_color
      );
      const lamelGenisligiMetre = lamelGenisligi / 1000;
      const lamelPrice = lamelUnitPrice * lamelGenisligiMetre * lamelCount;
      console.log({
        lamelGenisligiMetre,
        lamelCount,
        lamelUnitPrice,
        lamelPrice,
      });
      setResult({
        systemWidth,
        systemHeight,
        lamelCount,
        lamelGenisligi,
        lamelPrice,
        postHeight,
        postCount:
          Number(selections.sectionCount) === 1
            ? 2
            : 2 + Number(selections.sectionCount) - 1,
        boxHeight: kutuYuksekligi,
        subPartWidth: lamelGenisligi,
        totalPriceTL: lamelPrice,
        errors,
      });
    };

    calculate();
  }, [selections, findLamelPrice]);

  return result;
};
