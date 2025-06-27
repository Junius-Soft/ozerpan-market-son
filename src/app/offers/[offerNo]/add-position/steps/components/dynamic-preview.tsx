"use client";

import { ShutterPreview } from "./shutter-preview";
import { WindowPreview } from "./window-preview";
import { DoorPreview } from "./door-preview";
import { InsectScreenPreview } from "./insect-screen-preview";

interface DynamicPreviewProps {
  width: number;
  height: number;
  className?: string;
  productId: string;
  lamelColor?: string;
  boxColor?: string;
  subPartColor?: string;
  dikmeColor?: string;
  boxHeight?: number; // kutu yüksekliği (mm)
}

export function DynamicPreview({
  width,
  height,
  className = "",
  productId,
  lamelColor,
  boxColor,
  subPartColor,
  dikmeColor,
  boxHeight = 0, // kutu yüksekliği (mm)
}: DynamicPreviewProps) {
  // Select the appropriate preview component based on the component name
  const renderPreview = () => {
    switch (productId) {
      case "panjur":
        return (
          <ShutterPreview
            width={width}
            height={height}
            className={className}
            lamelColor={lamelColor}
            boxColor={boxColor}
            subPartColor={subPartColor}
            dikmeColor={dikmeColor}
            boxHeight={boxHeight} // kutu yüksekliği (mm)
          />
        );
      case "WindowPreview":
        return (
          <WindowPreview width={width} height={height} className={className} />
        );
      case "DoorPreview":
        return (
          <DoorPreview width={width} height={height} className={className} />
        );
      case "InsectScreenPreview":
        return (
          <InsectScreenPreview
            width={width}
            height={height}
            className={className}
          />
        );
      default:
        return (
          <div
            className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}
          >
            <span className="text-gray-500 text-sm">Preview not available</span>
          </div>
        );
    }
  };

  // If this is used directly in a container, return just the preview component
  if (className.includes("w-full") || className.includes("h-full")) {
    return renderPreview();
  }

  // Otherwise wrap it in a container with styling
  return <div className="aspect-video relative">{renderPreview()}</div>;
}
