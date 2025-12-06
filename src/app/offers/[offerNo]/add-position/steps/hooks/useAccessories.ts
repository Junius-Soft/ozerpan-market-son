import { PanjurSelections, PriceItem, SelectedProduct } from "@/types/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
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
  const fetchingRef = useRef(false);

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

  // values'u stabil bir stringe çevir - sadece önemli alanları al
  const valuesKey = useMemo(() => {
    if (!values) return "";
    const v = values as Record<string, unknown>;
    // Sadece hesaplama için önemli alanları al
    return JSON.stringify({
      width: v.width,
      height: v.height,
      lamelType: v.lamelType,
      movementType: v.movementType,
      gozluLamelVar: v.gozluLamelVar,
      gozluLamelBaslangic: v.gozluLamelBaslangic,
      gozluLamelBitis: v.gozluLamelBitis,
    });
  }, [values]);

  // İlk fetch - sadece productId değiştiğinde çalışır
  useEffect(() => {
    if (!productId || fetchingRef.current) return;
    
    const fetchAccessories = async () => {
      fetchingRef.current = true;
      try {
        const response = await fetch(`/api/accessories?productId=${productId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch accessories");
        }
        const data = await response.json();
        setCachedAccessories(data);
      } catch (error) {
        console.error("Error fetching accessories:", error);
        setCachedAccessories([]);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchAccessories();
  }, [productId]);

  // Hesaplama - cachedAccessories veya values değiştiğinde çalışır
  useEffect(() => {
    if (!cachedAccessories.length || !values) return;

    if (productId === "panjur") {
      // Panjur için aksesuar hesaplama
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
      // Kepenk için aksesuar hesaplama
      const result = calculateKepenkAccessories(
        values as KepenkSelections,
        cachedAccessories
      );
      setAccessories(result);
    } else if (productId === "cam-balkon") {
      // Cam balkon için şu an aksesuar yok
      setAccessories([]);
    } else {
      // Bilinmeyen ürün
      setAccessories([]);
    }
  }, [
    cachedAccessories,
    valuesKey,
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
