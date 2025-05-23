"use client";

import { type Product } from "@/documents/products";
import { ShutterPreview } from "@/app/offers/[offerNo]/add-position/steps/components/shutter-preview";

interface ProductPreviewProps {
  product: Product | null;
  width?: number;
  height?: number;
  className?: string;
}

export function getProductPreview({
  product,
  width = 0,
  height = 0,
  className = "",
}: ProductPreviewProps) {
  if (!product) return null;

  switch (product.id) {
    case "panjur":
      return (
        <ShutterPreview width={width} height={height} className={className} />
      );
    // Diğer ürün tipleri için preview componentleri buraya eklenecek
    // case "pencere":
    //   return <WindowPreview width={width} height={height} className={className} />;
    default:
      return null;
  }
}
