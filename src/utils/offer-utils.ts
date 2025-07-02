import { Position } from "@/documents/offers";
import { parsePrice } from "@/utils/price-formatter";

// Import PDF generation functionality
import { generateImalatListPDF } from "@/utils/imalat-pdf-generator";
import { generateTeklifFormuPDF } from "@/utils/teklif-formu-pdf-generator";
import { Offer } from "@/documents/offers";

export function calculateTotals(positions: Position[]) {
  const subtotal = positions.reduce((sum, pos) => {
    const posTotal = parsePrice(pos.total);
    return sum + posTotal;
  }, 0);
  return {
    subtotal: subtotal,
  };
}

export function sortPositions(
  positions: Position[],
  sortKey: string,
  sortDirection: "asc" | "desc"
) {
  return positions.slice().sort((a, b) => {
    const aValue = a[sortKey as keyof Position];
    const bValue = b[sortKey as keyof Position];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });
}

export function togglePositionSelection(
  selectedPositions: string[],
  positionId: string
) {
  return selectedPositions.includes(positionId)
    ? selectedPositions.filter((id) => id !== positionId)
    : [...selectedPositions, positionId];
}

export function toggleAllPositions(
  offerPositions: Position[],
  selectedPositions: string[]
) {
  if (!offerPositions.length) return [];
  return selectedPositions.length === offerPositions.length
    ? []
    : offerPositions.map((pos) => pos.id);
}

export async function apiCopyPosition(
  offerId: string,
  positions: Position[],
  position: Position
) {
  // Create new position with incremented pozNo
  const lastPos = positions[positions.length - 1];
  const nextPozNo = String(parseInt(lastPos.pozNo) + 1).padStart(3, "0");
  const newPosition: Position = {
    ...position,
    id: `POS-${Date.now()}`,
    pozNo: nextPozNo,
  };
  const response = await fetch(`/api/offers?id=${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      positions: [...positions, newPosition],
    }),
  });
  if (!response.ok) throw new Error("Failed to copy position");
  return response;
}

export async function apiDeletePositions(
  offerId: string,
  selectedPositions: string[]
) {
  const response = await fetch(
    `/api/offers/${offerId}/positions?id=${offerId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ positionIds: selectedPositions }),
    }
  );
  if (!response.ok) throw new Error("Failed to delete positions");
  return response;
}

export async function apiSaveOfferName(offerId: string, offerName: string) {
  const response = await fetch(`/api/offers/${offerId}?id=${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: offerName }),
  });
  if (!response.ok) throw new Error("Failed to update offer name");
  return response;
}

export async function apiUpdateOfferStatus(
  offerId: string,
  newStatus: string,
  eurRate?: number
) {
  const response = await fetch(`/api/offers/${offerId}?id=${offerId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus, eurRate }),
  });
  if (!response.ok) throw new Error("Failed to update offer status");
  return response;
}

// PDF generation function for multiple positions
export function openImalatListPDFMulti(offer: Offer, positions: Position[]) {
  generateImalatListPDF(offer, positions);
}

// PDF generation function for Teklif Formu
export function openTeklifFormuPDFMulti(
  offer: Offer,
  positions: Position[],
  vatRate: number = 20,
  discountRate: number = 0,
  assemblyRate: number = 0
) {
  generateTeklifFormuPDF(offer, positions, vatRate, discountRate, assemblyRate);
}
