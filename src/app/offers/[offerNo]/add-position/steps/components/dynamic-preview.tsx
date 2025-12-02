"use client";

import { ShutterPreview, ShutterPreviewRef } from "./shutter-preview";
import { InsectScreenPreview } from "./insect-screen-preview";
import { KepenkPreview, KepenkPreviewRef } from "./kepenk-preview";
import { Product } from "@/documents/products";
import { FormikProps } from "formik";
import { getColorHexFromProductTabs } from "@/utils/get-color-hex";
import {
  calculateLamelCount,
  calculateSystemHeight,
  calculateSystemWidth,
  getBoxHeight,
} from "@/utils/panjur";
import { forwardRef, useRef, useImperativeHandle, useCallback } from "react";
import { GlassBalconyPreview } from "./glass-balcony-preview";
import { getBoxHeight as getKepenkBoxHeight } from "@/utils/kepenk";

interface DynamicPreviewProps {
  product: Product | null;
  width: number;
  height: number;
  className?: string;
  productId: string;
  formik: FormikProps<Record<string, unknown>>;
  seperation: number; // Ayrım sayısı (örneğin, panjur için)
  offerName?: string;
  pozNo?: string;
  quantity?: number;
}

export interface DynamicPreviewRef {
  exportCanvas: () => string | null;
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

interface GlassBalconyProps {
  color?: string;
  altRayProfili?: string;
  camKalinligi?: string;
  camRengi?: string;
  conta?: string;
  kasaUzatma?: string;
  kolSayisi?: number;
  kol1_genislik?: number;
  kol1_kanat?: number;
  kol1_cikis_sayisi?: number;
  kol1_cikis_yonu?: string;
  kol1_sola_kanat?: number;
  kol1_sabitCamAdedi?: number;
  kol1_sabitCamGenisligi?: number;
  kol1_sabitCamYonu?: string;
  kol2_genislik?: number;
  kol2_kanat?: number;
  kol2_cikis_sayisi?: number;
  kol2_cikis_yonu?: string;
  kol2_sola_kanat?: number;
  kol2_sabitCamAdedi?: number;
  kol2_sabitCamGenisligi?: number;
  kol2_sabitCamYonu?: string;
  kol2_aci?: number;
  kol3_genislik?: number;
  kol3_kanat?: number;
  kol3_cikis_sayisi?: number;
  kol3_cikis_yonu?: string;
  kol3_sola_kanat?: number;
  kol3_sabitCamAdedi?: number;
  kol3_sabitCamGenisligi?: number;
  kol3_sabitCamYonu?: string;
  kol3_aci?: number;
  kol4_genislik?: number;
  kol4_kanat?: number;
  kol4_cikis_sayisi?: number;
  kol4_cikis_yonu?: string;
  kol4_sola_kanat?: number;
  kol4_sabitCamAdedi?: number;
  kol4_sabitCamGenisligi?: number;
  kol4_sabitCamYonu?: string;
  kol4_aci?: number;
  kol5_genislik?: number;
  kol5_kanat?: number;
  kol5_cikis_sayisi?: number;
  kol5_cikis_yonu?: string;
  kol5_sola_kanat?: number;
  kol5_sabitCamAdedi?: number;
  kol5_sabitCamGenisligi?: number;
  kol5_sabitCamYonu?: string;
  kol5_aci?: number;
}
export const DynamicPreview = forwardRef<
  DynamicPreviewRef,
  DynamicPreviewProps
>(
  (
    {
      product,
      width,
      height,
      className = "",
      productId,
      formik,
      offerName = "Cam Balkon Teklifi",
      pozNo = "1",
      quantity = 1,
      seperation,
    },
    ref
  ) => {
    const shutterPreviewRef = useRef<ShutterPreviewRef>(null);
    const kepenkPreviewRef = useRef<KepenkPreviewRef>(null);

    // Export canvas function exposed via ref
    useImperativeHandle(ref, () => ({
      exportCanvas: () => {
        if (productId === "panjur" && shutterPreviewRef.current) {
          return shutterPreviewRef.current.exportCanvas();
        }
        if (productId === "kepenk" && kepenkPreviewRef.current) {
          return kepenkPreviewRef.current.exportCanvas();
        }
        if (productId === "cam-balkon") {
          // Cam balkon için global değişkenden al
          const globalWindow = window as unknown as {
            __camBalkonCizimDataUrl?: string;
          };
          return globalWindow.__camBalkonCizimDataUrl || null;
        }
        return null;
      },
    }));

    // Her ürün için kendi parametrelerini ayarlayalım
    const getProductSpecificProps = () => {
      // Formik values, ürün tipine göre farklı alanlar içeriyor
      const values = formik.values as Record<string, unknown>;

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
            boxHeight: getBoxHeight(values.boxType as string),
            hareketBaglanti: values.hareketBaglanti as "sol" | "sag",
            movementType: values.movementType as "manuel" | "motorlu",
            lamelCount: calculateLamelCount(
              calculateSystemHeight(
                values.height as number,
                values.kutuOlcuAlmaSekli as string,
                values.boxType as string
              ),
              values.boxType as string,
              values.lamelTickness as string
            ),
            systemHeight: calculateSystemHeight(
              values.height as number,
              values.kutuOlcuAlmaSekli as string,
              values.boxType as string
            ),
            systemWidth:
              calculateSystemWidth(
                values.width as number,
                values.dikmeOlcuAlmaSekli as string,
                values.dikmeType as string
              ) + 10,
            changeMiddlebarPostion: true,
          };

        case "sineklik":
          return {
            frameColor: values.frameColor as string,
            meshType: values.meshType as string,
          };

        case "kepenk":
          // Kepenk için box height hesapla
          const is100mm = (values.lamelType as string)?.includes("100");
          const kepenkBoxType = is100mm ? "350mm" : "300mm";
          const kepenkBoxHeight = getKepenkBoxHeight(kepenkBoxType);

          return {
            boxHeight: kepenkBoxHeight,
            lamelType: values.lamelType as string,
            gozluLamelVar: values.gozluLamelVar as boolean,
            gozluLamelBaslangic: values.gozluLamelBaslangic as number,
            gozluLamelBitis: values.gozluLamelBitis as number,
          };

        case "cam-balkon":
          // Debug: values objesini kontrol et
          console.log(`Dynamic Preview - Cam Balkon Values Debug:`);
          console.log(`- values.kol1_genislik: ${values.kol1_genislik}`);
          console.log(`- values.kol1_kanat: ${values.kol1_kanat}`);
          console.log(`- values.kol1_cikisSayisi: ${values.kol1_cikisSayisi}`);
          console.log(`- values.kol1_cikisYonu: ${values.kol1_cikisYonu}`);
          console.log(
            `- values.kol1_sabitCamAdedi: ${values.kol1_sabitCamAdedi}`
          );
          console.log(
            `- values.kol1_sabitCamGenisligi: ${values.kol1_sabitCamGenisligi}`
          );
          console.log(
            `- values.kol1_sabitCamYonu: ${values.kol1_sabitCamYonu}`
          );
          console.log(`- values.kol2_aci: ${values.kol2_aci}`);

          return {
            color: values.color,
            altRayProfili: values.altRayProfili,
            camKalinligi: values.camKalinligi,
            camRengi: values.camRengi,
            conta: values.conta,
            kasaUzatma: values.kasaUzatma,
            kolSayisi: values.kolSayisi,
            kol1_genislik: values.kol1_genislik,
            kol1_kanat: values.kol1_kanat,
            kol1_cikis_sayisi: values.kol1_cikisSayisi,
            kol1_cikis_yonu: values.kol1_cikisYonu,
            kol1_sola_kanat: values.kol1_solaKanat,
            kol1_sabitCamAdedi: values.kol1_sabitCamAdedi,
            kol1_sabitCamGenisligi: values.kol1_sabitCamGenisligi,
            kol1_sabitCamYonu: values.kol1_sabitCamYonu,
            kol2_genislik: values.kol2_genislik,
            kol2_kanat: values.kol2_kanat,
            kol2_cikis_sayisi: values.kol2_cikisSayisi,
            kol2_cikis_yonu: values.kol2_cikisYonu,
            kol2_sola_kanat: values.kol2_solaKanat,
            kol2_sabitCamAdedi: values.kol2_sabitCamAdedi,
            kol2_sabitCamGenisligi: values.kol2_sabitCamGenisligi,
            kol2_sabitCamYonu: values.kol2_sabitCamYonu,
            kol2_aci: values.kol2_aci,
            kol3_genislik: values.kol3_genislik,
            kol3_kanat: values.kol3_kanat,
            kol3_cikis_sayisi: values.kol3_cikisSayisi,
            kol3_cikis_yonu: values.kol3_cikisYonu,
            kol3_sola_kanat: values.kol3_solaKanat,
            kol3_sabitCamAdedi: values.kol3_sabitCamAdedi,
            kol3_sabitCamGenisligi: values.kol3_sabitCamGenisligi,
            kol3_sabitCamYonu: values.kol3_sabitCamYonu,
            kol3_aci: values.kol3_aci,
            kol4_genislik: values.kol4_genislik,
            kol4_kanat: values.kol4_kanat,
            kol4_cikis_sayisi: values.kol4_cikisSayisi,
            kol4_cikis_yonu: values.kol4_cikisYonu,
            kol4_sola_kanat: values.kol4_solaKanat,
            kol4_sabitCamAdedi: values.kol4_sabitCamAdedi,
            kol4_sabitCamGenisligi: values.kol4_sabitCamGenisligi,
            kol4_sabitCamYonu: values.kol4_sabitCamYonu,
            kol4_aci: values.kol4_aci,
            kol5_genislik: values.kol5_genislik,
            kol5_kanat: values.kol5_kanat,
            kol5_cikis_sayisi: values.kol5_cikisSayisi,
            kol5_cikis_yonu: values.kol5_cikisYonu,
            kol5_sola_kanat: values.kol5_solaKanat,
            kol5_sabitCamAdedi: values.kol5_sabitCamAdedi,
            kol5_sabitCamGenisligi: values.kol5_sabitCamGenisligi,
            kol5_sabitCamYonu: values.kol5_sabitCamYonu,
            kol5_aci: values.kol5_aci,
          };

        default:
          return {};
      }
    };

