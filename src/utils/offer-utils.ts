import { Position } from "@/documents/offers";
import { parsePrice } from "@/utils/price-formatter";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Offer } from "@/documents/offers";

// Turkish PDF font fix: embed DejaVuSans (or fallback to Arial Unicode MS if available)
// 1. Import the font file (base64 or .ttf converted to js)
// 2. Register the font with jsPDF
// 3. Set font to 'DejaVu' for all text
// NOTE: You must have the font file loaded in public or as a base64 string for this to work in browser

// Example for DejaVuSans (if you have the .ttf or .js font file):
// import DejaVuSans from "./DejaVuSans-normal.js";
// if (typeof window !== "undefined" && (window as any).jsPDF) {
//   (window as any).jsPDF.API.events.push(["addFonts", function() {
//     this.addFileToVFS("DejaVuSans.ttf", DejaVuSans);
//     this.addFont("DejaVuSans.ttf", "DejaVu", "normal");
//   }]);
// }

// For now, use built-in 'times' font which has better Turkish support than 'helvetica'
export function openImalatListPDF(offer: Offer, position: Position) {
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });
  doc.setFont("times", "");

  // Header
  doc.setFontSize(14);
  doc.text(`${offer.name} / ${offer.id}`, 10, 15);
  doc.setFontSize(10);
  doc.text(`Miktar: ${position.quantity} Adet`, 160, 15, { align: "right" });
  doc.setFontSize(12);
  doc.text("POZ İMALAT LİSTESİ", 10, 30);

  // Profil Listesi Table
  autoTable(doc, {
    startY: 40,
    head: [
      [
        "S.No",
        "StokKodu",
        "Konum",
        "Açıklama",
        "Ölçü",
        "Sol/Sağ Açık",
        "Miktar",
        "Ok",
      ],
    ],
    body: (position.selectedProducts?.products || []).map((item, idx) => [
      idx + 1,
      item.stock_code,
      item.type || "",
      item.description,
      "", // Ölçü (size) alanı yoksa boş bırak
      "", // Sol/Sağ Açık (side) alanı yoksa boş bırak
      item.quantity,
      "",
    ]),
    theme: "grid",
    headStyles: { fillColor: [230, 230, 230] },
    styles: { fontSize: 9, font: "times" },
    margin: { left: 10, right: 10 },
    didDrawPage: (data: { settings: { startY: number } }) => {
      doc.setFontSize(11);
      doc.setFont("times", "");
      doc.text("Profil Listesi", 10, data.settings.startY - 6);
    },
  });

  // Aksesuar Listesi Table
  const lastY =
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable
      ?.finalY || 60;
  autoTable(doc, {
    startY: lastY + 10,
    head: [["S.No", "StokKodu", "Açıklama", "Miktar"]],
    body: (position.selectedProducts?.accessories || []).map((item, idx) => [
      idx + 1,
      item.stock_code,
      item.description,
      `${item.quantity || 1} Adet`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [230, 230, 230] },
    styles: { fontSize: 9, font: "times" },
    margin: { left: 10, right: 10 },
    didDrawPage: (data: { settings: { startY: number } }) => {
      doc.setFontSize(11);
      doc.setFont("times", "");
      doc.text("Aksesuar Listesi", 10, data.settings.startY - 6);
    },
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont("times", "");
  doc.text(`${offer.id} / 1    Sayfa : 1-2`, 200, 290, { align: "right" });

  // Open in new tab
  window.open(doc.output("bloburl"), "_blank");
}

export function calculateTotals(positions: Position[]) {
  const subtotal = positions.reduce((sum, pos) => {
    const posTotal = parsePrice(pos.total);
    return sum + posTotal;
  }, 0);
  const vat = subtotal * 0.18; // 18% KDV
  return {
    subtotal: subtotal,
    vat: vat,
    total: subtotal + vat,
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
