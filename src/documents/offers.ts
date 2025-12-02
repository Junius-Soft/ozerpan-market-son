import { PanjurSelections, SelectedProduct } from "@/types/panjur";
import { KepenkSelections } from "@/types/kepenk";
import { SineklikSelections } from "@/types/sineklik";
import { CamBalkonSelections } from "@/types/cam-balkon";
import { Currency } from "./products";

export interface Position {
  id: string;
  pozNo: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  selectedProducts?: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  };
  productId: string | null;
  typeId: string | null;
  productName: string | null;
  optionId: string | null;
  currency: Currency;
  productDetails: PanjurSelections | KepenkSelections | SineklikSelections | CamBalkonSelections;
  total: number; // Toplam fiyat
  canvasDataUrl?: string; // Canvas görselini Base64 formatında saklamak için
}

export interface Offer {
  id: string;
  name: string;
  created_at: string;
  status: "Taslak" | "Kaydedildi" | "Revize" | "Sipariş Verildi";
  positions: Position[];
  is_dirty?: boolean; // pozlarda değişiklik yapıldığını takip etmek için
  eurRate?: number;
}

// API functions for offer management

// Function to save offers to Supabase
export const saveOffers = async (offers: Offer[]) => {
  try {
    await fetch("/api/offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(offers),
    });
  } catch (error) {
    console.error("Failed to save offers:", error);
  }
};

// Function to get offers from Supabase
export const getOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch("/api/offers");
    if (!response.ok) throw new Error("Failed to fetch offers");
    return response.json();
  } catch (error) {
    console.error("Failed to get offers:", error);
    return [];
  }
};

// Function to get single offer by ID from Supabase
export const getOffer = async (offerId: string): Promise<Offer | null> => {
  try {
    const response = await fetch(`/api/offers/${offerId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch offer");
    }
    return response.json();
  } catch (error) {
    console.error("Failed to get offer:", error);
    return null;
  }
};

// Function to delete multiple positions from an offer
export const deletePositions = async (
  offerId: string,
  positionIds: string[]
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/offers/${offerId}/positions`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ positionIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete positions");
    }

    return true;
  } catch (error) {
    console.error("Failed to delete positions:", error);
    return false;
  }
};
