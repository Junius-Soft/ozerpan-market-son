import { BaseSelections } from "./products";
import { SelectedProduct } from "./panjur";

export interface CamBalkonSelections extends BaseSelections {
  width: number;
  height: number;
  color: string;
  camKalinligi: string;
  camRengi: string;
  altRayProfili: string;
  conta: string;
  kasaUzatma: string;
  kolSayisi: number;
  packagingType: "yok" | "var";
  toplamHareketliCamArasi?: number;
  toplamSabitHareketliCamArasi?: number;
  unitPrice: number;
  selectedProducts?: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  };
  [key: string]: unknown; // Dinamik property'ler için
}

