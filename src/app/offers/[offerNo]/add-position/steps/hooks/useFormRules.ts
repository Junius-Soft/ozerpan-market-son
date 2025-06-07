import { RefObject, useEffect, useRef, useState } from "react";
import { ProductTab, ProductTabField } from "@/documents/products";
import {
  filterMotorOptions,
  handleColorSync,
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
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const productId = searchParams.get("productId");
  const values = formikRef?.current?.values;
  const handleNoMotorOptions = useMotorOptionsToast();
  const [motorOptions, setMotorOptions] = useState<
    ProductTabField["options"] | null
  >(null);

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
        // console.log({ values });
        handleColorSync(fields, formikRef, values);
        const options = filterMotorOptions(
          selections,
          formikRef,
          formDataResponse,
          handleNoMotorOptions
        );
        setMotorOptions(options);
      }
    }, 0);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    fields,
    values,
    productId,
    formikRef,
    selections,
    handleNoMotorOptions,
    formDataResponse,
  ]);

  return {
    motorOptions,
  };
}
