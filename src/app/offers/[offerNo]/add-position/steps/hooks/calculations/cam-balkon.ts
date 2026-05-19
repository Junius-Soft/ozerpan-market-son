import { CalculationResult, SelectedProduct } from "@/types/panjur";
import { calculateCamBalkonMalzemeListesi, calculateCamListesi, KolBilgisi } from "@/utils/cam-balkon-malzeme-listesi";
import { PriceItem } from "@/types/panjur";

// Formik cam balkon değerleri için minimal tip
type CamBalkonFormValues = Record<string, unknown> & {
  width?: number | string;
  height?: number | string;
  color?: string;
  camKalinligi?: string;
  camRengi?: string;
  packagingType?: "yok" | "var";
  toplamHareketliCamArasi?: number;
  toplamSabitHareketliCamArasi?: number;
};

// Kol bilgilerini düz yapıdan (kol1_genislik vb.) diziye dönüştüren fonksiyon
function extractKolBilgileri(
  values: CamBalkonFormValues | CamBalkonSelections
): KolBilgisi[] {
  // Index ile erişim yaptığımız için burada geniş tip kullanıyoruz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = values as any;

  const kolSayisi = Number(v.kolSayisi) || 1;
  const kolBilgileri: KolBilgisi[] = [];

  for (let i = 1; i <= kolSayisi; i++) {
    const cikisYonuRaw = v[`kol${i}_cikisYonu`] || v[`kol${i}_cikis_yonu`];
    const sabitCamYonuRaw = v[`kol${i}_sabitCamYonu`];

    kolBilgileri.push({
      genislik: Number(v[`kol${i}_genislik`]) || 0,
      kanat: Number(v[`kol${i}_kanat`]) || 1,
      cikis_sayisi: Number(v[`kol${i}_cikisSayisi`] || v[`kol${i}_cikis_sayisi`]) || 0,
      cikis_yonu:
        typeof cikisYonuRaw === "string" && cikisYonuRaw.length > 0
          ? cikisYonuRaw
          : "sag",
      sola_kanat: Number(v[`kol${i}_solaKanat`] || v[`kol${i}_sola_kanat`]) || 0,
      sabitCamAdedi: Number(v[`kol${i}_sabitCamAdedi`]) || 0,
      sabitCamGenisligi: Number(v[`kol${i}_sabitCamGenisligi`]) || 0,
      sabitCamYonu:
        typeof sabitCamYonuRaw === "string" && sabitCamYonuRaw.length > 0
          ? sabitCamYonuRaw
          : "sag",
      aci: Number(v[`kol${i}_aci`]) || 0,
    });
  }
  return kolBilgileri;
}

export interface CamBalkonSelections {
  width: number;
  height: number;
  color: string; // profil rengi (eloksal, bronz, antrasit, ral)
  glassColor: string; // cam rengi (seffaf, fume, mavi, yesil, bronz)
  glassThickness: string; // 8mm, 10mm, 24mm
  kolBilgileri: KolBilgisi[];
  toplamHareketliCamArasi?: number;
  toplamSabitHareketliCamArasi?: number;
  packagingType?: "yok" | "var"; // Paketleme seçeneği
}

