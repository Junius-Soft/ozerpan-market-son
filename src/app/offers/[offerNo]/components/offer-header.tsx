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
}: OfferHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{offerName}</h1>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>

        <OfferActions
          onImalatList={onImalatList}
          onDepoCikisFisi={onDepoCikisFisi}
          onFiyatAnaliz={onFiyatAnaliz}
          hasSelectedPosition={hasSelectedPosition}
        />
      </div>
      <Button variant="outline" className="gap-2 " onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Tekliflere Dön</span>
      </Button>
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
  hasSelectedPosition: false,
  loading: false,
};
