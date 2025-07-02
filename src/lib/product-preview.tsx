"use client";

import { type Product } from "@/documents/products";
import { DynamicPreview } from "@/app/offers/[offerNo]/add-position/steps/components/dynamic-preview";

interface ProductPreviewProps {
  product: Product | null;
  width?: number;
  height?: number;
  className?: string;
  productId: string;
  lamelColor?: string;
  boxColor?: string;
  subPartColor?: string;
  dikmeColor?: string;
  boxHeight?: number; // kutu yüksekliği (mm)
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
}

export function getProductPreview({
  product,
  width = 0,
  height = 0,
  className = "",
  productId,
  lamelColor,
  boxColor,
  subPartColor,
  dikmeColor,
  boxHeight = 0, // kutu yüksekliği (mm)
  hareketBaglanti,
  movementType,
}: ProductPreviewProps) {
  if (!product) return null;

  // First check if there's a tab-specific preview

  return (
    <DynamicPreview
      productId={productId}
      width={width}
      height={height}
      className={className}
      lamelColor={lamelColor}
      boxColor={boxColor}
      subPartColor={subPartColor}
      dikmeColor={dikmeColor}
      boxHeight={boxHeight}
      hareketBaglanti={hareketBaglanti}
      movementType={movementType}
    />
  );
}
