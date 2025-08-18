import { PanjurSelections, PriceItem } from "@/types/panjur";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { calculatePanjurAccessories } from "./accessories/panjur";

interface AccessoryResult {
  accessories: PriceItem[];
}

// Generic accessories calculator hook
export function useAccessories(values: PanjurSelections): AccessoryResult {
  const [accessories, setAccessories] = useState<PriceItem[]>([]);
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
        } else if (productId === "pergole") {
          // Gelecekte diğer ürünler için
          // const result = calculatePergoleAccessories(values, allAccessories);
          // setAccessories(result);
          setAccessories([]);
        } else if (productId === "tente") {
          // const result = calculateTenteAccessories(values, allAccessories);
          // setAccessories(result);
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
