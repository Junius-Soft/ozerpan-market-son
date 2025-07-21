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
  findRemotePrice,
  findReceiverPrice,
  findTamburProfiliAccessoryPrice,
  findYukseltmeProfiliPrice,
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
import { useSelector } from "react-redux";
interface ShutterState {
  middleBarPositions: number[];
  sectionHeights: number[];
}

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
    selectedProducts: { products: [], accessories: [] },
    errors: [],
  });
  const searchParams = useSearchParams();
  const sectionCount = Number(searchParams.get("typeId"));
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const { accessories } = useAccessories(values);

  const middleBarPositions = useSelector(
    (state: { shutter: ShutterState }) => state.shutter.middleBarPositions
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
      const dikmeCount = sectionCount * 2;

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
        lamelCount,
        lamelGenisligi
      );
      const lamelGenisligiMetre = lamelGenisligi / 1000;
      const lamelPrice = lamelUnitPrice * lamelGenisligiMetre * lamelCount;

      const subPartResults = findSubPartPrice(
        prices,
        values.subPart,
        values.subPart_color || values.lamel_color,
        middleBarPositions,
        values.width
      );
      console.log({ subPartResults });
      // Toplam alt parça fiyatı ve ürünleri
      const subPartPrice = subPartResults.reduce((sum, r) => sum + r.price, 0);
      // Alt parça ürünlerini topluca ekle
      const subPartSelectedProducts: SelectedProduct[] = subPartResults
        .map((r) => r.selectedProduct)
        .filter((p): p is SelectedProduct => !!p);

      const [dikmeUnitPrice, dikmeSelectedProduct] = findDikmePrice(
        prices,
        values.dikmeType,
        values.dikme_color || values.lamel_color,
        dikmeCount,
        dikmeHeight
      );
      const dikmePrice = dikmeUnitPrice * dikmeCount;

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
      const [tamburPrice, tamburSelectedProduct] =
        findTamburProfiliAccessoryPrice(
          prices,
          values.movementType,
          values.width
        );

      // Yükseltme Profili fiyatı hesaplama (sadece dikmeAdapter === "var" ise)
      let yukseltmeProfiliPrice = 0;
      let yukseltmeProfiliSelectedProduct: SelectedProduct | null = null;
      if (values.dikmeAdapter === "var") {
        [yukseltmeProfiliPrice, yukseltmeProfiliSelectedProduct] =
          findYukseltmeProfiliPrice(
            prices,
            values.dikme_color || values.lamel_color,
            dikmeCount,
            systemHeight
          );
      }

      // Aksesuarların fiyatını hesapla
      const accessoriesPrice = (accessories || []).reduce((total, acc) => {
        return total + parseFloat(acc.price) * (acc.quantity || 1);
      }, 0);

      const rawTotalPriceEUR =
        lamelPrice +
        subPartPrice +
        dikmePrice +
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
        lamelSelectedProduct,
        ...subPartSelectedProducts,
        dikmeSelectedProduct,
        selectedFrontBox,
        selectedBackBox,
        tamburSelectedProduct,
        yukseltmeProfiliSelectedProduct,
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

      setResult((prev) => ({
        ...prev,
        lamelPrice,
        totalPrice,
        selectedProducts,
        errors,
      }));
    };

    calculate();
  }, [
    prices,
    values,
    sectionCount,
    accessories,
    availableTabs,
    middleBarPositions,
  ]);

  return result;
};
