import { useState, useEffect } from "react";
import { PriceItem, CalculationResult, PanjurSelections } from "@/types/panjur";
import { useAccessories } from "./useAccessories";
import { ProductTab } from "@/documents/products";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { calculatePanjur } from "./calculations/panjur";
import { useSearchParams } from "next/navigation";
import { calculateSineklik } from "./calculations/sineklik";
import { SineklikSelections } from "@/types/sineklik";

// Generic calculator hook
export const useCalculator = (
  values: PanjurSelections,
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

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          `/api/product-prices?productId=${productName.toLowerCase()}`
        );
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
  }, [productName]);

  useEffect(() => {
    if (!prices.length || !values) return;

    if (productName === "panjur") {
      // Panjur için hesaplama
      const result = calculatePanjur(
        values as PanjurSelections,
        prices,
        accessories || [],
        middleBarPositions,
        sectionHeights,
        sectionConnections,
        optionId,
        availableTabs
      );
      setResult(result);
    } else if (productName === "sineklik") {
      const result = calculateSineklik(
        values as SineklikSelections,
        prices,
        accessories || []
      );
      setResult(result);
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
    values,
    productName,
    accessories,
    availableTabs,
    middleBarPositions,
    sectionHeights,
    sectionConnections,
    optionId,
  ]);

  return result;
};
