import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { type Product } from "@/documents/products";
import { useRouter } from "next/navigation";
import { ProductDetailsHeaderMobile } from "./ProductDetailsHeaderMobile";
import { OfferActions } from "../../components/offer-actions";

interface ProductDetailsHeaderProps {
  product: Product | null;
  typeId?: string | null;
  router: ReturnType<typeof useRouter>;
  selectedPosition?: string | null;
  productId?: string | null;
  productName?: string | null;
  optionId?: string | null;
  isLoading: boolean;
  isSaving: boolean;
  onImalatListesiConfirm: (selectedTypes: string[]) => Promise<void>;
  onDepoCikisFisiConfirm: () => Promise<void>;
  onBackToOffer: () => void;
  onSubmit: () => void;
  onFiyatAnaliz: () => void;
}

export const ProductDetailsHeader: React.FC<ProductDetailsHeaderProps> = (
  props
) => {
  return (
    <>
      {/* Desktop (sm ve üstü) */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {props.product?.name} Detayları{" "}
            {props.typeId ? `(${props.typeId})` : ""}
          </h1>
          <Button
            variant="ghost"
            onClick={() =>
              props.router.push(
                `/offers/${
                  window.location.pathname.split("/")[2]
                }/add-position/select-product?selectedPosition=${
                  props.selectedPosition ?? ""
                }&productId=${props.productId}&productName=${
                  props.productName
                }${props.typeId ? `&typeId=${props.typeId}` : ""}${
                  props.optionId ? `&optionId=${props.optionId}` : ""
                }`
              )
            }
            className="gap-2"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürün Seçimi
          </Button>
          <OfferActions
            onImalatList={props.onImalatListesiConfirm}
            onDepoCikisFisi={props.onDepoCikisFisiConfirm}
            onFiyatAnaliz={props.onFiyatAnaliz}
            hasSelectedPosition={!!props.product && !props.isLoading}
            hideOfferForm
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" type="button" onClick={props.onBackToOffer}>
            Teklif Detayı
          </Button>
          <Button
            variant="default"
            disabled={props.isSaving}
            type="submit"
            onClick={props.onSubmit}
          >
            {props.isSaving
              ? "Kaydediliyor..."
              : props.selectedPosition
              ? "Güncelle"
              : "Tamamla"}
          </Button>
        </div>
      </div>
      {/* Mobile (sm altı) */}
      <ProductDetailsHeaderMobile {...props} />
    </>
  );
};
