import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface TeklifFormuButtonProps {
  onConfirm?: () => void;
  disabled?: boolean;
}

export function TeklifFormuButton({
  onConfirm,
  disabled = false,
}: TeklifFormuButtonProps) {
  return (
    <Button
      variant="ghost"
      type="button"
      className="justify-start"
      onClick={onConfirm}
      disabled={disabled}
    >
      <FileText className="h-4 w-4" />
      <span>Teklif Formu</span>
    </Button>
  );
}
