import { useEffect, useRef } from "react";
import { FormikProps } from "formik";
import { ProductTabField } from "@/documents/products";
import type { PanjurSelections } from "@/types/panjur";
import type { FormValues } from "../types";
import { useFormRules } from "./useFormRules";

export function useDetailFormRules(
  formRef: React.MutableRefObject<HTMLFormElement | null> | undefined,
  availableTabs: { content?: { fields?: ProductTabField[] } }[],
  selections: PanjurSelections
) {
  const formikRef = useRef<FormikProps<FormValues> | null>(null);

  // Update formikRef when formRef changes
  useEffect(() => {
    if (formRef?.current) {
      // Access the Formik instance through the React internal fields
      // We need to use type assertion here since we're accessing internal React fields
      type InternalFormElement = {
        children: {
          _owner: {
            stateNode: FormikProps<FormValues>;
          };
        };
      };

      const internalForm = formRef.current as unknown as InternalFormElement;
      if (internalForm.children?._owner?.stateNode) {
        formikRef.current = internalForm.children._owner.stateNode;
      }
    }
  }, [formRef]);

  const allFields = availableTabs.flatMap((tab) => tab.content?.fields || []);
  const currentFormik = formikRef.current;

  // Use form rules hook with current values, fields, and selections
  useFormRules(
    { ...currentFormik?.values, ...selections } || {},
    allFields,
    (fieldId: string, value: string | number | boolean) => {
      currentFormik?.setFieldValue(fieldId, value);
    }
  );

  return { formikRef };
}
