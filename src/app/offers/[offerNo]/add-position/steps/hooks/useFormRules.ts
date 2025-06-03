import { useEffect, useRef } from "react";
import { ProductTabField } from "@/documents/products";
import { handleColorSync } from "@/utils/form-rules/panjur-form-rules";
import { useSearchParams } from "next/navigation";

type FormValues = Record<string, string | number | boolean>;
type OnChangeHandler = (name: string, value: string | number | boolean) => void;

// Main hook that manages all form rules
export function usePanjurFormRules(
  values: FormValues,
  fields: ProductTabField[],
  onChange: OnChangeHandler
) {
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const productId = searchParams.get("productId");
  useEffect(() => {
    // Skip the initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Delay rules execution to avoid rapid updates
    timeoutRef.current = setTimeout(() => {
      // Execute all rules in sequence
      if (productId === "panjur") {
        handleColorSync(values, fields, onChange);
        // Add more rule handlers here as needed
        // handleOtherRule(values, fields, onChange);
        // handleAnotherRule(values, fields, onChange);
      }
    }, 0);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [values.lamel_color, fields, onChange, values, productId]);

  return {
    // You can add more utility functions here if needed
  };
}
