import { Product } from "@/documents/products";
import { openDepoCikisFisiPDFMulti } from "@/utils/depo-pdf-generator";
import { PriceItem, PanjurSelections } from "@/types/panjur";
import { Offer, Position } from "@/documents/offers";

interface HandleDepoCikisFisiPDFParams {
  product: Product;
  values: PanjurSelections;
  typeId?: string | null;
  offerNo?: string;
}

export async function handleDepoCikisFisiPDF({
  product,
  values,
  typeId,
  offerNo,
}: HandleDepoCikisFisiPDFParams) {
  // Extract accessories from form values
  const accessories: PriceItem[] = values.selectedProducts?.accessories || [];
  // Create a minimal Position for the PDF
  const fakePosition: Position = {
    id: "-",
    pozNo: typeId || "-",
    unit: "adet",
    quantity: values.quantity || 1,
    unitPrice: 0,
    selectedProducts: {
      products: [],
      accessories,
    },
    productId: product.id,
    typeId: typeId || null,
    productName: product.name,
    optionId: null,
    productDetails: values,
    total: 0,
  };
  // Use offerNo as the id for barcode if provided
  const fakeOffer: Offer = {
    id: offerNo || product.id,
    name: product.name,
    created_at: new Date().toISOString(),
    status: "Taslak",
    positions: [fakePosition],
  };
  console.log({ fakeOffer });

  openDepoCikisFisiPDFMulti(fakeOffer, [fakePosition]);
}
