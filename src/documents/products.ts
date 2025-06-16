export interface CustomFilterProperties {
  maxWidth?: number;
  maxHeight?: number;
  // İleride eklenebilecek diğer özellikler için açık
}

export interface FilterItem {
  field: string;
  valueMap?: Record<string, string[]>;
  properties?: Record<string, CustomFilterProperties>;
}

export interface OptionWithBrand {
  id?: string;
  name: string;
  image?: string; // opsiyonel resim desteği
  color?: string; // renk desteği eklendi
}

export interface ProductTabField {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "radio" | "checkbox";
  options?: OptionWithBrand[];
  min?: number;
  max?: number;
  default?: string | number | boolean;
  filterBy?: FilterItem | FilterItem[];
  disabled?: boolean;
  dependsOn?: {
    field: string;
    value: string | string[]; // Allow either a single string or an array of strings
  };
}

export interface ProductPreview {
  type: string;
  component: string;
}

export interface ProductTab {
  id: string;
  name: string;
  content?: {
    fields: ProductTabField[];
    preview?: ProductPreview;
  };
}

export interface ProductsResponse {
  defaultProduct: string;
  defaultType: string;
  defaultOption: string;
  products: Product[];
}

export interface ProductTabsResponse {
  tabs: ProductTab[];
}

export const getProductTabs = async (
  productId: string,
  typeId?: string | null,
  optionId?: string | null
): Promise<ProductTabsResponse> => {
  const params = new URLSearchParams();
  params.set("productId", productId);
  if (typeId) params.set("typeId", typeId);
  if (optionId) params.set("optionId", optionId);

  const response = await fetch(`/api/products/tabs?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch product tabs");
  }
  return response.json();
};

export interface ProductDimension {
  min: number;
  max: number;
}

export interface ProductDimensions {
  width: ProductDimension;
  height: ProductDimension;
}

export interface Product {
  id: string;
  name: string;
  isActive: boolean;
  image: string;
  dimensions?: ProductDimensions;
  options?: ProductOption[];
  types?: ProductType[];
  tabs?: ProductTab[];
}

export interface ProductOption {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface ProductType {
  id: string;
  name: string;
  image: string;
  disabled: boolean;
}

// Function to get products from JSON file
export const getProducts = async (): Promise<ProductsResponse> => {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to get products:", error);
    return {
      defaultProduct: "",
      defaultType: "",
      defaultOption: "",
      products: [],
    };
  }
};
