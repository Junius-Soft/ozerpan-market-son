// Renk kodunu almak için yardımcı fonksiyon
import type { Product } from "@/documents/products";

export function getColorHexFromProductTabs(
  tabs: Product["tabs"],
  values: Record<string, unknown>,
  fieldId: string
): string | undefined {
  const colorTab = tabs?.find((tab) => tab.id === "color");
  const colorField = colorTab?.content?.fields?.find((f) => f.id === fieldId);
  if (!colorField || !colorField.options) return undefined;
  const selectedValue = values[fieldId];
  const selected = colorField.options.find(
    (opt) => opt.id === selectedValue || opt.name === selectedValue
  );
  return selected?.color;
}
