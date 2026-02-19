import { LamelProperties } from "@/types/kepenk";
import { lamelProperties } from "@/constants/kepenk";
import { PriceItem, SelectedProduct } from "@/types/kepenk";

// Bölme genişliklerini hesaplayan yardımcı fonksiyon
export function findSectionWidths(
    middleBarPositions: number[],
    width: number
): number[] {
    let positions = [0, ...middleBarPositions, width];
    if (middleBarPositions.length === 0) {
        positions = [0, width];
    }
    return positions.slice(0, -1).map((pos, i) => positions[i + 1] - pos);
}

export const getLamelProperties = (lamelType: string): LamelProperties => {
    return lamelProperties[lamelType];
};

export const getBoxHeight = (boxType: string): number => {
    return parseInt(boxType.replace("mm", ""));
};

// Kepenk için dikme genişliği (Excel'den)
export const getDikmeGenisligi = (dikmeType: string): number => {
    return dikmeType === "77_lik" ? 100 : 140; // 77'lik: 100mm, 100'lük: 140mm
};

// Kepenk için lamel düşme değeri (Excel'den)
export const getLamelDusmeValue = (dikmeType: string): number => {
    return dikmeType === "77_lik" ? 67 : 70; // 77'lik: 67mm, 100'lük: 70mm
};


