import { generateFiyatAnaliziPDFPozListesi } from "@/utils/fiyat-analizi-pdf-generator";
import { getOffer, type Position } from "@/documents/offers";
import { PanjurSelections } from "@/types/panjur";

export async function handleFiyatAnaliziPDF({
  offerNo,
  selectedPosition,
  formikValues,
  productId,
  typeId,
  productName,
  optionId,
}: {
  offerNo: string;
  selectedPosition?: string | null;
  formikValues: PanjurSelections & Record<string, string | number | boolean>;
  productId?: string | null;
  typeId?: string | null;
  productName?: string | null;
  optionId?: string | null;
}) {
  const offer = await getOffer(offerNo);
  if (!offer) return;
  let pozisyonlar: Position[] = [];
  if (selectedPosition) {
    const pos = offer.positions.find((p) => p.id === selectedPosition);
    if (pos) pozisyonlar = [pos];
  } else {
    // Eğer yeni ekleniyorsa, formdaki değerlerle geçici pozisyon oluştur
    pozisyonlar = [
      {
        id: `TEMP-${Date.now()}`,
        pozNo: "-",
        unit: "adet",
        quantity: formikValues.quantity || 1,
        unitPrice: formikValues.unitPrice || 0,
        selectedProducts: formikValues.selectedProducts || {
          products: [],
          accessories: [],
        },
        productId: productId ?? null,
        typeId: typeId ?? null,
        productName: productName ?? null,
        optionId: optionId ?? null,
        productDetails: formikValues,
        total: (formikValues.unitPrice || 0) * (formikValues.quantity || 1),
      },
    ];
  }
  generateFiyatAnaliziPDFPozListesi(offer, pozisyonlar);
}