    const productProps = getProductSpecificProps();
    // Callback'i useCallback ile sarmalayalım
    const handleHareketliCamArasiHesapla = useCallback(
      (total: number) => {
        try {
          console.log("📬 onHareketliCamArasiHesapla geldi:", total);
          // Formik içine yaz (PDF için productDetails'a gidecek)
          formik.setFieldValue("toplamHareketliCamArasi", total);
        } catch (e) {
          console.warn("toplamHareketliCamArasi yazılamadı", e);
        }
      },
      [formik]
    );

    // Sabit-Hareketli cam arası hesaplama callback'i
    const handleSabitHareketliCamArasiHesapla = useCallback(
      (total: number) => {
        try {
          console.log("📬 onSabitHareketliCamArasiHesapla geldi:", total);
          // Formik içine yaz (PDF için productDetails'a gidecek)
          formik.setFieldValue("toplamSabitHareketliCamArasi", total);
        } catch (e) {
          console.warn("toplamSabitHareketliCamArasi yazılamadı", e);
        }
      },
      [formik]
    );

    const renderPreview = () => {
      switch (productId) {
        case "panjur":
          const panjurProps = productProps as ShutterProps;

          return (
            <ShutterPreview
              ref={shutterPreviewRef}
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
        case "sineklik":
          return (
            <InsectScreenPreview
              width={width}
              height={height}
              className={className}
            />
          );
        case "kepenk":
          const kepenkProps = productProps as {
            boxHeight: number;
            lamelType?: string;
            gozluLamelVar?: boolean;
            gozluLamelBaslangic?: number;
            gozluLamelBitis?: number;
          };

          return (
            <KepenkPreview
              ref={kepenkPreviewRef}
              width={width}
              height={height}
              className={className}
              boxHeight={kepenkProps.boxHeight}
              lamelType={kepenkProps.lamelType}
              gozluLamelVar={kepenkProps.gozluLamelVar}
              gozluLamelBaslangic={kepenkProps.gozluLamelBaslangic}
              gozluLamelBitis={kepenkProps.gozluLamelBitis}
            />
          );
        case "cam-balkon":
          const glassBalconyProps = productProps as GlassBalconyProps;

          // Calculate total width from kol genişlik values
          let totalWidth = 0;
          const kolSayisi = Number(glassBalconyProps.kolSayisi) || 1;
          for (let i = 1; i <= kolSayisi; i++) {
            let kolGenislik = 0;
            switch (i) {
              case 1:
                kolGenislik = Number(glassBalconyProps.kol1_genislik) || 0;
                break;
              case 2:
                kolGenislik = Number(glassBalconyProps.kol2_genislik) || 0;
                break;
              case 3:
                kolGenislik = Number(glassBalconyProps.kol3_genislik) || 0;
                break;
              case 4:
                kolGenislik = Number(glassBalconyProps.kol4_genislik) || 0;
                break;
              case 5:
                kolGenislik = Number(glassBalconyProps.kol5_genislik) || 0;
                break;
            }
            totalWidth += kolGenislik;
          }

          // Use calculated width or fallback to default
          const calculatedWidth = totalWidth > 0 ? totalWidth : 1000;

          return (
            <GlassBalconyPreview
              width={calculatedWidth}
              height={height}
              className={className}
              color={glassBalconyProps.color}
              altRayProfili={glassBalconyProps.altRayProfili}
              camKalinligi={glassBalconyProps.camKalinligi}
              camRengi={glassBalconyProps.camRengi}
              conta={glassBalconyProps.conta}
              kasaUzatma={glassBalconyProps.kasaUzatma}
              offerName={offerName}
              pozNo={pozNo}
              quantity={quantity}
              onHareketliCamArasiHesapla={handleHareketliCamArasiHesapla}
              onSabitHareketliCamArasiHesapla={
                handleSabitHareketliCamArasiHesapla
              }
              kolSayisi={glassBalconyProps.kolSayisi}
              kol1_genislik={glassBalconyProps.kol1_genislik}
              kol1_kanat={glassBalconyProps.kol1_kanat}
              kol1_cikis_sayisi={glassBalconyProps.kol1_cikis_sayisi}
              kol1_cikis_yonu={glassBalconyProps.kol1_cikis_yonu}
              kol1_sola_kanat={glassBalconyProps.kol1_sola_kanat}
              kol1_sabitCamAdedi={glassBalconyProps.kol1_sabitCamAdedi}
              kol1_sabitCamGenisligi={glassBalconyProps.kol1_sabitCamGenisligi}
              kol1_sabitCamYonu={glassBalconyProps.kol1_sabitCamYonu}
              kol2_genislik={glassBalconyProps.kol2_genislik}
              kol2_kanat={glassBalconyProps.kol2_kanat}
              kol2_cikis_sayisi={glassBalconyProps.kol2_cikis_sayisi}
              kol2_cikis_yonu={glassBalconyProps.kol2_cikis_yonu}
              kol2_sola_kanat={glassBalconyProps.kol2_sola_kanat}
              kol2_sabitCamAdedi={glassBalconyProps.kol2_sabitCamAdedi}
              kol2_sabitCamGenisligi={glassBalconyProps.kol2_sabitCamGenisligi}
              kol2_sabitCamYonu={glassBalconyProps.kol2_sabitCamYonu}
              kol2_aci={glassBalconyProps.kol2_aci}
              kol3_genislik={glassBalconyProps.kol3_genislik}
              kol3_kanat={glassBalconyProps.kol3_kanat}
              kol3_cikis_sayisi={glassBalconyProps.kol3_cikis_sayisi}
              kol3_cikis_yonu={glassBalconyProps.kol3_cikis_yonu}
              kol3_sola_kanat={glassBalconyProps.kol3_sola_kanat}
              kol3_sabitCamAdedi={glassBalconyProps.kol3_sabitCamAdedi}
              kol3_sabitCamGenisligi={glassBalconyProps.kol3_sabitCamGenisligi}
              kol3_sabitCamYonu={glassBalconyProps.kol3_sabitCamYonu}
              kol3_aci={glassBalconyProps.kol3_aci}
              kol4_genislik={glassBalconyProps.kol4_genislik}
              kol4_kanat={glassBalconyProps.kol4_kanat}
              kol4_cikis_sayisi={glassBalconyProps.kol4_cikis_sayisi}
              kol4_cikis_yonu={glassBalconyProps.kol4_cikis_yonu}
              kol4_sola_kanat={glassBalconyProps.kol4_sola_kanat}
              kol4_sabitCamAdedi={glassBalconyProps.kol4_sabitCamAdedi}
              kol4_sabitCamGenisligi={glassBalconyProps.kol4_sabitCamGenisligi}
              kol4_sabitCamYonu={glassBalconyProps.kol4_sabitCamYonu}
              kol4_aci={glassBalconyProps.kol4_aci}
              kol5_genislik={glassBalconyProps.kol5_genislik}
              kol5_kanat={glassBalconyProps.kol5_kanat}
              kol5_cikis_sayisi={glassBalconyProps.kol5_cikis_sayisi}
              kol5_cikis_yonu={glassBalconyProps.kol5_cikis_yonu}
              kol5_sola_kanat={glassBalconyProps.kol5_sola_kanat}
              kol5_sabitCamAdedi={glassBalconyProps.kol5_sabitCamAdedi}
              kol5_sabitCamGenisligi={glassBalconyProps.kol5_sabitCamGenisligi}
              kol5_sabitCamYonu={glassBalconyProps.kol5_sabitCamYonu}
              kol5_aci={glassBalconyProps.kol5_aci}
            />
          );
        default:
          return (
            <div
              className={`flex items-center justify-center bg-gray-100 rounded-md ${className}`}
            >
              <span className="text-gray-500 text-sm">
                Preview not available
              </span>
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
);

DynamicPreview.displayName = "DynamicPreview";
