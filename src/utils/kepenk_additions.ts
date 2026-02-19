
// ... existing content ...

// Alt parça lastiği fiyatı bulma
export const findSubPartAccessoryPrice = (
    prices: PriceItem[],
    lamelType: string,
    width: number
): [number, SelectedProduct | null] => {
    const accessoryPrices = prices.filter(
        (p) => p.type === "panjur_alt_parça_aksesuarları"
    );

    const is100mm = lamelType.includes("100");
    const searchTerm = is100mm ? "100" : "77";

    const matchingAccessory = accessoryPrices.find(
        (p) => p.description && p.description.includes(searchTerm)
    );

    if (!matchingAccessory) return [0, null];

    const selectedProduct = createSelectedProduct(matchingAccessory, 1, width);
    return [selectedProduct.totalPrice, selectedProduct];
};

// Tambur aksesuarı (boru başı) fiyatı bulma
export const findTamburAccessoryPrice = (
    prices: PriceItem[],
    tamburType: string
): [number, SelectedProduct | null] => {
    const accessoryPrices = prices.filter(
        (p) => p.type === "panjur_tambur_boru_aksesuarları"
    );

    const tamburSize = tamburType.replace("mm", ""); // "70" or "102"

    const matchingAccessory = accessoryPrices.find(
        (p) => p.description && p.description.includes(tamburSize) && p.description.includes("Boru Başı")
    );

    if (!matchingAccessory) return [0, null];

    // Adet: 1
    const selectedProduct = createSelectedProduct(matchingAccessory, 1);
    return [selectedProduct.totalPrice, selectedProduct];
};

// Montaj aksesuarı (vida) fiyatı bulma
export const findMountingAccessoryPrice = (
    prices: PriceItem[],
    quantity: number = 16
): [number, SelectedProduct | null] => {
    const accessoryPrices = prices.filter(
        (p) => p.type === "kepenk_montaj_aksesuarları"
    );

    // Vidayı bul (3,9x16 mm YSB) - Stok kodu veya açıklama ile
    const matchingAccessory = accessoryPrices.find(
        (p) => p.stock_code === "121123901669"
    );

    if (!matchingAccessory) return [0, null];

    const selectedProduct = createSelectedProduct(matchingAccessory, quantity);
    return [selectedProduct.totalPrice, selectedProduct];
};
