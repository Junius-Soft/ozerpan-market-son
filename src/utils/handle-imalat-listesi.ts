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
 * @param selectedTypes Seçili ürün tipleri (varsa)
 */
export async function handleImalatListesiPDF({
  offerNo,
  product,
  values,
  selectedPosition,
  typeId,
  optionId,
  selectedTypes,
}: {
  offerNo: string;
  product: { id: string; name: string };
  values: PanjurSelections;
  selectedPosition?: string | null;
  typeId?: string | null;
  optionId?: string | null;
  selectedTypes?: string[];
}) {
  const currentOffer = await getOffer(offerNo);
  if (currentOffer && product) {
    let products = values.selectedProducts?.products || [];
    if (selectedTypes && selectedTypes.length > 0) {
      const normalizedTypes = selectedTypes.map((t) => t.toLowerCase().trim());
      products = products.filter((prod) => {
        //prod'un descriptionu seçilen tiplerden birini içeriyor mu?
        const prodDesc = prod.description.toLowerCase().trim();
        return normalizedTypes.some((type) => prodDesc.includes(type));
      });
    }
    const position: Position = {
      id: selectedPosition || `POS-${Date.now()}`,
      pozNo: "1",
      unit: "adet",
      quantity: values.quantity || 1,
      unitPrice: values.unitPrice || 0,
      selectedProducts: {
        products,
        accessories: values.selectedProducts?.accessories || [],
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
