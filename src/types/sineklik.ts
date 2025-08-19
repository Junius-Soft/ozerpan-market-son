import { BaseSelections } from "./products";

export interface SineklikSelections extends BaseSelections {
  sineklikType: "plise" | "menteseli" | "surme" | "sabit";
  width: number;
  height: number;
  color: string;
  description: string;
  kasaType: "esikli" | "esiksiz";
  measureType: "outsideToOutside" | "wing";
  menteseliMeasureType: "outsideToOutside" | "wing" | "gasket";
  menteseliOpeningDirection: "left" | "right";
  menteseliOpeningType: "iceAcilim" | "disaAcilim";
  pliseOpeningType: "yatay" | "dikey" | "double" | "centralPack";
  tulType: "normal" | "kedi";
  unitPrice: number;
}
