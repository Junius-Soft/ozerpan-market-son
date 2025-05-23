"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface FrameTabProps {
  frameType: string;
  onChange: (value: string) => void;
}

export function FrameTab({ frameType, onChange }: FrameTabProps) {
  return (
    <div className="space-y-4">
      <Label>Kasa Tipi</Label>
      <RadioGroup
        value={frameType}
        onValueChange={onChange}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="siva-alti" id="siva-alti" />
          <Label htmlFor="siva-alti">Sıva Altı</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="siva-ustu" id="siva-ustu" />
          <Label htmlFor="siva-ustu">Sıva Üstü</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
