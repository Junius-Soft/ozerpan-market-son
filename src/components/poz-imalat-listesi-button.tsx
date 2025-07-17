import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PozImalatListesiDialog } from "@/components/poz-imalat-listesi-dialog";

interface PozImalatListesiButtonProps {
  onConfirm: (selectedTypes: string[]) => void;
  disabled?: boolean;
  options?: { label: string; value: string }[];
}

export function PozImalatListesiButton({
  onConfirm,
  disabled = false,
  options,
}: PozImalatListesiButtonProps) {
  const defaultOptions = options || [
    { label: "Lamel", value: "Lamel" },
    { label: "Alt Parça", value: "Alt Parça" },
    { label: "Dikme", value: "Dikme" },
    { label: "Kutu", value: "Kutu" },
    { label: "Tambur Borusu", value: "Boru" },
    { label: "Yükseltme Profili", value: "Kasa Profili" },
  ];

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
