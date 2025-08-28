import { ProductTabField, ProductTab } from "@/documents/products";
import { PanjurSelections } from "@/types/panjur";
import { checkDependencyChain } from "@/utils/dependencies";
import { FormikProps } from "formik";
import { useRef, useEffect } from "react";
import productTabs from "@/../data/product-tabs.json";

/**
 * Hem dependsOn hem de filterBy kurallarını zincirli şekilde uygulayan hook.
 * Alanın options'ı filterBy ile dinamik olarak filtrelenir, seçili değer uygun değilse default veya ilk uygun değere set edilir.
 */
export function useAutoDependencyAndFilterBy(
  formik: FormikProps<
    PanjurSelections & Record<string, string | number | boolean>
  >,
  productType: keyof typeof productTabs,
  optionId: string | null
) {
  const allTabs: ProductTab[] = productTabs[productType] as ProductTab[];
  const allFields: ProductTabField[] = allTabs.flatMap(
    (tab) => tab.content?.fields || []
  );
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

    // OptionId'ye göre defaultValues desteği
    for (const tab of allTabs) {
      if (tab.content?.fields) {
        for (const field of tab.content.fields) {
          if (
            field.defaultValues &&
            optionId &&
            field.defaultValues[optionId]
          ) {
            if (newValues[field.id] !== field.defaultValues[optionId]) {
              newValues[field.id] = field.defaultValues[optionId];
              updated = true;
            }
          }
        }
      }
      // Tab seviyesinde defaultValues desteği
      if (tab.defaultValues && optionId && tab.defaultValues[optionId]) {
        Object.entries(tab.defaultValues).forEach(([key, value]) => {
          if (key === optionId && newValues[tab.id] !== value) {
            newValues[tab.id] = value;
            updated = true;
          }
        });
      }
    }

    // Helper: reset all children recursively if dependency is not met
    function resetDependents(parentKey: string) {
      allFields.forEach((field) => {
        if (field.dependsOn && field.dependsOn.field === parentKey) {
          const isValid = checkDependencyChain(field, newValues, allFields);
          if (!isValid) {
            newValues[field.id] =
              field.default !== undefined ? field.default : "";
            updated = true;
            resetDependents(field.id);
          }
        }
      });
    }

    // Helper: filterBy uygula ve seçili değer uygun değilse düzelt
    function applyFilterBy(field: ProductTabField) {
      if (!field.options || !field.filterBy) return;
      let filteredOptions = field.options;
      // filterBy bir dizi veya obje olabilir
      const filterBys = Array.isArray(field.filterBy)
        ? field.filterBy
        : [field.filterBy];
      filterBys.forEach((filter) => {
        if (
          !filter ||
          typeof filter !== "object" ||
          !filter.field ||
          !filter.valueMap
        )
          return;

        let filterValue: string | number | undefined;

        // OptionId filter'ı için URL'den değeri al
        if (filter.field === "optionId") {
          filterValue = optionId || undefined;
        } else {
          const fieldValue = newValues[filter.field];
          filterValue =
            typeof fieldValue === "string" || typeof fieldValue === "number"
              ? fieldValue
              : undefined;
        }

        if (
          typeof filterValue === "string" ||
          typeof filterValue === "number"
        ) {
          const allowed = filter.valueMap?.[filterValue as string];
          if (Array.isArray(allowed)) {
            filteredOptions = filteredOptions.filter((opt) =>
              allowed.includes(opt.id as string)
            );
          }
        }
      });
      // Eğer mevcut değer options içinde yoksa default veya ilk uygun değere set et
      if (
        filteredOptions.length > 0 &&
        !filteredOptions.some((opt) => opt.id === newValues[field.id])
      ) {
        const fallback =
          (field.default &&
          filteredOptions.some((opt) => opt.id === field.default)
            ? field.default
            : filteredOptions[0].id) ?? "";
        newValues[field.id] = fallback;
        updated = true;
      }
    }

    // Her değişen key için zincirli reset ve default işlemi
    for (const changedKey of changedKeys) {
      resetDependents(changedKey);
    }

    // Son olarak, tüm alanları tekrar kontrol et ve default ataması gerekiyorsa ata
    for (const field of allFields) {
      if (field.dependsOn) {
        const isValid = checkDependencyChain(field, newValues, allFields);
        // dependsOn zinciri uygun değilse default ata
        if (
          !isValid &&
          field.default !== undefined &&
          newValues[field.id] !== field.default
        ) {
          newValues[field.id] = field.default;
          updated = true;
        }
        // dependsOn zinciri uygunsa ve alan boşsa default ata
        if (
          isValid &&
          field.default !== undefined &&
          (newValues[field.id] === undefined || newValues[field.id] === "")
        ) {
          newValues[field.id] = field.default;
          updated = true;
        }
      }
      // filterBy uygula
      applyFilterBy(field);
    }

    if (updated) {
      pendingUpdate.current = true;
      formik.setValues(newValues, false);
    }

    prevValues.current = { ...formik.values };
  }, [formik.values, allFields, formik, optionId, allTabs]);
}
