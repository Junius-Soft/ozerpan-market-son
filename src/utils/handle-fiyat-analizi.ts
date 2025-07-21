import { generateFiyatAnaliziPDFPozListesi } from "@/utils/fiyat-analizi-pdf-generator";
import { Offer } from "@/documents/offers";
import { PanjurSelections, PriceItem } from "@/types/panjur";
import { Product } from "@/documents/products";

interface HandleFiyatAnaliziPDFParams {
  product: Product;
  formikValues: PanjurSelections & Record<string, string | number | boolean>;
  productId?: string | null;
  typeId?: string | null;
  productName?: string | null;
  optionId?: string | null;
  offerNo: string;
}

export async function handleFiyatAnaliziPDF({
  product,
  formikValues,
  productId,
  typeId,
  productName,
  optionId,
  offerNo,
}: HandleFiyatAnaliziPDFParams) {
  // Extract accessories from form values
  const accessories: PriceItem[] =
    formikValues.selectedProducts?.accessories || [];
  const fakePosition = {
    id: "-",
    pozNo: typeId || "-",
    unit: "adet",
    quantity: formikValues.quantity || 1,
    unitPrice: formikValues.unitPrice || 0,
    selectedProducts: formikValues.selectedProducts || {
      products: [],
      accessories,
    },
    productId: productId ?? null,
    typeId: typeId || null,
    productName: productName ?? null,
    optionId: optionId ?? null,
    productDetails: formikValues,
    total: (formikValues.unitPrice || 0) * (formikValues.quantity || 1),
  };

  // Fake offer mantığı depo çıkış fişi ile aynı şekilde uygulanıyor
  const fakeOffer: Offer = {
    id: offerNo || product.id,
    name: product.name,
    created_at: new Date().toISOString(),
    status: "Taslak",
    positions: [fakePosition],
  };
  console.log({ fakeOffer });

  generateFiyatAnaliziPDFPozListesi(fakeOffer, [fakePosition]);
}
