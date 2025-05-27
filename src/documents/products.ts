export interface FilterItem {
  field: string;
  valueMap: {
    [key: string]: string[];
  };
}

export interface OptionWithBrand {
  id?: string;
  name: string;
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
  productId: string
): Promise<ProductTabsResponse> => {
  const response = await fetch(`/api/products/tabs?productId=${productId}`);
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
