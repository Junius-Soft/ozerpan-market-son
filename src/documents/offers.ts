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
  createdAt: string;
  total: string;
  status: "Taslak" | "Kaydedildi" | "Revize";
  positions: Position[];
  isDirty?: boolean; // pozlarda değişiklik yapıldığını takip etmek için
}

// API functions for offer management

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Client side
    return window.location.origin;
  }
  // Server side
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

// Function to save offers to JSON file
export const saveOffers = async (offers: Offer[]) => {
  try {
    await fetch(`${getBaseUrl()}/api/offers`, {
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

// Function to get offers from JSON file
export const getOffers = async (): Promise<Offer[]> => {
  try {
    const response = await fetch(`${getBaseUrl()}/api/offers`);
    if (!response.ok) throw new Error("Failed to fetch offers");
    return response.json();
  } catch (error) {
    console.error("Failed to get offers:", error);
    return [];
  }
};

// Export empty array initially (will be populated from API)
export const offers: Offer[] = [];
