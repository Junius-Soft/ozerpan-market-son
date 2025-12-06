import { PanjurSelections, PriceItem, SelectedProduct } from "@/types/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { calculatePanjurAccessories } from "./accessories/panjur";
import { calculateSineklikAccessories } from "./accessories/sineklik";
import { SineklikSelections } from "@/types/sineklik";
import { KepenkSelections } from "@/types/kepenk";
import { calculateKepenkAccessories } from "./accessories/kepenk";

interface AccessoryResult {
  accessories: SelectedProduct[];
}

// Generic accessories calculator hook
export function useAccessories(
  values: PanjurSelections | SineklikSelections | KepenkSelections | unknown
): AccessoryResult {
  const [accessories, setAccessories] = useState<SelectedProduct[]>([]);
  const [cachedAccessories, setCachedAccessories] = useState<PriceItem[]>([]);
  const searchParams = useSearchParams();
  const fetchedProductRef = useRef<string | null>(null);
  const lastValuesRef = useRef<string>("");

  // Redux state'lerini çek
  const middleBarPositions = useSelector(
    (state: RootState) => state.shutter.middleBarPositions
  );
  const sectionHeights = useSelector(
    (state: RootState) => state.shutter.sectionHeights
  );
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
  const optionId = searchParams.get("optionId") ?? "";

  // Aksesuar fetch fonksiyonu
  const fetchAccessories = useCallback(async (pid: string) => {
    if (fetchedProductRef.current === pid) return;
    
    try {
      const response = await fetch(`/api/accessories?productId=${pid}`);
      if (!response.ok) {
        throw new Error("Failed to fetch accessories");
      }
      const data = await response.json();
      fetchedProductRef.current = pid;
      setCachedAccessories(data);
    } catch (error) {
      console.error("Error fetching accessories:", error);
      setCachedAccessories([]);
    }
  }, []);

  // İlk fetch - sadece productId değiştiğinde çalışır
  useEffect(() => {
    if (productId && fetchedProductRef.current !== productId) {
      fetchAccessories(productId);
    }
  }, [productId, fetchAccessories]);

  // Hesaplama - cachedAccessories veya values değiştiğinde çalışır
  useEffect(() => {
    if (!cachedAccessories.length || !values) return;

    // Sonsuz döngüyü engelle - aynı values için tekrar hesaplama yapma
    const currentValuesStr = JSON.stringify(values);
    if (lastValuesRef.current === currentValuesStr) return;
    lastValuesRef.current = currentValuesStr;

    if (productId === "panjur") {
      const result = calculatePanjurAccessories(
        values as PanjurSelections,
        cachedAccessories,
        middleBarPositions,
        sectionHeights,
        sectionMotors,
        sectionCount,
        optionId
      );
      setAccessories(result);
    } else if (productId === "sineklik") {
      const result = calculateSineklikAccessories(
        values as SineklikSelections,
        cachedAccessories
      );
      setAccessories(result);
    } else if (productId === "kepenk") {
      const result = calculateKepenkAccessories(
        values as KepenkSelections,
        cachedAccessories
      );
      setAccessories(result);
    } else if (productId === "cam-balkon") {
      setAccessories([]);
    } else {
      setAccessories([]);
    }
  }, [
    cachedAccessories,
    values,
    productId,
    middleBarPositions,
    sectionHeights,
    sectionMotors,
    sectionConnections,
    sectionMotorPositions,
    sectionCount,
    optionId,
  ]);

  return { accessories };
}
