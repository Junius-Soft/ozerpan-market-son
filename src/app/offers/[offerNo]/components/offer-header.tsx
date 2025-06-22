import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, PieChart } from "lucide-react";
import { PozImalatListesiButton } from "@/components/poz-imalat-listesi-button";
import { Skeleton } from "@/components/ui/skeleton";

interface OfferHeaderProps {
  offerName: string;
  onEdit: () => void;
  onBack: () => void;
  onImalatList: (selectedTypes: string[]) => void;
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
  loading = false,
}: OfferHeaderProps & { loading?: boolean }) {
  if (loading) {
    return (
      <>
        {/* Masaüstü skeleton */}
        <div className="hidden sm:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        {/* Mobil skeleton */}
        <div className="flex flex-col gap-3 sm:hidden">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 flex-1" />
            <Skeleton className="h-8 w-20 flex-1" />
          </div>
        </div>
      </>
    );
  }

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
