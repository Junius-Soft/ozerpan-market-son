import { PozImalatListesiButton } from "@/components/poz-imalat-listesi-button";
import { DepoCikisFisiButton } from "@/components/depo-cikis-fisi-button";
import { TeklifFormuButton } from "@/components/teklif-formu-button";
import { Button } from "@/components/ui/button";
import { PieChart, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

interface OfferActionsProps {
  onImalatList: (selectedTypes: string[]) => void;
  onDepoCikisFisi: () => void;
  onTeklifFormu?: () => void;
  onFiyatAnaliz: () => void;
  hasSelectedPosition: boolean;
  hideOfferForm?: boolean;
}

export function OfferActions({
  onImalatList,
  onDepoCikisFisi,
  onFiyatAnaliz,
  onTeklifFormu,
  hasSelectedPosition,
  hideOfferForm = false,
}: OfferActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          İşlemler
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <div className="flex flex-col gap-2 py-2 min-w-[180px]">
          <PozImalatListesiButton
            onConfirm={onImalatList}
            disabled={!hasSelectedPosition}
          />
          <DepoCikisFisiButton
            onConfirm={onDepoCikisFisi}
            disabled={!hasSelectedPosition}
          />
          {!hideOfferForm && (
            <TeklifFormuButton
              onConfirm={onTeklifFormu}
              disabled={!hasSelectedPosition}
            />
          )}
          <Button
            variant="ghost"
            type="button"
            onClick={onFiyatAnaliz}
            disabled={!hasSelectedPosition}
            className="justify-start"
          >
            <PieChart className="h-4 w-4 mr-2" />
            <span>Fiyat Analizi</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
