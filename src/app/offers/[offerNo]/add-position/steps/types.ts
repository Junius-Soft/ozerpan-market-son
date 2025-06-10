// Base types from panjur.ts
import type { SelectedProduct } from "@/types/panjur";

// Tab-level types
export interface TabFieldValue {
  [key: string]: string | number;
}

// Each tab contains key-value pairs of fields
export interface TabData {
  [key: string]: TabFieldValue;
}

// The full form data structure
export interface FormValues {
  details: TabData;
  quantity: number;
  unitPrice: number;
  selectedProducts: {
    products: SelectedProduct[];
    accessories: import("@/types/panjur").PriceItem[];
  };
}

// What we use for individual tab data
export type ProductDetails = TabData;
