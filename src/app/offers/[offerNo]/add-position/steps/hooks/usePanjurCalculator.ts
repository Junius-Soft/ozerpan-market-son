import { useState, useEffect } from "react";
import {
  PriceItem,
  CalculationResult,
  PanjurSelections,
  SelectedProduct,
} from "@/types/panjur";
import {
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
    totalPrice: 0,
    selectedProducts: [],
    errors: [],
  });
  const searchParams = useSearchParams();
  const sectionCount = searchParams.get("typeId");
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const { accessories } = useAccessories(selections);

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
    if (!prices.length || !selections) return;

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

      // Aksesuarların fiyatını hesapla
      const accessoriesPrice = (accessories || []).reduce((total, acc) => {
        return total + parseFloat(acc.price) * (acc.quantity || 1);
      }, 0);

      const rawTotalPriceEUR =
        lamelPrice +
        subPartPrice +
        dikmePrice +
        boxPrice +
        motorPrice +
        remotePrice +
        smarthomePrice +
        receiverPrice +
        accessoriesPrice;

      const totalPrice = rawTotalPriceEUR;

      // Aksesuarları SelectedProduct formatına dönüştür ve tüm ürünleri birleştir
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
        ...accessories,
      ].filter(
        (product): product is SelectedProduct =>
          product !== null && product !== undefined
      );

      // console.log({
      //   selectedProducts,
      //   lamelGenisligiMetre,
      //   totalPrice,
      //   accessories,
      // });

      setResult((prev) => ({
        ...prev,
        lamelPrice,
        totalPrice,
        selectedProducts,
        errors,
      }));
    };

    calculate();
  }, [prices, selections, sectionCount, accessories, availableTabs]);

  return result;
};
