/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type Product } from "@/documents/products";
import { DynamicPreview } from "@/app/offers/[offerNo]/add-position/steps/components/dynamic-preview";
import { FormikProps } from "formik";

interface ProductPreviewProps {
  product: Product | null;
  formik: FormikProps<any>;
  width?: number;
  height?: number;
  className?: string;
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
}

export function getProductPreview({
  product,
  formik,
  width = 0,
  height = 0,
  className = "",
  seperation,
}: ProductPreviewProps) {
  if (!product) return null;

  // First check if there's a tab-specific preview

  return (
    <DynamicPreview
      product={product}
      productId={product.id}
      formik={formik}
      width={width}
      height={height}
      className={className}
      seperation={seperation}
    />
  );
}
