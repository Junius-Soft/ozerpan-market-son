"use client";

import { ShutterPreview } from "./shutter-preview";
import { WindowPreview } from "./window-preview";
import { DoorPreview } from "./door-preview";
import { InsectScreenPreview } from "./insect-screen-preview";
import { Product } from "@/documents/products";
import { FormikProps } from "formik";
import { getColorHexFromProductTabs } from "@/utils/get-color-hex";
import {
  calculateLamelCount,
  calculateSystemHeight,
  calculateSystemWidth,
  getBoxHeight,
} from "@/utils/panjur";

interface DynamicPreviewProps {
  product: Product | null;
  width: number;
  height: number;
  className?: string;
  productId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formik: FormikProps<any>;
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
}
interface ShutterProps {
  lamelColor?: string;
  boxColor?: string;
  subPartColor?: string;
  dikmeColor?: string;
  boxHeight: number;
  hareketBaglanti: "sol" | "sag";
  movementType: "manuel" | "motorlu";
  lamelCount: number;
  systemHeight: number;
  systemWidth: number;
  changeMiddlebarPostion: boolean;
}
export function DynamicPreview({
  product,
  width,
  height,
  className = "",
  productId,
  formik,
  seperation,
}: DynamicPreviewProps) {
  // Her ürün için kendi parametrelerini ayarlayalım
  const getProductSpecificProps = () => {
    const values = formik.values;
    console.log({ values });

    switch (productId) {
      case "panjur":
        // Panjur için renk kodlarını bul
        const getColorHex = (fieldId: string): string | undefined => {
          return getColorHexFromProductTabs(
            product?.tabs ?? [],
            values,
            fieldId
          );
        };

        return {
          lamelColor: getColorHex("lamel_color"),
          boxColor: getColorHex("box_color"),
          subPartColor: getColorHex("subPart_color"),
          dikmeColor: getColorHex("dikme_color"),
          boxHeight: getBoxHeight(values.boxType),
          hareketBaglanti: values.hareketBaglanti,
          movementType: values.movementType,
          lamelCount: calculateLamelCount(
            calculateSystemHeight(
              values.height,
              values.kutuOlcuAlmaSekli,
              values.boxType
            ),
            values.boxType,
            values.lamelTickness
          ),
          systemHeight: calculateSystemHeight(
            values.height,
            values.kutuOlcuAlmaSekli,
            values.boxType
          ),
          systemWidth:
            calculateSystemWidth(
              values.width,
              values.dikmeOlcuAlmaSekli,
              values.dikmeType
            ) + 10,
          changeMiddlebarPostion: true,
        };

      case "window":
        return {
          frameColor: values.frameColor,
          glassType: values.glassType,
          handleType: values.handleType,
        };

      case "door":
        return {
          doorColor: values.doorColor,
          handleType: values.handleType,
          lockType: values.lockType,
        };

      case "insect_screen":
        return {
          frameColor: values.frameColor,
          meshType: values.meshType,
        };

      default:
        return {};
    }
  };

  const productProps = getProductSpecificProps();
  const renderPreview = () => {
    switch (productId) {
      case "panjur":
        const panjurProps = productProps as ShutterProps;

        return (
          <ShutterPreview
            width={width}
            height={height}
            className={className}
            lamelColor={panjurProps.lamelColor}
            boxColor={panjurProps.boxColor}
            subPartColor={panjurProps.subPartColor}
            dikmeColor={panjurProps.dikmeColor}
            boxHeight={panjurProps.boxHeight}
            hareketBaglanti={panjurProps.hareketBaglanti}
            movementType={panjurProps.movementType}
            seperation={seperation}
            lamelCount={panjurProps.lamelCount}
            changeMiddlebarPostion={panjurProps.changeMiddlebarPostion}
            systemHeight={panjurProps.systemHeight}
            systemWidth={panjurProps.systemWidth} // Assuming system width is the same as preview width
          />
        );
      case "window":
        return (
          <WindowPreview width={width} height={height} className={className} />
        );
      case "door":
        return (
          <DoorPreview width={width} height={height} className={className} />
        );
      case "insect_screen":
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
