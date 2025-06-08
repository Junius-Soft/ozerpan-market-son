import { PanjurSelections } from "@/types/panjur";

interface DependentField {
  id: string;
  dependsOn?: {
    field: string;
    value: string | string[];
  };
}

export function checkDependencyChain<T extends DependentField>(
  currentField: T,
  values: PanjurSelections,
  fields: T[],
  visited = new Set<string>()
): boolean {
  if (!currentField.dependsOn) return true;
  if (visited.has(currentField.id)) return true;

  visited.add(currentField.id);
  const { field: parentField, value: requiredValue } = currentField.dependsOn;
  const currentValue =
    values[parentField as keyof PanjurSelections]?.toString();

  // Eğer değer yoksa false dön
  if (!currentValue) return false;

  // requiredValue bir array ise (OR durumu)
  if (Array.isArray(requiredValue)) {
    if (!requiredValue.map(String).includes(currentValue)) {
      return false;
    }
  } else {
    // Tek değer kontrolü
    if (currentValue !== requiredValue?.toString()) {
      return false;
    }
  }

  // Parent field'ın dependency'lerini kontrol et
  const parentFieldDef = fields.find((f) => f.id === parentField);
  return parentFieldDef
    ? checkDependencyChain(parentFieldDef, values, fields, visited)
    : true;
}
