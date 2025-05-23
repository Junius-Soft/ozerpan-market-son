export interface ProductType {
  id: string;
  name: string;
  image: string;
}

export interface ProductOption {
  id: string;
  name: string;
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
