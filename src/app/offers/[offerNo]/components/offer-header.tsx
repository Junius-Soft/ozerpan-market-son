import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, PieChart } from "lucide-react";
import { PozImalatListesiButton } from "@/components/poz-imalat-listesi-button";

interface OfferHeaderProps {
  offerName: string;
  onEdit: () => void;
  onBack: () => void;
  onImalatList: (selectedTypes: string[]) => void;
  onFiyatAnaliz: () => void;
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
}: OfferHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{offerName}</h1>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>

        <PozImalatListesiButton
          onConfirm={onImalatList}
          disabled={!hasSelectedPosition}
        />

        <Button
          variant="ghost"
          type="button"
          onClick={onFiyatAnaliz}
          disabled={!hasSelectedPosition}
        >
          <PieChart className="h-4 w-4" />
          <span className="hidden sm:inline">Fiyat Analizi</span>
        </Button>
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
  hasSelectedPosition: false,
  loading: false,
};
