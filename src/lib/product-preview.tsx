"use client";

import { type Product } from "@/documents/products";
import { DynamicPreview } from "@/app/offers/[offerNo]/add-position/steps/components/dynamic-preview";

interface ProductPreviewProps {
  product: Product | null;
  width?: number;
  height?: number;
  className?: string;
  tabId?: string;
}

export function getProductPreview({
  product,
  width = 0,
  height = 0,
  className = "",
  tabId = "dimensions",
}: ProductPreviewProps) {
  if (!product) return null;

  // First check if there's a tab-specific preview
  if (tabId && product.tabs) {
    const currentTab = product.tabs.find((tab) => tab.id === tabId);
    if (currentTab?.content?.preview) {
      return (
        <DynamicPreview
          preview={currentTab.content.preview}
          width={width}
          height={height}
          className={className}
        />
      );
    }
  }
}