export const calculateCamBalkon = (
  values: CamBalkonFormValues | CamBalkonSelections,
  prices: PriceItem[],
  optionId?: string
): CalculationResult => {
  const errors: string[] = [];
  const selectedProducts: {
    products: SelectedProduct[];
    accessories: SelectedProduct[];
  } = {
    products: [],
    accessories: [],
  };
  let totalPrice = 0;

  // Kol bilgilerini oluştur
  const kolBilgileri = extractKolBilgileri(values);

  // Renk eşleştirmesi
  let colorKey = (values.color || "eloksal").toLowerCase();
  if (colorKey.includes("eloksal")) colorKey = "eloksal";
  else if (colorKey.includes("bronz")) colorKey = "bronz";
  else if (colorKey.includes("antrasit")) colorKey = "antrasit";
  else if (colorKey.includes("ral")) colorKey = "ral";
  else colorKey = "eloksal"; // Varsayılan

  // Debug log – değerler farklı form yapılarına göre değişebileceği için geniş tip kullanıyoruz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debugValues = values as any;
  console.log("🔄 Cam Balkon Hesaplama başlıyor:", {
    width: debugValues.width,
    height: debugValues.height,
    colorKey,
    pricesCount: prices.length,
    kolBilgileriSayisi: kolBilgileri.length,
    kol1_genislik: debugValues.kol1_genislik,
  });

  // Cam kalınlığı ve cam rengi (formdaki alternatif alanları da destekle)
  const camKalinligi = debugValues.camKalinligi || debugValues.glassThickness || "24mm";
  const camRengi = debugValues.camRengi || debugValues.glassColor || "seffaf";

  // Malzeme listesini hesapla
  const malzemeler = calculateCamBalkonMalzemeListesi(
    kolBilgileri,
    Number(values.height) || 0,
    camKalinligi,
    camRengi,
    colorKey,
    optionId || "1",
    values.toplamHareketliCamArasi,
    values.toplamSabitHareketliCamArasi
  );

  // Cam listesini hesapla (m² bazlı)
  const camListesi = calculateCamListesi(
    kolBilgileri,
    Number(values.height) || 0,
    camKalinligi,
    camRengi
  );

  // Fiyatları hesapla
  malzemeler.forEach((malzeme) => {
    // Stok kodunu bulmaya çalış
    let targetStockCode = malzeme.stokKodu;
    const malzemeColor = colorKey;

    // Renk kodları: 4447 (eloksal), 4440 (bronz), 4441 (antrasit), 7072 (ral)
    const colorSuffixes = ["4447", "4440", "4441", "7072"];
    const currentColorSuffix = colorSuffixes.find(s => targetStockCode.includes(s));

    if (currentColorSuffix) {
      // Hangi renk suffix'i kullanılacak?
      let newSuffix = "4447"; // default eloksal
      if (malzemeColor === "bronz") newSuffix = "4440";
      else if (malzemeColor === "antrasit") newSuffix = "4441";
      else if (malzemeColor === "ral") newSuffix = "7072";

      // Kod içindeki suffix'i değiştir
      targetStockCode = targetStockCode.replace(currentColorSuffix, newSuffix);
    }

    // Fiyat listesinde bu kodu ara
    let priceItem = prices.find((p) => p.stock_code === targetStockCode);

    // Eğer bulunamadıysa alternatif aramalar yap (aksesuarlar için)
    if (!priceItem && targetStockCode.endsWith('_0')) {
      // _0 sonekini çıkarıp tekrar dene (örn: 356860_429_0 -> 356860_429)
      const alternativeCode = targetStockCode.slice(0, -2);
      priceItem = prices.find((p) => p.stock_code === alternativeCode);
      if (priceItem) {
        targetStockCode = alternativeCode; // Bulunan kodu kullan
      }
    }

    // Hala bulunamadıysa _0_0 çift sonek için dene (örn: 356855_0_0 -> 356855_0)
    if (!priceItem && targetStockCode.endsWith('_0_0')) {
      const alternativeCode = targetStockCode.slice(0, -2);
      priceItem = prices.find((p) => p.stock_code === alternativeCode);
      if (priceItem) {
        targetStockCode = alternativeCode;
      }
    }

    if (priceItem) {
      const unitPrice = parseFloat(priceItem.price);
      const itemTotal = unitPrice * malzeme.miktar;
      totalPrice += itemTotal;

      // Güvenli size hesaplama
      let size = 0;
      if (malzeme.olcu) {
        const parsedSize = parseFloat(String(malzeme.olcu));
        if (!isNaN(parsedSize)) {
          size = parsedSize;
        }
      }

      selectedProducts.products.push({
        stock_code: targetStockCode,
        description: priceItem.description,
        uretici_kodu: priceItem.uretici_kodu || "",
        color: colorKey,
        price: priceItem.price,
        quantity: malzeme.miktar,
        totalPrice: itemTotal,
        unit: malzeme.birim,
        type: priceItem.type || "cam_balkon",
        size: size,
      });
    } else {
      // Fiyat bulunamadı
      console.warn(`Fiyat bulunamadı: ${targetStockCode} (${malzeme.aciklama})`);
      errors.push(`Fiyat bulunamadı: ${malzeme.aciklama} (${targetStockCode})`);

      // Güvenli size hesaplama
      let size = 0;
      if (malzeme.olcu) {
        const parsedSize = parseFloat(String(malzeme.olcu));
        if (!isNaN(parsedSize)) {
          size = parsedSize;
        }
      }

      selectedProducts.products.push({
        stock_code: targetStockCode,
        description: malzeme.aciklama,
        uretici_kodu: "",
        color: colorKey,
        price: "0",
        quantity: malzeme.miktar,
        totalPrice: 0,
        unit: malzeme.birim,
        type: "unknown",
        size: size,
      });
    }
  });

  // Cam fiyatlarını hesapla ve toplam fiyata ekle
  if (camListesi.camlar.length > 0) {
    const normalizedCamKalinligi = camKalinligi.toLowerCase().replace(/\s/g, "");
    const normalizeCamRengiInput = (val: string) => {
      const v = (val || "").toString().toLowerCase().trim();
      if (v.includes("düz") || v.includes("duz")) return "seffaf";
      if (v.includes("şeffaf") || v.includes("seffaf")) return "seffaf";
      if (v.includes("füme") || v.includes("fume")) return "fume";
      if (v.includes("mavi")) return "mavi";
      if (v.includes("yeşil") || v.includes("yesil")) return "yesil";
      if (v.includes("bronz")) return "bronz";
      return v;
    };
    const normalizedCamRengi = normalizeCamRengiInput(camRengi);

    // Cam fiyatını bul
    const getCamField = (p: PriceItem, key: "camKalinligi" | "camRengi") => {
      const raw = (p as Record<string, unknown>)[key];
      return typeof raw === "string" ? raw : "";
    };

    // ÖNCE: 36720024 ile başlayan camları ara (bugün eklenen camlar - 4+16+4 = 24mm)
    let camPriceItem = prices.find(
      (p) =>
        p.type === "cam_balkon_cam" &&
        p.stock_code.startsWith("36720024") &&
        getCamField(p, "camKalinligi").toLowerCase().replace(/\s/g, "") === normalizedCamKalinligi &&
        getCamField(p, "camRengi").toLowerCase().trim() === normalizedCamRengi &&
        !p.description.toLowerCase().includes("küçük") // Küçük olmayanları tercih et
    );

    // Eğer küçük olmayan bulunamazsa, küçük olanları da dene
    if (!camPriceItem) {
      camPriceItem = prices.find(
        (p) =>
          p.type === "cam_balkon_cam" &&
          p.stock_code.startsWith("36720024") &&
          getCamField(p, "camKalinligi").toLowerCase().replace(/\s/g, "") === normalizedCamKalinligi &&
          getCamField(p, "camRengi").toLowerCase().trim() === normalizedCamRengi
      );
    }

    // Eğer hala bulunamazsa, sadece 36720024 ile başlayan ve kalınlığa uygun olanları ara
    if (!camPriceItem) {
      camPriceItem = prices.find(
        (p) =>
          p.type === "cam_balkon_cam" &&
          p.stock_code.startsWith("36720024") &&
          getCamField(p, "camKalinligi").toLowerCase().replace(/\s/g, "") === normalizedCamKalinligi
      );
    }

    // Eğer hala bulunamazsa, eski mantığa geri dön (CAM_24MM_SEFFAF gibi)
    if (!camPriceItem) {
      camPriceItem = prices.find(
        (p) =>
          p.type === "cam_balkon_cam" &&
          getCamField(p, "camKalinligi").toLowerCase().replace(/\s/g, "") === normalizedCamKalinligi &&
          getCamField(p, "camRengi").toLowerCase().trim() === normalizedCamRengi
      );
    }

    // Renk bulunamazsa sadece kalınlığa göre seffaf varsayımı
    if (!camPriceItem) {
      camPriceItem = prices.find(
        (p) =>
          p.type === "cam_balkon_cam" &&
          getCamField(p, "camKalinligi").toLowerCase().replace(/\s/g, "") === normalizedCamKalinligi
      );
    }

    const camUnitPrice = camPriceItem ? parseFloat(camPriceItem.price) : 0;
    const camTotalM2 = camListesi.toplamCamM2;
    const camTotalPrice = camUnitPrice * camTotalM2;
    totalPrice += camTotalPrice;

    if (!camPriceItem) {
      errors.push(`Cam fiyatı bulunamadı: ${camKalinligi} ${camRengi} (${camTotalM2.toFixed(2)} m²)`);
      console.warn(`Cam fiyatı bulunamadı: ${camKalinligi} ${camRengi}`);
    }

    selectedProducts.products.push({
      stock_code: camPriceItem?.stock_code || `CAM_${normalizedCamKalinligi}_${normalizedCamRengi}`,
      description: camPriceItem?.description || `Cam ${camKalinligi} ${camRengi}`,
      uretici_kodu: camPriceItem?.uretici_kodu || "",
      color: normalizedCamRengi,
      price: (camPriceItem?.price || "0").toString(),
      quantity: camTotalM2,
      totalPrice: camTotalPrice,
      unit: "m²",
      type: "cam_balkon_cam",
      size: 0,
    });
  }

  // Paketleme ücreti hesaplama
  const calculatePackagingCost = (basePrice: number): number => {
    if (values.packagingType === "var") {
      return parseFloat((basePrice * 0.02).toFixed(2)); // %2, 2 ondalık basamak
    }
    return 0;
  };

  const packagingCost = calculatePackagingCost(totalPrice);
  const finalTotalPrice = parseFloat((totalPrice + packagingCost).toFixed(2));

  // Paketleme selectedProduct'ını oluştur
  const packagingSelectedProduct: SelectedProduct | null =
    packagingCost > 0
      ? {
        stock_code: "PAKET-001",
        description: "Paketleme Ücreti (%2)",
        uretici_kodu: "PAKET-001",
        price: packagingCost.toFixed(2),
        quantity: 1,
        totalPrice: packagingCost,
        type: "packaging",
        color: "",
        unit: "adet",
      }
      : null;

  // Paketleme ücretini aksesuarlar listesine ekle
  if (packagingSelectedProduct) {
    selectedProducts.accessories.push(packagingSelectedProduct);
  }

  return {
    totalPrice: finalTotalPrice,
    selectedProducts,
    errors,
  };
};
