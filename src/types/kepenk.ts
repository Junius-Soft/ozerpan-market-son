import { BaseSelections } from "./products";

// Define types for price items
export interface PriceItem {
  description: string;
  stock_code: string;
  uretici_kodu: string;
  type: string;
  color: string;
  unit: string;
  price: string;
  quantity?: number; // Optional quantity field for tracking how many of each item is needed
  lamel_type?: string; // Kepenk aksesuar özellikleri
  dikme_type?: string;
  tambur_type?: string;
  hareket_tip?: string;
  kutu_type?: string;
  [key: string]: string | number | undefined; // Dinamik property'ler için
}

// New interface for tracking selected items
export interface SelectedProduct extends PriceItem {
  quantity: number; // Required in selected products
  totalPrice: number; // Price * quantity
  size?: number; // Ürün ölçüsü (ör: 300x300), zorunlu
}

// Interface for calculation results
export interface CalculationResult {
  totalPrice: number;
  selectedProducts: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  }; // Artık iki obje içeriyor
  errors: string[];
}

export interface KepenkSelections extends BaseSelections {
  width: number;
  height: number;
  lamelType: "st_77" | "sl_77" | "se_77" | "se_78" | "st_100" | "sl_100";
  lamelColor?: string;
  movementType: "manuel" | "motorlu";
  manuelMotorSecimi?: boolean;
  motorModel?: "sel_70_80" | "sel_70_100" | "sel_70_120" | "sel_70_140" | "sel_102_230" | "sel_102_330" | "sel_600" | "sel_800" | "sel_1000";
  gozluLamelVar?: boolean;
  gozluLamelBaslangic?: number;
  gozluLamelBitis?: number;
  dikmeType?: "77_lik" | "100_luk";
  color?: "antrasit_gri" | "beyaz" | "metalik_gri" | "altın_meşe" | "ral_boyalı";
  unitPrice: number;
  selectedProducts: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  };
}

export interface LamelProperties {
  maxWidth: number;
  maxHeight: number;
  maxArea: number;
}

