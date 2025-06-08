import { useEffect, useMemo, useRef } from "react";

import {
  filterLamelThickness,
  filterMotorOptions,
} from "@/utils/form-rules/panjur-form-rules";
import { useSearchParams } from "next/navigation";
import { FormikProps } from "formik";
import { PanjurSelections } from "@/types/panjur";
import { Product } from "@/documents/products";

export type FormValues = Record<string, string | number | boolean>;

// Main hook that manages all form rules
export function useFormRules(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  selectedProduct: Product | null
) {
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);
  const productId = searchParams.get("productId");
  const values = formik.values;

  // Debounce form rule updates
  const debouncedUpdateRules = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (callback: () => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, 300);
    };
  }, []);

  useEffect(() => {
    // Skip the initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Delay rules execution to avoid rapid updates
    debouncedUpdateRules(() => {
      // Execute all rules in sequence
      if (productId === "panjur") {
        filterLamelThickness(formik, values);

        // Filter motor options
        filterMotorOptions(values, formik, selectedProduct);
      }
    });
  }, [values, productId, debouncedUpdateRules, formik, selectedProduct]);

  return {};
}
