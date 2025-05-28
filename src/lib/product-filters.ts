import { Tab, TabContent, Field, Option } from "@/types/product";

export interface ProductTab extends Tab {
  content?: TabContent & {
    fields?: Array<
      Field & {
        options?: Option[];
      }
    >;
  };
}

interface FilterOptions {
  typeId: number;
}

const shutterFilters = {
  distan: (tab: ProductTab, { typeId }: FilterOptions) => {
    if (tab.id !== "frame") return tab;

    const filteredContent = {
      ...tab.content,
      fields: tab.content?.fields?.map((field) => {
        if (field.id === "dikmeType") {
          return {
            ...field,
            options: field.options?.filter((opt) => {
              if (typeId <= 1) {
                // Only basic types for typeId <= 1
                return ["mini_dikme", "midi_dikme"].includes(opt.id);
              } else {
                // Include middle types for typeId > 1
                return [
                  "mini_dikme",
                  "mini_orta_dikme",
                  "midi_dikme",
                  "midi_orta_dikme",
                ].includes(opt.id);
              }
            }),
          };
        }
        return field;
      }),
    };
    return { ...tab, content: filteredContent };
  },

  monoblok: (tab: ProductTab, { typeId }: FilterOptions) => {
    if (tab.id !== "frame") return tab;

    const filteredContent = {
      ...tab.content,
      fields: tab.content?.fields?.map((field) => {
        if (field.id === "dikmeType") {
          return {
            ...field,
            options: field.options?.filter((opt) => {
              if (typeId <= 1) {
                // Only basic PVC types for typeId <= 1
                return ["mini_pvc_dikme", "midi_pvc_dikme"].includes(opt.id);
              } else {
                // Include middle PVC types for typeId > 1
                return [
                  "mini_pvc_dikme",
                  "mini_pvc_orta_dikme",
                  "midi_pvc_dikme",
                  "midi_pvc_orta_dikme",
                ].includes(opt.id);
              }
            }),
          };
        }
        return field;
      }),
    };
    return { ...tab, content: filteredContent };
  },
};

export function applyProductFilters(
  productId: string,
  tabs: ProductTab[],
  optionId: string | null,
  typeId: string | null
): ProductTab[] {
  if (productId !== "panjur" || !optionId) return tabs;

  const typeIdNum = typeId ? parseInt(typeId) : 0;
  const filter = shutterFilters[optionId as keyof typeof shutterFilters];

  if (!filter) return tabs;

  return tabs.map((tab) => filter(tab, { typeId: typeIdNum }));
}
