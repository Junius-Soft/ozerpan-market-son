"use client";

import { type Product } from "@/documents/products";
import { DynamicPreview } from "@/app/offers/[offerNo]/add-position/steps/components/dynamic-preview";
import { ShutterPreview } from "@/app/offers/[offerNo]/add-position/steps/components/shutter-preview";
import { WindowPreview } from "@/app/offers/[offerNo]/add-position/steps/components/window-preview";
import { DoorPreview } from "@/app/offers/[offerNo]/add-position/steps/components/door-preview";
import { InsectScreenPreview } from "@/app/offers/[offerNo]/add-position/steps/components/insect-screen-preview";

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

  // Fallback to product type based preview if no tab-specific preview defined
  switch (product.id) {
    case "panjur":
      return (
        <ShutterPreview width={width} height={height} className={className} />
      );
    case "pencere":
      return (
        <WindowPreview width={width} height={height} className={className} />
      );
    case "kapi":
      return (
        <DoorPreview width={width} height={height} className={className} />
      );
    case "sineklik":
      return (
        <InsectScreenPreview
          width={width}
          height={height}
          className={className}
        />
      );
    default:
      return null;
  }
}
