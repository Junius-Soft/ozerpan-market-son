import { ProductTabField } from "@/documents/products";

type FormValues = Record<string, string | number | boolean>;
type OnChangeHandler = (name: string, value: string | number | boolean) => void;

/**
 * Senkronize renk seçimi için yardımcı fonksiyon.
 * Seçilen lamel rengini diğer renk seçeneklerine uygular.
 */
export function handleColorSync(
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
