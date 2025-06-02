// Helper function to parse Turkish and standard number formats
export function parsePrice(input: string | number | null | undefined): number {
  if (input == null) return 0;

  if (typeof input === "number") {
    return isNaN(input) ? 0 : input;
  }

  // Remove currency symbols, spaces and any non-numeric characters except . and ,
  const cleanString = input
    .toString()
    .replace(/[TL₺\s]/g, "")
    .trim();

  if (cleanString === "") return 0;

  // Handle Turkish format (1.234,56) - dots for thousands, comma for decimals
  if (cleanString.includes(",")) {
    // Replace all dots (thousand separators) and convert comma to dot for decimal
    const normalized = cleanString.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Handle standard number format
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatPrice(
  input: number | string | null | undefined,
  eurRate: number
): string {
  const numericValue = parsePrice(input) * eurRate;

  // Format as Turkish number (1.234,56)
  return numericValue.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true, // Use thousand separators
  });
}
