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

// Gelecekte eklenecek ürün tipleri için placeholder type'lar
export interface SineklikSelections extends BaseSelections {
  // Sineklik için özel field'lar buraya eklenecek
  width?: number;
  height?: number;
  color?: string;
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
