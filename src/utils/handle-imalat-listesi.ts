import { Position } from "@/documents/offers";
import { PanjurSelections } from "@/types/panjur";
import { getOffer } from "@/documents/offers";

/**
 * Aktif pozisyonu PDF olarak gösteren yardımcı fonksiyon.
 * @param offerNo Teklif numarası
 * @param product Ürün objesi
 * @param values Formik values (güncel poz detayları)
 * @param selectedPosition Pozisyon ID'si (varsa)
 * @param typeId Tip ID (varsa)
 * @param optionId Opsiyon ID (varsa)
 */
export async function handleImalatListesiPDF({
  offerNo,
  product,
  values,
  selectedPosition,
  typeId,
  optionId,
}: {
  offerNo: string;
  product: { id: string; name: string };
  values: PanjurSelections;
  selectedPosition?: string | null;
  typeId?: string | null;
  optionId?: string | null;
}) {
  const currentOffer = await getOffer(offerNo);
  if (currentOffer && product) {
    const position: Position = {
      id: selectedPosition || `POS-${Date.now()}`,
      pozNo: "1",
      unit: "adet",
      quantity: values.quantity || 1,
      unitPrice: values.unitPrice || 0,
      selectedProducts: values.selectedProducts || {
        products: [],
        accessories: [],
      },
      productId: product.id,
      typeId: typeId || null,
      productName: product.name,
      optionId: optionId || null,
      productDetails: values,
      total: (values.unitPrice || 0) * (values.quantity || 1),
    };
    const utils = await import("@/utils/offer-utils");
    utils.openImalatListPDFMulti(currentOffer, [position]);
  }
}
