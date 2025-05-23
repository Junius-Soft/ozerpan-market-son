"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DivisionsTabProps {
  horizontal: number;
  vertical: number;
  onChange: (field: string, value: number) => void;
}

export function DivisionsTab({
  horizontal,
  vertical,
  onChange,
}: DivisionsTabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="horizontal">Yatay Bölme</Label>
        <Input
          id="horizontal"
          type="number"
          min="1"
          value={horizontal}
          onChange={(e) => onChange("horizontal", parseInt(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="vertical">Dikey Bölme</Label>
        <Input
          id="vertical"
          type="number"
          min="1"
          value={vertical}
          onChange={(e) => onChange("vertical", parseInt(e.target.value))}
        />
      </div>
    </div>
  );
}
