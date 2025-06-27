import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft } from "lucide-react";

import { OfferActions } from "./offer-actions";

interface OfferHeaderProps {
  offerName: string;
  onEdit: () => void;
  onBack: () => void;
  onImalatList: (selectedTypes: string[]) => void;
  onFiyatAnaliz: () => void;
  onDepoCikisFisi: () => void;
  onTeklifFormu: () => void;
  hasSelectedPosition: boolean;
  loading: boolean;
}

export function OfferHeader({
  offerName,
  onEdit,
  onBack,
  onImalatList,
  onFiyatAnaliz,
  hasSelectedPosition,
  onDepoCikisFisi,
  onTeklifFormu,
}: OfferHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4 justify-between w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{offerName}</h1>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <div className="hidden sm:flex">
            <OfferActions
              onImalatList={onImalatList}
              onDepoCikisFisi={onDepoCikisFisi}
              onTeklifFormu={onTeklifFormu}
              onFiyatAnaliz={onFiyatAnaliz}
              hasSelectedPosition={hasSelectedPosition}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ">
          <div className="flex sm:hidden">
            <OfferActions
              onImalatList={onImalatList}
              onDepoCikisFisi={onDepoCikisFisi}
              onTeklifFormu={onTeklifFormu}
              onFiyatAnaliz={onFiyatAnaliz}
              hasSelectedPosition={hasSelectedPosition}
            />
          </div>
          <Button variant="outline" onClick={onBack}>
            <span className="hidden sm:inline">Tekliflere Dön</span>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

OfferHeader.defaultProps = {
  offerName: "",
  onEdit: () => {},
  onBack: () => {},
  onImalatList: () => {},
  onFiyatAnaliz: () => {},
  onDepoCikisFisi: () => {},
  onTeklifFormu: () => {},
  hasSelectedPosition: false,
  loading: false,
};
