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
  movementType: "manuel" | "motorlu";
  gozluLamelVar?: boolean;
  gozluLamelBaslangic?: number;
  gozluLamelBitis?: number;
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

