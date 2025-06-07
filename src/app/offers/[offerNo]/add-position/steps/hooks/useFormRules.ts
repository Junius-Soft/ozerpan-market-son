import { RefObject, useEffect, useMemo, useRef } from "react";
import { ProductTab, ProductTabField } from "@/documents/products";
import {
  filterMotorOptions,
} from "@/utils/form-rules/panjur-form-rules";
import { useSearchParams } from "next/navigation";
import { PanjurSelections } from "@/types/panjur";
import { FormikProps } from "formik";
import { useMotorOptionsToast } from "./useMotorOptionsToast";

export type FormValues = Record<string, string | number | boolean>;

// Main hook that manages all form rules
export function useFormRules(
  formikRef: RefObject<FormikProps<FormValues> | null>,
  fields: ProductTabField[],
  formDataResponse: ProductTab[],
  selections: PanjurSelections
) {
  const searchParams = useSearchParams();
  const isInitialRender = useRef(true);
  const productId = searchParams.get("productId");
  const values = formikRef?.current?.values;
  const handleNoMotorOptions = useMotorOptionsToast();

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
        // console.log({ values });


        // Filter motor options
        filterMotorOptions(
          selections,
          formikRef,
          formDataResponse,
          handleNoMotorOptions
        );
      }
    });
  }, [
    fields,
    values,
    productId,
    formikRef,
    selections,
    handleNoMotorOptions,
    formDataResponse,
    debouncedUpdateRules,
  ]);

  return {};
}
