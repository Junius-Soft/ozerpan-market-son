import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PozImalatListesiButton } from "@/components/poz-imalat-listesi-button";
import React from "react";
import { type Product } from "@/documents/products";
import { useRouter } from "next/navigation";

interface ProductDetailsHeaderMobileProps {
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
  onBackToOffer: () => void;
  onSubmit: () => void;
}

export const ProductDetailsHeaderMobile: React.FC<
  ProductDetailsHeaderMobileProps
> = ({
  product,
  typeId,
  router,
  selectedPosition,
  productId,
  productName,
  optionId,
  isLoading,
  isSaving,
  onImalatListesiConfirm,
  onBackToOffer,
  onSubmit,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:hidden">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold">
          {product?.name} Detayları {typeId ? `(${typeId})` : ""}
        </h1>
        <Button
          variant="default"
          disabled={isSaving}
          type="submit"
          onClick={onSubmit}
          className="flex-shrink-0 ml-2"
        >
          {isSaving
            ? "Kaydediliyor..."
            : selectedPosition
            ? "Güncelle"
            : "Tamamla"}
        </Button>
      </div>
      <div className="flex gap-2 w-full items-center">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/offers/${
                  window.location.pathname.split("/")[2]
                }/add-position/select-product?selectedPosition=${
                  selectedPosition ?? ""
                }&productId=${productId}&productName=${productName}${
                  typeId ? `&typeId=${typeId}` : ""
                }${optionId ? `&optionId=${optionId}` : ""}`
              )
            }
            className="gap-2 flex-shrink-0"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürün Seçimi
          </Button>
          <PozImalatListesiButton
            onConfirm={onImalatListesiConfirm}
            disabled={isLoading || !product}
          />
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={onBackToOffer}
          className="flex-shrink-0 ml-auto"
        >
          Teklif Detayı
        </Button>
      </div>
    </div>
  );
};
