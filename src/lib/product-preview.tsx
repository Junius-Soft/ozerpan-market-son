/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { type Product } from "@/documents/products";
import {
  DynamicPreview,
  DynamicPreviewRef,
} from "@/app/offers/[offerNo]/add-position/steps/components/dynamic-preview";
import { FormikProps } from "formik";
import { forwardRef, useImperativeHandle, useRef } from "react";

interface ProductPreviewProps {
  product: Product | null;
  formik: FormikProps<any>;
  width?: number;
  height?: number;
  className?: string;
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
}

export interface ProductPreviewRef {
  exportCanvas: () => string | null;
}

export const getProductPreview = forwardRef<
  ProductPreviewRef,
  ProductPreviewProps
>(
  (
    { product, formik, width = 0, height = 0, className = "", seperation },
    ref
  ) => {
    const dynamicPreviewRef = useRef<DynamicPreviewRef>(null);

    // Export canvas function exposed via ref
    useImperativeHandle(ref, () => ({
      exportCanvas: () => {
        if (dynamicPreviewRef.current) {
          return dynamicPreviewRef.current.exportCanvas();
        }
        return null;
      },
    }));

    if (!product) return null;

    // First check if there's a tab-specific preview

    return (
      <DynamicPreview
        ref={dynamicPreviewRef}
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
);

getProductPreview.displayName = "ProductPreview";
