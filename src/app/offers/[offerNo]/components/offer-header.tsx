import { Button } from "@/components/ui/button";
import { Edit2, ArrowLeft, ClipboardList, PieChart } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{offerName}</h1>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <TooltipProvider delayDuration={100}>
          <Tooltip disableHoverableContent={false}>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onImalatList}
                  disabled={!hasSelectedPosition}
                >
                  <ClipboardList className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent
              className={
                !hasSelectedPosition
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 text-yellow-600 dark:text-yellow-400"
                  : undefined
              }
            >
              {!hasSelectedPosition ? "Poz Seçiniz" : "Poz İmalat Listesi"}
            </TooltipContent>
          </Tooltip>
          <Tooltip disableHoverableContent={false}>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onFiyatAnaliz}
                  disabled={!hasSelectedPosition}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent
              className={
                !hasSelectedPosition
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 text-yellow-600 dark:text-yellow-400"
                  : undefined
              }
            >
              {!hasSelectedPosition ? "Poz Seçiniz" : "Fiyat Analizi"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button variant="outline" className="gap-2 " onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Tekliflere Dön
      </Button>
    </div>
  );
}
