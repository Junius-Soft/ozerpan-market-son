import { useState, useEffect, useMemo, useRef } from "react";
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
  const fetchingRef = useRef(false);
  
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

  // values'u stabil bir stringe çevir
  const valuesKey = useMemo(() => {
    if (!values) return "";
    return JSON.stringify(values);
  }, [values]);

  useEffect(() => {
    if (fetchingRef.current) return;
    
    const fetchPrices = async () => {
      fetchingRef.current = true;
      try {
        // cam-balkon için api key cam_balkon olmalı
        const apiProductId = productName.toLowerCase() === "cam-balkon" ? "cam_balkon" : productName.toLowerCase();
        
        const response = await fetch(
          `/api/product-prices?productId=${apiProductId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch prices");
        }
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchPrices();
  }, [productName]);

  useEffect(() => {
    if (!prices.length || !values) return;

    if (productName === "panjur") {
      // Panjur için hesaplama
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
      // Kepenk için hesaplama
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
      // Diğer ürünler için henüz implement edilmedi
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
    valuesKey,
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
