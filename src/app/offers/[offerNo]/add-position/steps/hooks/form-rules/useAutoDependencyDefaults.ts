import { ProductTabField, ProductTab } from "@/documents/products";
import { PanjurSelections } from "@/types/panjur";
import { checkDependencyChain } from "@/utils/dependencies";
import { FormikProps } from "formik";
import { useRef, useEffect } from "react";
import productTabs from "@/../data/product-tabs.json";

export function useAutoDependencyDefaults(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  productType: keyof typeof productTabs
) {
  const allFields: ProductTabField[] = (
    productTabs[productType] as ProductTab[]
  ).flatMap((tab) => tab.content?.fields || []);
  const prevValues = useRef(formik.values);
  const pendingUpdate = useRef(false);

  useEffect(() => {
    if (pendingUpdate.current) {
      pendingUpdate.current = false;
      prevValues.current = { ...formik.values };
      return;
    }

    const changedKeys = Object.keys(formik.values).filter(
      (key) => formik.values[key] !== prevValues.current[key]
    );
    if (changedKeys.length === 0) return;

    const newValues = { ...formik.values };
    let updated = false;

    // Helper: reset all children recursively if dependency is not met
    function resetDependents(parentKey: string) {
      allFields.forEach((field) => {
        if (field.dependsOn && field.dependsOn.field === parentKey) {
          const isValid = checkDependencyChain(field, newValues, allFields);
          if (!isValid) {
            // Reset to default if var, yoksa ""
            newValues[field.id] =
              field.default !== undefined ? field.default : "";
            updated = true;
            // Zincirli alt alanları da resetle
            resetDependents(field.id);
          }
        }
      });
    }

    // Her değişen key için zincirli reset ve default işlemi
    for (const changedKey of changedKeys) {
      resetDependents(changedKey);
    }

    // Son olarak, tüm alanları tekrar kontrol et ve default ataması gerekiyorsa ata
    for (const field of allFields) {
      if (field.dependsOn) {
        const isValid = checkDependencyChain(field, newValues, allFields);
        if (
          !isValid &&
          field.default !== undefined &&
          newValues[field.id] !== field.default
        ) {
          newValues[field.id] = field.default;
          updated = true;
        }
      }
    }

    if (updated) {
      pendingUpdate.current = true;
      formik.setValues(newValues, false);
    }

    prevValues.current = { ...formik.values };
  }, [formik.values, allFields, formik]);
}
