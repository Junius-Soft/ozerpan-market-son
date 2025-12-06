import { useState, useEffect, useRef, useCallback } from "react";
import { PriceItem, CalculationResult, PanjurSelections } from "@/types/panjur";
import { useAccessories } from "./useAccessories";
import { ProductTab } from "@/documents/products";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { calculatePanjur } from "./calculations/panjur";
import { useSearchParams } from "next/navigation";
import { calculateSineklik } from "./calculations/sineklik";
import { SineklikSelections } from "@/types/sineklik";
import { calculateKepenk } from "./calculations/kepenk";
import { KepenkSelections } from "@/types/kepenk";

import { calculateCamBalkon, CamBalkonSelections } from "./calculations/cam-balkon";

// Generic calculator hook
export const useCalculator = (
  values: PanjurSelections | SineklikSelections | KepenkSelections | CamBalkonSelections,
  productName: string,
  availableTabs?: ProductTab[]
) => {
  const searchParams = useSearchParams();

  const optionId = searchParams.get("optionId") ?? "";

  const [result, setResult] = useState<CalculationResult>({
    totalPrice: 0,
    selectedProducts: { products: [], accessories: [] },
    errors: [],
  });
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const { accessories } = useAccessories(values);
  const fetchedProductRef = useRef<string | null>(null);
  const lastCalcKeyRef = useRef<string>("");
  
  // Redux state'lerini çek
  const middleBarPositions = useSelector(
    (state: RootState) => state.shutter.middleBarPositions
  );
  const sectionHeights = useSelector(
    (state: RootState) => state.shutter.sectionHeights
  );
  const sectionConnections = useSelector(
    (state: RootState) => state.shutter.sectionConnections
  );
  const sectionMotors = useSelector(
    (state: RootState) => state.shutter.sectionMotors
  );

  // Fiyat fetch fonksiyonu
  const fetchPrices = useCallback(async (pName: string) => {
    if (fetchedProductRef.current === pName) return;
    
    try {
      const apiProductId = pName.toLowerCase() === "cam-balkon" ? "cam_balkon" : pName.toLowerCase();
      
      const response = await fetch(
        `/api/product-prices?productId=${apiProductId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }
      const data = await response.json();
      fetchedProductRef.current = pName;
      setPrices(data);
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }, []);

  useEffect(() => {
    if (productName && fetchedProductRef.current !== productName) {
      fetchPrices(productName);
    }
  }, [productName, fetchPrices]);

  useEffect(() => {
    if (!prices.length || !values) return;

    // Hesaplama için key oluştur - aynı key için tekrar hesaplama yapma
    const calcKey = JSON.stringify({ values, accessories: accessories?.length || 0 });
    if (lastCalcKeyRef.current === calcKey) return;
    lastCalcKeyRef.current = calcKey;

    if (productName === "panjur") {
      const calcResult = calculatePanjur(
        values as PanjurSelections,
        prices,
        accessories,
        middleBarPositions,
        sectionHeights,
        sectionConnections,
        sectionMotors,
        optionId,
        availableTabs
      );
      setResult(calcResult);
    } else if (productName === "sineklik") {
      const calcResult = calculateSineklik(
        values as SineklikSelections,
        prices,
        accessories || []
      );
      setResult(calcResult);
    } else if (productName === "kepenk") {
      const calcResult = calculateKepenk(
        values as KepenkSelections,
        prices,
        accessories || []
      );
      setResult(calcResult);
    } else if (productName === "cam-balkon") {
      const calcResult = calculateCamBalkon(
        values as CamBalkonSelections,
        prices,
        optionId
      );
      setResult(calcResult);
    } else {
      setResult({
        totalPrice: 0,
        selectedProducts: { products: [], accessories: [] },
        errors: [
          `${productName} ürünü için hesaplama henüz implement edilmedi`,
        ],
      });
    }
  }, [
    prices,
    values,
    productName,
    accessories,
    availableTabs,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    sectionMotors,
    optionId,
  ]);

  return result;
};