export const normalizeColor = (color: string): string => {
    return color
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

export const createSelectedProduct = (
    priceItem: PriceItem,
    quantity: number,
    size?: number
): SelectedProduct => {
    const sizeMetre = size ? size / 1000 : undefined;
    const price = parseFloat(priceItem.price || "0");
    const calculatedPrice = isNaN(price) ? 0 : price;

    const totalPrice = sizeMetre
        ? sizeMetre * calculatedPrice * quantity
        : calculatedPrice * quantity;

    return {
        ...priceItem,
        quantity,
        totalPrice: Number(totalPrice.toFixed(2)),
        size,
    };
};


// Lamel sayısı hesaplama
// Formül: ((Yükseklik - (Kutu Payı / 2)) / Lamel Kapama Yüzeyi) + 1
export const calculateLamelCount = (
    systemHeight: number,
    lamelType: string,
    boxHeight: number
): number => {
    // Lamel tiplerine göre kapama yüzeyi
    const kapamaYuzeyi: Record<string, number> = {
        st_77: 77,
        sl_77: 77,
        se_77: 77,
        se_78: 78,
        st_100: 96,
        sl_100: 96,
    };

    const kapamaYuzeyiMm = kapamaYuzeyi[lamelType] || 77;
    // Yeni formül: ((Yükseklik - (Kutu Payı / 2)) / Kapama Yüzeyi) + 1
    const adjustedHeight = systemHeight - (boxHeight / 2);
    return Math.floor(adjustedHeight / kapamaYuzeyiMm) + 1;
};

// Lamel genişliği hesaplama
// Formül: Genişlik - (Dikme Payı) × 2
export const calculateLamelGenisligi = (
    systemWidth: number,
    dikmeType: string
): number => {
    const lamelDusme = getLamelDusmeValue(dikmeType);
    // 2 dikme için dikme payı çıkarılır
    return systemWidth - 2 * lamelDusme;
};


// Lamel fiyatı bulma
export const findLamelPrice = (
    prices: PriceItem[],
    lamelType: string,
    color: string,
    quantity: number,
    lamelGenisligi: number
): [number, SelectedProduct | null] => {
    const lamelPrices = prices.filter(
        (p) => p.type === "kepenk_lamel_profilleri" && p.lamel_type === lamelType
    );

    // Renk eşleştirme: Form'dan gelen renk değerlerini product-prices.json'daki değerlere map et
    const colorMapping: Record<string, string[]> = {
        "aluminyum": ["alüminyum"], // Form: "aluminyum" -> JSON: "alüminyum"
        "ral_boyali": ["rall_boya", "ral_boyali", "ral_boyalı"], // Form: "ral_boyali" -> JSON: "rall_boya"
        "ral_7016": ["antrasit_gri"], // Form: "ral_7016" -> JSON: "antrasit_gri"
        "ral_9005": ["siyah"], // Form: "ral_9005" -> JSON: "siyah" (eğer siyah yoksa bulunamaz)
        "ral_8017": ["krem", "metalik_gri", "altın_meşe"], // Form: "ral_8017" -> JSON: "krem", "metalik_gri" veya "altın_meşe" (kahverengi tonları)
        "beyaz": ["beyaz"], // Form: "beyaz" -> JSON: "beyaz"
    };

    const colorLower = color.toLowerCase();
    const mappedColors = colorMapping[colorLower] || [colorLower];

    // Önce mapping'deki renkleri dene
    let matchingLamel = null;
    for (const mappedColor of mappedColors) {
        matchingLamel = lamelPrices.find(
            (p) => p.color.toLowerCase() === mappedColor
        );
        if (matchingLamel) break;
    }

    // Eğer hala bulunamazsa, orijinal renk değerini dene
    if (!matchingLamel) {
        matchingLamel = lamelPrices.find(
            (p) => p.color.toLowerCase() === colorLower
        );
    }

    // Eğer hala bulunamazsa, renk bulunamadı - null döndür (beyaz'a fallback YAPMA)
    // Kullanıcı hangi rengi seçtiyse o rengi bulmalı, yoksa hata vermeli

    if (!matchingLamel) return [0, null];

    const selectedProduct = createSelectedProduct(
        matchingLamel,
        quantity,
        lamelGenisligi
    );
    return [selectedProduct.totalPrice, selectedProduct];
};

// Alt parça fiyatı bulma
export const findSubPartPrice = (
    prices: PriceItem[],
    lamelType: string,
    color: string,
    sectionWidths: number[]
): Array<{
    price: number;
    selectedProduct: SelectedProduct | null;
    width: number;
}> => {
    const subPartPrices = prices.filter(
        (p) => p.type === "kepenk_alt_parca_profilleri"
    );

    // Lamel tipine göre alt parça seç
    const altParcaType = lamelType.includes("100") ? "100_lu" : "77_li";


    // Renk eşleştirme: Form'dan gelen renk değerlerini product-prices.json'daki değerlere map et
    const colorMapping: Record<string, string[]> = {
        "aluminyum": ["alüminyum"],
        "ral_boyali": ["rall_boya", "ral_boyali", "ral_boyalı"],
        "ral_7016": ["antrasit_gri"],
        "ral_9005": ["siyah"],
        "ral_8017": ["krem", "metalik_gri", "altın_meşe"],
        "beyaz": ["beyaz"],
        "antrasit_gri": ["antrasit_gri"],
        "metalik_gri": ["metalik_gri"],
        "krem": ["krem"],
        "altın_meşe": ["altın_meşe"],
    };

    const colorLower = color.toLowerCase();
    const mappedColors = colorMapping[colorLower] || [colorLower];

    // Renk filtresi ekle (mapping ile)
    let matchingSubPart = null;

    // Önce mapping'deki renkleri dene
    for (const mappedColor of mappedColors) {
        matchingSubPart = subPartPrices.find(
            (p) =>
                p.lamel_type === altParcaType &&
                p.color?.toLowerCase() === mappedColor
        );
        if (matchingSubPart) break;
    }

    // Eğer bulunamazsa, orijinal rengi dene
    if (!matchingSubPart) {
        matchingSubPart = subPartPrices.find(
            (p) => p.lamel_type === altParcaType &&
                p.color?.toLowerCase() === color.toLowerCase()
        );
    }

    // Eğer renk eşleşmezse, lamel tipine göre ilk uygun olanı kullan
    if (!matchingSubPart) {
        matchingSubPart = subPartPrices.find(
            (p) => p.lamel_type === altParcaType
        );
    }

    if (!matchingSubPart) {
        return sectionWidths.map((width) => ({ price: 0, selectedProduct: null, width }));
    }

    return sectionWidths.map((width) => {
        const selectedProduct = createSelectedProduct(matchingSubPart!, 1, width);
        return {
            price: selectedProduct.totalPrice,
            selectedProduct,
            width,
        };
    });
};

// Dikme fiyatı bulma
export const findDikmePrice = (
    prices: PriceItem[],
    dikmeType: string,
    color: string,
    height: number
): [number, SelectedProduct | null] => {
    const dikmePrices = prices.filter(
        (p) => p.type === "kepenk_dikme_profilleri" && p.dikme_type === dikmeType
    );

    // Renk eşleştirme: Form'dan gelen renk değerlerini product-prices.json'daki değerlere map et
    const colorMapping: Record<string, string[]> = {
        "aluminyum": ["alüminyum"], // Form: "aluminyum" -> JSON: "alüminyum"
        "ral_boyali": ["rall_boya", "ral_boyali", "ral_boyalı"], // Form: "ral_boyali" -> JSON: "rall_boya"
        "ral_7016": ["antrasit_gri"], // Form: "ral_7016" -> JSON: "antrasit_gri"
        "ral_9005": ["siyah"], // Form: "ral_9005" -> JSON: "siyah"
        "ral_8017": ["krem", "metalik_gri", "altın_meşe"], // Form: "ral_8017" -> JSON: "krem", "metalik_gri" veya "altın_meşe"
        "beyaz": ["beyaz"], // Form: "beyaz" -> JSON: "beyaz"
        "antrasit_gri": ["antrasit_gri"], // Form: "antrasit_gri" -> JSON: "antrasit_gri"
        "metalik_gri": ["metalik_gri"], // Form: "metalik_gri" -> JSON: "metalik_gri"
        "krem": ["krem"], // Form: "krem" -> JSON: "krem"
        "altın_meşe": ["altın_meşe"], // Form: "altın_meşe" -> JSON: "altın_meşe"
    };

    const colorLower = color.toLowerCase();
    const mappedColors = colorMapping[colorLower] || [colorLower];

    // Önce mapping'deki renkleri dene
    let matchingDikme = null;
    for (const mappedColor of mappedColors) {
        matchingDikme = dikmePrices.find(
            (p) => p.color.toLowerCase() === mappedColor
        );
        if (matchingDikme) break;
    }

    // Eğer hala bulunamazsa, orijinal renk değerini dene
    if (!matchingDikme) {
        matchingDikme = dikmePrices.find(
            (p) => p.color.toLowerCase() === colorLower
        );
    }

    // Eğer hala bulunamazsa, ilk uygun dikmeyi kullan (fallback)
    if (!matchingDikme && dikmePrices.length > 0) {
        matchingDikme = dikmePrices[0];
    }

    if (!matchingDikme) return [0, null];

    const selectedProduct = createSelectedProduct(matchingDikme, 2, height); // 2 adet dikme
    return [selectedProduct.totalPrice, selectedProduct];
};

// Kutu fiyatı bulma - Hem ön hem arka kutu bileşenlerini bulur
// Kutu rengi lamel rengi ile aynı fiyattan çekilir
export const findBoxPrice = (
    prices: PriceItem[],
    boxType: string,
    color: string,
    systemWidth: number
): {
    frontPrice: number;
    backPrice: number;
    selectedFrontBox?: SelectedProduct;
    selectedBackBox?: SelectedProduct;
} => {
    const boxPrices = prices.filter(
        (p) => p.type === "kepenk_kutu_profilleri" && p.kutu_type?.includes(boxType)
    );

    // Renk eşleştirme: Lamel rengini kutu rengine map et (lamel rengi ile aynı fiyat)
    const colorMapping: Record<string, string[]> = {
        "aluminyum": ["alüminyum"], // Form: "aluminyum" -> JSON: "alüminyum"
        "ral_boyali": ["ral_boyalı", "rall_boya", "ral_boyali"], // Form: "ral_boyali" -> JSON: "ral_boyalı"
        "ral_7016": ["antrasit_gri"], // Form: "ral_7016" -> JSON: "antrasit_gri"
        "ral_9005": ["siyah"], // Form: "ral_9005" -> JSON: "siyah"
        "ral_8017": ["krem", "metalik_gri", "altın_meşe"], // Form: "ral_8017" -> JSON: "krem", "metalik_gri" veya "altın_meşe"
        "beyaz": ["beyaz"], // Form: "beyaz" -> JSON: "beyaz"
    };

    const colorLower = color.toLowerCase();
    const mappedColors = colorMapping[colorLower] || [colorLower];

    // Ön ve arka kutu bileşenlerini bul
    const boxSize = boxType.replace("mm", "");

    // Önce mapping'deki renkleri dene
    let frontBox = null;
    let backBox = null;

    for (const mappedColor of mappedColors) {
        frontBox = boxPrices.find(
            (p) =>
                (p.kutu_type?.includes(`${boxSize}_on45`) || p.description?.includes("ÖN 45")) &&
                p.color.toLowerCase() === mappedColor
        );
        if (frontBox) break;
    }

    // Eğer hala bulunamazsa, renk kontrolü olmadan dene
    if (!frontBox) {
        frontBox = boxPrices.find(
            (p) => p.kutu_type?.includes(`${boxSize}_on45`) || p.description?.includes("ÖN 45")
        );
    }

    for (const mappedColor of mappedColors) {
        backBox = boxPrices.find(
            (p) =>
                (p.kutu_type?.includes(`${boxSize}_arka90`) || p.description?.includes("ARKA 90")) &&
                p.color.toLowerCase() === mappedColor
        );
        if (backBox) break;
    }

    // Eğer hala bulunamazsa, renk kontrolü olmadan dene
    if (!backBox) {
        backBox = boxPrices.find(
            (p) => p.kutu_type?.includes(`${boxSize}_arka90`) || p.description?.includes("ARKA 90")
        );
    }

    return {
        frontPrice: frontBox ? parseFloat(frontBox.price) : 0,
        backPrice: backBox ? parseFloat(backBox.price) : 0,
        selectedFrontBox: frontBox
            ? createSelectedProduct(frontBox, 1, systemWidth)
            : undefined,
        selectedBackBox: backBox
            ? createSelectedProduct(backBox, 1, systemWidth)
            : undefined,
    };
};

// Tambur fiyatı bulma
export const findTamburPrice = (
    prices: PriceItem[],
    tamburType: string,
    lamelType: string,
    systemWidth: number
): [number, SelectedProduct | null] => {
    const tamburPrices = prices.filter(
        (p) =>
            p.type === "kepenk_tambur_boru_profilleri" &&
            p.tambur_type === tamburType
    );

    let matchingTambur = tamburPrices.find((p) =>
        p.lamel_type?.includes(lamelType.replace("_", "-").toUpperCase())
    );

    if (!matchingTambur && tamburPrices.length > 0) {
        matchingTambur = tamburPrices[0];
    }

    if (!matchingTambur) return [0, null];

    const selectedProduct = createSelectedProduct(matchingTambur, 1, systemWidth);
    return [selectedProduct.totalPrice, selectedProduct];
};

// Motor fiyatı bulma
export const findMotorPrice = (
    prices: PriceItem[],
    motorModel: string,
    motorTip: string
): [number, SelectedProduct | null] => {
    const motorPrices = prices.filter(
        (p) =>
            p.type === "kepenk_motorlar" &&
            p.motor_model === motorModel &&
            p.motor_type === motorTip
    );

    // Motor modeline göre filtrele
    // NOT: 70'lik motorlarda sel_70 modeli altında 80 ve 100 Nm olabilir.
    // Bu durumda doğru ayrım kepenk-motor-selection.ts'de yapılmalı ve buraya benzersiz ID gelmeli.
    // Ancak `sel_70` gibi genel bir ID gelirse, fiyata veya tork değerine göre ayrım yapmak gerekebilir.
    // Şimdilik ilk eşleşeni döndürüyoruz, ancak `kepenk-motor-selection.ts` dosyasında `sel_70` yerine `sel_70_100` gibi
    // benzersiz ID'ler kullanıldığından emin olunmalı.
    const matchingMotor = motorPrices[0];

    if (!matchingMotor) return [0, null];

    const selectedProduct = createSelectedProduct(matchingMotor, 1);
    return [selectedProduct.totalPrice, selectedProduct];
};

// Alt parça lastiği fiyatı bulma
export const findSubPartAccessoryPrice = (
    prices: PriceItem[],
    lamelType: string,
    width: number
): [number, SelectedProduct | null] => {
    // accessories.json'da tip "panjur_alt_parça_aksesuarları" olarak geçiyor
    // Ancak kodda Türkçe karakter sorunu olmaması için dikkatli olunmalı.
    // JSON dosyasında "panjur_alt_parça_aksesuarları" olarak kayıtlı.
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
