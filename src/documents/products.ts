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
  defaultValues?: Record<string, string | number | boolean>;
}

export interface ProductPreview {
  type: string;
  component: string;
}

export interface ProductTab {
  id: string;
  name: string;
  showIfOptionId?: string;
  content?: {
    fields: ProductTabField[];
    preview?: ProductPreview;
  };
  defaultValues?: Record<string, string | number | boolean>;
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
export interface Currency {
  code: string;
  symbol: string;
}
export interface Product {
  defaultType?: string;
  defaultOption?: string;
  id: string;
  name: string;
  isActive: boolean;
  image: string;
  currency: Currency;
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
export const getProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Failed to fetch products");
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error("Failed to get products:", error);
    return [];
  }
};

// Function to get a specific product by ID
export const getProductById = async (
  productId: string
): Promise<Product | null> => {
  try {
    const products = await getProducts();
    const product = products.find((p) => p.id === productId);
    return product || null;
  } catch (error) {
    console.error("Failed to get product by ID:", error);
    return null;
  }
};
