import { useState, useEffect } from "react";
import {
  PriceItem,
  CalculationResult,
  SelectedProduct,
  PanjurSelections,
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
  values: PanjurSelections,
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
  const { accessories } = useAccessories(values);

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
    if (!prices.length || !values) return;

    // Lamel count hesaplanırken çağrılacak
    const calculate = () => {
      const errors: string[] = [];

      const systemWidth = calculateSystemWidth(
        values.width,
        values.dikmeOlcuAlmaSekli,
        values.dikmeType
      );

      const systemHeight = calculateSystemHeight(
        values.height,
        values.kutuOlcuAlmaSekli,
        values.boxType
      );

      const kutuYuksekligi = getBoxHeight(values.boxType);

      const dikmeHeight = calculateDikmeHeight(
        systemHeight,
        values.boxType,
        values.dikmeType
      );

      const lamelGenisligi = calculateLamelGenisligi(
        systemWidth,
        values.dikmeType
      );
      const lamelCount = calculateLamelCount(
        systemHeight,
        values.boxType,
        values.lamelTickness
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
        values.lamelTickness,
        values.lamelType,
        values.lamel_color,
        lamelCount
      );
      const lamelGenisligiMetre = lamelGenisligi / 1000;
      const lamelPrice = lamelUnitPrice * lamelGenisligiMetre * lamelCount;

      const [subPartPrice, subPartSelectedProduct] = findSubPartPrice(
        prices,
        values.subPart,
        values.subPart_color || values.lamel_color
      );

      const [dikmeUnitPrice, dikmeSelectedProduct] = findDikmePrice(
        prices,
        values.dikmeType,
        values.dikme_color || values.lamel_color,
        dikmeCount
      );
      const dikmePrice = dikmeUnitPrice * dikmeCount;

      const { frontPrice, backPrice, selectedFrontBox, selectedBackBox } =
        findBoxPrice(prices, values.boxType, values.box_color);
      const boxPrice = frontPrice + backPrice;

      // Motor fiyatı hesaplama
      const [motorPrice, motorSelectedProduct] = findMotorPrice(
        prices,
        values.motorMarka,
        values.motorModel,
        values.motorSekli
      );

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

      setResult((prev) => ({
        ...prev,
        lamelPrice,
        totalPrice,
        selectedProducts,
        errors,
      }));
    };

    calculate();
  }, [prices, values, sectionCount, accessories, availableTabs]);

  return result;
};
