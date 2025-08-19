// Genel product selections base type
export interface BaseSelections {
  quantity: number;
  unitPrice: number;
  selectedProducts?: {
    products: unknown[];
    accessories: unknown[];
  };
  productId?: string;
  // Her product bu base'i extend edecek ve kendi spesifik field'larını ekleyecek
}
export interface PergoleSelections extends BaseSelections {
  // Pergole için özel field'lar buraya eklenecek
  width?: number;
  length?: number;
  fabric?: string;
}

export interface TenteSelections extends BaseSelections {
  // Tente için özel field'lar buraya eklenecek
  width?: number;
  projection?: number;
  fabric?: string;
}
