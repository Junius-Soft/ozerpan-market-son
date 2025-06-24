import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";

interface DepoCikisFisiButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
}

export function DepoCikisFisiButton({
  onConfirm,
  disabled = false,
}: DepoCikisFisiButtonProps) {
  return (
    <Button
      variant="ghost"
      type="button"
      className="justify-start"
      onClick={onConfirm}
      disabled={disabled}
    >
      <Truck className="h-4 w-4" />
      <span>Depo Çıkış Fişi</span>
    </Button>
  );
}
