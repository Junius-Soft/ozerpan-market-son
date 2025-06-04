"use client";

import { useCallback } from "react";
import { useToast } from "@/contexts/toast-context";

export function useMotorOptionsToast() {
  const { showToast } = useToast();

  const handleNoMotorOptions = useCallback(() => {
    showToast(
      "Uyarı",
      "Seçilen ölçüler için uygun motor bulunamadı. Hareket tipi manuel olarak ayarlandı.",
      { variant: "warning" }
    );
  }, [showToast]);

  return handleNoMotorOptions;
}
