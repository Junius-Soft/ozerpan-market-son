export interface ProductType {
  id: string;
  name: string;
  image: string;
}

export interface ProductOption {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface OptionWithBrand {
  id: string;
  name: string;
  brand?: string;
  product_group?: string;
  selected_product_group?: string;
  product_group_selector?: boolean;
}

export interface ProductTabField {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "radio" | "checkbox";
  options?: OptionWithBrand[];
  min?: number;
  max?: number;
  default?: string | number | boolean;
  filterBy?: string;
  product_group_dependent?: boolean;
  product_group_selector?: boolean;
  dependsOn?: {
    field: string;
    value: string;
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
