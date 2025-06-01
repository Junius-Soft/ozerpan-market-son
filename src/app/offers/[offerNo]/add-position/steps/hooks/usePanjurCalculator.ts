import { useState, useEffect } from "react";
import { PriceItem, CalculationResult, PanjurSelections } from "@/types/panjur";
import {
  getLamelProperties,
  getMaxLamelHeight,
  findLamelPrice,
  findSubPartPrice,
  findDikmePrice,
  findBoxPrice,
  findSmartHomePrice,
  findMotorPrice,
  findRemotePrice,
  findReceiverPrice,
  calculateSystemWidth,
  calculateSystemHeight,
  calculateLamelCount,
  calculateLamelGenisligi,
  calculateDikmeHeight,
  getBoxHeight,
} from "@/utils/panjur";
import { useSearchParams } from "next/navigation";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useAccessories } from "./useAccessories";
import { ProductTab } from "@/documents/products";

// Custom hook
export const usePanjurCalculator = (
  selections: PanjurSelections,
  availableTabs?: ProductTab[]
) => {
  const [result, setResult] = useState<CalculationResult>({
    systemWidth: 0,
    systemHeight: 0,
    lamelCount: 0,
    lamelGenisligi: 0,
    lamelPrice: 0,
    dikmeHeight: 0,
    dikmeCount: 2,
    boxHeight: 0,
    subPartWidth: 0,
    totalPriceTL: "0 TL",
    selectedProducts: [],
    errors: [],
  });
  const searchParams = useSearchParams();
  const sectionCount = searchParams.get("typeId");
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const { eurRate, loading: isEurRateLoading } = useExchangeRate();
  const { accessories, totalPrice: accessoriesTotalPrice } =
    useAccessories(selections);

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
    if ((!prices.length || !selections) && !isEurRateLoading) return;

    // Lamel count hesaplanırken çağrılacak
    const calculate = () => {
      const errors: string[] = [];

      const systemWidth = calculateSystemWidth(
        selections.width,
        selections.dikmeOlcuAlmaSekli,
        selections.dikmeType
      );

      const systemHeight = calculateSystemHeight(
        selections.height,
        selections.kutuOlcuAlmaSekli,
        selections.boxType
      );

      const kutuYuksekligi = getBoxHeight(selections.boxType);

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

      const dikmeHeight = calculateDikmeHeight(
        systemHeight,
        selections.boxType,
        selections.dikmeType
      );

      const lamelGenisligi = calculateLamelGenisligi(
        systemWidth,
        selections.dikmeType
      );
      const lamelCount = calculateLamelCount(
        systemHeight,
        selections.boxType,
        selections.lamelTickness
      );
      const dikmeCount = Number(sectionCount) * 2;

      // Set initial measurements
      setResult((prev) => ({
        ...prev,
        systemWidth,
        systemHeight,
        lamelCount,
        lamelGenisligi,
        dikmeHeight,
        dikmeCount,
        boxHeight: kutuYuksekligi,
        subPartWidth: lamelGenisligi,
      }));

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

      // Price calculations
      const [lamelUnitPrice, lamelSelectedProduct] = findLamelPrice(
        prices,
        selections.lamelTickness,
        selections.lamelType,
        selections.lamel_color,
        lamelCount
      );
      const lamelGenisligiMetre = lamelGenisligi / 1000;
      const lamelPrice = lamelUnitPrice * lamelGenisligiMetre * lamelCount;

      const [subPartPrice, subPartSelectedProduct] = findSubPartPrice(
        prices,
        selections.subPart,
        selections.subPart_color || selections.lamel_color
      );

      const [dikmeUnitPrice, dikmeSelectedProduct] = findDikmePrice(
        prices,
        selections.dikmeType,
        selections.dikme_color || selections.lamel_color,
        dikmeCount
      );
      const dikmePrice = dikmeUnitPrice * dikmeCount;

      const { frontPrice, backPrice, selectedFrontBox, selectedBackBox } =
        findBoxPrice(prices, selections.boxType, selections.box_color);
      const boxPrice = frontPrice + backPrice;

      // Motor fiyatı hesaplama
      const [motorPrice, motorSelectedProduct] = findMotorPrice(
        prices,
        selections.motorMarka,
        selections.motorModel,
        selections.motorSekli
      );

      // Uzaktan kumanda fiyatı hesaplama
      const [remotePrice, remoteSelectedProduct] = findRemotePrice(
        prices,
        selections.remote
      );

      // Akıllı ev sistemi fiyatlandırması
      const [smarthomePrice, smarthomeSelectedProduct] = findSmartHomePrice(
        prices,
        selections.smarthome
      );

      // Get the movement tab
      const movementTab = availableTabs?.find((tab) => tab.id === "movement");

      // Calculate receiver price
      const [receiverPrice, receiverSelectedProduct] = findReceiverPrice(
        prices,
        selections.receiver,
        movementTab
      );

      const totalPriceEUR =
        lamelPrice +
        subPartPrice +
        dikmePrice +
        boxPrice +
        motorPrice +
        remotePrice +
        smarthomePrice +
        receiverPrice;
      const totalPriceTL = isEurRateLoading
        ? "Hesaplanıyor.. "
        : (totalPriceEUR * eurRate).toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
          }) + " TL";

      const selectedProducts = [
        lamelSelectedProduct,
        subPartSelectedProduct,
        dikmeSelectedProduct,
        selectedFrontBox,
        selectedBackBox,
        motorSelectedProduct,
        remoteSelectedProduct,
        smarthomeSelectedProduct,
        receiverSelectedProduct,
      ].filter(
        (product): product is NonNullable<typeof product> => product !== null
      );

      console.log({
        selectedProducts,
        lamelGenisligiMetre,
        totalPriceEUR,
        eurRate,
        totalPriceTL,
        accessories,
        accessoriesTotalPrice,
      });

      setResult((prev) => ({
        ...prev,
        lamelPrice,
        totalPriceTL,
        selectedProducts,
        errors,
      }));
    };

    calculate();
  }, [
    prices,
    selections,
    sectionCount,
    eurRate,
    isEurRateLoading,
    accessories,
    accessoriesTotalPrice,
  ]);

  return result;
};
