import productsData from "../../data/products.json";

// products.json'daki ürünler tabs alanı olmadan geliyor, bu yüzden Product arayüzüne tam uymuyor.
// Sadece id ve name kullanıyoruz.
type ProductLike = { id: string; name: string };
const products: ProductLike[] = productsData.products;

export function getProductNameById(productId: string): string {
  const product = products.find((p) => p.id === productId);
  return product ? product.name : "-";
}
