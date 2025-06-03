import { useEffect, useRef } from "react";
import { ProductTabField } from "@/documents/products";

type FormValues = Record<string, string | number | boolean>;
type OnChangeHandler = (name: string, value: string | number | boolean) => void;

// Rule to sync colors when lamel_color changes
function handleColorSync(
  values: FormValues,
  fields: ProductTabField[],
  onChange: OnChangeHandler
): void {
  const currentLamelColor = values.lamel_color;
  if (!currentLamelColor) return;

  // Find all color fields except lamel_color
  const colorFields = fields.filter(
    (field) =>
      field.id !== "lamel_color" &&
      field.id.toLowerCase().includes("_color") &&
      values[field.id] !== currentLamelColor
  );

  // Create a new object with all updates at once
  const updates: FormValues = {};

  colorFields.forEach((field) => {
    const newValue = field.options?.find(
      (fieldItem) => fieldItem.id === currentLamelColor
    )
      ? currentLamelColor
      : "ral_boyali";

    if (values[field.id] !== newValue) {
      updates[field.id] = newValue;
    }
  });

  // Apply all updates at once if there are any changes
  if (Object.keys(updates).length > 0) {
    Object.entries(updates).forEach(([fieldId, newValue]) => {
      onChange(fieldId, newValue);
    });
  }
}

// Main hook that manages all form rules
export function usePanjurFormRules(
  values: FormValues,
  fields: ProductTabField[],
  onChange: OnChangeHandler
) {
  const isInitialRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
      handleColorSync(values, fields, onChange);
      // Add more rule handlers here as needed
      // handleOtherRule(values, fields, onChange);
      // handleAnotherRule(values, fields, onChange);
    }, 0);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [values.lamel_color, fields, onChange, values]);

  return {
    // You can add more utility functions here if needed
  };
}
