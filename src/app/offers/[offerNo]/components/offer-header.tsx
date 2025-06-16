import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, ClipboardList, PieChart } from "lucide-react";

interface OfferHeaderProps {
  offerName: string;
  onEdit: () => void;
  onBack: () => void;
  onImalatList: () => void;
  onFiyatAnaliz: () => void;
  hasSelectedPosition: boolean;
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
      <div className="flex items-center gap-4 ">
        <h1 className="text-2xl font-bold">{offerName}</h1>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={onImalatList}
          disabled={!hasSelectedPosition}
        >
          <ClipboardList className="h-4 w-4" />
          Poz İmalat Listesi
        </Button>

        <Button
          variant="ghost"
          type="button"
          onClick={onFiyatAnaliz}
          disabled={!hasSelectedPosition}
        >
          <PieChart className="h-4 w-4" />
          Fiyat Analizi
        </Button>
      </div>
      <Button variant="outline" className="gap-2 " onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Tekliflere Dön
      </Button>
    </div>
  );
}
