"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ColorTabProps {
  color: string;
  onChange: (value: string) => void;
  colors: string[];
}

export function ColorTab({ color, onChange, colors }: ColorTabProps) {
  return (
    <div className="space-y-4">
      <Label>Renk</Label>
      <Select value={color} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Renk seçin" />
        </SelectTrigger>
        <SelectContent>
          {colors.map((colorOption) => (
            <SelectItem key={colorOption} value={colorOption}>
              {colorOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
