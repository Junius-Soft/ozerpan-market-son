"use client";

import { Button } from "@/components/ui/button";

interface MovementTabProps {
  movement: "manuel" | "motorlu";
  onChange: (value: "manuel" | "motorlu") => void;
}

export function MovementTab({ movement, onChange }: MovementTabProps) {
  return (
    <div className="space-y-4">
      <Button
        variant={movement === "manuel" ? "default" : "outline"}
        className="w-full"
        onClick={() => onChange("manuel")}
      >
        Manuel
      </Button>
      <Button
        variant={movement === "motorlu" ? "default" : "outline"}
        className="w-full"
        onClick={() => onChange("motorlu")}
      >
        Motorlu
      </Button>
    </div>
  );
}
