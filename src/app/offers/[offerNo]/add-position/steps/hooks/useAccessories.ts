import { PanjurSelections, PriceItem, SelectedProduct } from "@/types/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
  values: PanjurSelections | SineklikSelections | KepenkSelections
): AccessoryResult {
  const [accessories, setAccessories] = useState<SelectedProduct[]>([]);
  const searchParams = useSearchParams();

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

  useEffect(() => {
    const fetchAndCalculateAccessories = async () => {
      try {
        const response = await fetch(`/api/accessories?productId=${productId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch accessories");
        }
        const data = await response.json();
        const allAccessories: PriceItem[] = data;

        if (allAccessories && productId === "panjur") {
          // Panjur için aksesuar hesaplama
          const result = calculatePanjurAccessories(
            values as PanjurSelections,
            allAccessories,
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
            allAccessories
          );
          setAccessories(result);
        } else if (productId === "kepenk") {
          // Kepenk için aksesuar hesaplama
          const result = calculateKepenkAccessories(
            values as KepenkSelections,
            allAccessories
          );
          setAccessories(result);
        } else if (productId === "cam-balkon") {
          // Cam balkon için şu an aksesuar yok
          setAccessories([]);
        } else {
          // Bilinmeyen ürün
          setAccessories([]);
        }
      } catch (error) {
        console.error("Error calculating accessories:", error);
        setAccessories([]);
      }
    };

    fetchAndCalculateAccessories();
  }, [
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
