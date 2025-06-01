export interface Position {
  id: string;
  pozNo: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Offer {
  id: string;
  name: string;
  created_at: string;
  total: string;
  status: "Taslak" | "Kaydedildi" | "Revize";
  positions: Position[];
  is_dirty?: boolean; // pozlarda değişiklik yapıldığını takip etmek için
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
