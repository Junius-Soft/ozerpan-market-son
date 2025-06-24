import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PozImalatListesiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTypes: string[];
  onSelectedTypesChange: (types: string[]) => void;
  onConfirm: () => void;
  options?: { label: string; value: string }[];
}

export function PozImalatListesiDialog({
  open,
  onOpenChange,
  selectedTypes,
  onSelectedTypesChange,
  onConfirm,
  options = [
    { label: "Lamel", value: "Lamel" },
    { label: "Alt Parça", value: "Alt Parça" },
    { label: "Dikme", value: "Dikme" },
    { label: "Kutu", value: "Kutu" },
    { label: "Tambur Borusu", value: "Boru" },
  ],
}: PozImalatListesiDialogProps) {
  const handleCheckboxChange = (value: string) => {
    if (selectedTypes.includes(value)) {
      onSelectedTypesChange(selectedTypes.filter((v) => v !== value));
    } else {
      onSelectedTypesChange([...selectedTypes, value]);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İmalat Listesi Filtresi</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`relative flex-1 flex items-center justify-center px-3 py-2 rounded border font-medium transition-colors
                ${
                  selectedTypes.includes(option.value)
                    ? "border-green-500 ring-[0.5px] ring-green-500 ring-offset-2 ring-offset-background dark:border-green-500 dark:ring-green-500 dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-md dark:ring-offset-zinc-900"
                    : "bg-muted text-muted-foreground border-border hover:border-primary"
                }
                dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:border-primary`}
              onClick={() => handleCheckboxChange(option.value)}
              style={{
                boxShadow: selectedTypes.includes(option.value)
                  ? "0 0 0 1px #22c55e"
                  : undefined,
                outline: "none",
                backgroundColor: undefined,
              }}
            >
              {option.label}
              {selectedTypes.includes(option.value) && (
                <span
                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 flex items-center justify-center shadow-lg"
                  style={{ zIndex: 2 }}
                >
                  <Check size={16} className="text-white" />
                </span>
              )}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            İptal
          </Button>
          <Button onClick={onConfirm}>Onayla</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
