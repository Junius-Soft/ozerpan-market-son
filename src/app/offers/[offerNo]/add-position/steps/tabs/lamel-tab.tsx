"use client";

import { Button } from "@/components/ui/button";

interface LamelTabProps {
  lamelType: "35mm" | "50mm";
  onChange: (value: "35mm" | "50mm") => void;
}

export function LamelTab({ lamelType, onChange }: LamelTabProps) {
  return (
    <div className="space-y-4">
      <Button
        variant={lamelType === "35mm" ? "default" : "outline"}
        className="w-full"
        onClick={() => onChange("35mm")}
      >
        35mm Lamel
      </Button>
      <Button
        variant={lamelType === "50mm" ? "default" : "outline"}
        className="w-full"
        onClick={() => onChange("50mm")}
      >
        50mm Lamel
      </Button>
    </div>
  );
}
