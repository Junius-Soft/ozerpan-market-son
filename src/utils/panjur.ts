import { LamelProperties } from "@/types/panjur";
import { lamelProperties, maxLamelHeights } from "@/constants/panjur";

export const getLamelProperties = (lamelTickness: string): LamelProperties => {
  return lamelProperties[lamelTickness];
};

export const getBoxHeight = (boxType: string): number => {
  return parseInt(boxType.replace("mm", ""));
};

export const getKertmePayi = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 20 : 25;
};

export const getMaxLamelHeight = (
  boxType: string,
  lamelTickness: string,
  movementType: "manuel" | "motorlu"
): number | null => {
  const boxSize = boxType.replace("mm", "");
  const lamelType = lamelTickness.split("_")[0];
  return maxLamelHeights[boxSize]?.[lamelType]?.[movementType] ?? null;
};

export const getDikmeGenisligi = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 53 : 62;
};

export const getLamelDusmeValue = (dikmeType: string): number => {
  return dikmeType.startsWith("mini_") ? 37 : 45;
};
