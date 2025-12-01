import { Product } from "@/documents/products";
import { openDepoCikisFisiPDFMulti } from "@/utils/depo-pdf-generator";
import { PanjurSelections, SelectedProduct } from "@/types/panjur";
import { KepenkSelections } from "@/types/kepenk";
import { SineklikSelections } from "@/types/sineklik";
import { Offer, Position } from "@/documents/offers";

interface HandleDepoCikisFisiPDFParams {
  product: Product;
  values: PanjurSelections | KepenkSelections | SineklikSelections;
  typeId?: string | null;
  offerNo?: string;
  quantity: number;
}

export async function handleDepoCikisFisiPDF({
  product,
  values,
  typeId,
  offerNo,
  quantity,
}: HandleDepoCikisFisiPDFParams) {
  // Extract accessories from form values
  const accessories: SelectedProduct[] =
    values.selectedProducts?.accessories || [];

  const products: SelectedProduct[] = values.selectedProducts?.products || [];

  // Create a minimal Position for the PDF
  const fakePosition: Position = {
    id: "1",
    pozNo: typeId || "-",
    unit: "adet",
    quantity: quantity || 1,
    unitPrice: 0,
    selectedProducts: {
      products: products,
      accessories,
    },
    productId: product.id,
    typeId: typeId || null,
    productName: product.name,
    optionId: null,
    currency: product.currency || "EUR",
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

  openDepoCikisFisiPDFMulti(fakeOffer, [fakePosition]);
}
