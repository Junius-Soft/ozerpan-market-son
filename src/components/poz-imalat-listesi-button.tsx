import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PozImalatListesiDialog } from "@/components/poz-imalat-listesi-dialog";
import { getImalatListesiOptions } from "@/utils/imalat-listesi-options";
import { Position } from "@/documents/offers";

interface PozImalatListesiButtonProps {
  onConfirm: (selectedTypes: string[]) => void;
  disabled?: boolean;
  selectedPositions: Position[];
}

export function PozImalatListesiButton({
  onConfirm,
  disabled = false,
  selectedPositions,
}: PozImalatListesiButtonProps) {
  // Seçili pozisyonlardan unique productId'leri al
  const uniqueProductIds = [
    ...new Set(selectedPositions.map((p) => p.productId).filter(Boolean)),
  ];
  // Tüm seçili ürünler için options'ları birleştir
  const defaultOptions = uniqueProductIds.reduce((acc, productId) => {
    const positionsWithThisProduct = selectedPositions.filter(
      (p) => p.productId === productId
    );
    const uniqueOptionIds = [
      ...new Set(
        positionsWithThisProduct.map((p) => p.optionId).filter(Boolean)
      ),
    ];

    // OptionId'si olan pozisyonlar için
    if (uniqueOptionIds.length > 0) {
      uniqueOptionIds.forEach((optionId) => {
        const options = getImalatListesiOptions(productId, optionId);
        options.forEach((option) => {
          if (!acc.some((existing) => existing.value === option.value)) {
            acc.push(option);
          }
        });
      });
    } else {
      // OptionId'si olmayan ürünler için (örn: sineklik)
      const options = getImalatListesiOptions(productId, null);
      options.forEach((option) => {
        if (!acc.some((existing) => existing.value === option.value)) {
          acc.push(option);
        }
      });
    }

    return acc;
  }, [] as { label: string; value: string }[]);

  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    defaultOptions.map((opt) => opt.value)
  );

  const handleImalatListClick = () => {
    setOpen(true);
  };

  const handleDialogConfirm = () => {
    setOpen(false);
    onConfirm(selectedTypes);
  };

  return (
    <>
      <Button
        variant="ghost"
        type="button"
        onClick={handleImalatListClick}
        disabled={disabled}
        className="justify-start"
      >
        <ClipboardList className="h-4 w-4" />
        <span>İmalat Listesi</span>
      </Button>
      <PozImalatListesiDialog
        open={open}
        onOpenChange={setOpen}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={setSelectedTypes}
        onConfirm={handleDialogConfirm}
        options={defaultOptions}
      />
    </>
  );
}
