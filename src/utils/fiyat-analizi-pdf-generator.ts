import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";
import { Offer, Position } from "@/documents/offers";
import { store } from "@/store";

// Logo'yu base64 olarak yükleyen fonksiyon (imalat-pdf-generator.ts ile aynı)
export async function getLogoDataUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context error");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpg"));
    };
    img.onerror = reject;
    img.src = "/logo.png";
  });
}

export async function generateFiyatAnaliziPDFPozListesi(
  offer: Offer,
  positions: Position[]
): Promise<void> {
  // Redux'tan currency ve eurRate değerlerini al
  const state = store.getState();
  const currency = state.app.currency;
  const eurRate = state.app.eurRate;

  // Fiyat formatı fonksiyonu - pozisyonun kendi currency'sine göre
  // Cam balkon için her zaman TRY göster
  const formatPrice = (amount: number, positionCurrency: string, isCamBalkon: boolean = false) => {
    // Cam balkon ise her zaman TRY olarak göster
    if (isCamBalkon) {
      // Eğer pozisyon currency'si TRY değilse, TRY'ye çevir
      let tryAmount = amount;
      if (positionCurrency === "EUR") {
        tryAmount = amount * eurRate;
      }
      return `₺ ${tryAmount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    
    // Diğer ürünler için pozisyonun kendi currency'sine göre formatla
    // Pozisyon currency'si EUR ise EUR, TRY ise TRY göster
    if (positionCurrency === "EUR") {
      return `€ ${amount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `₺ ${amount.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  // Cam balkon için genişlik hesaplama fonksiyonu
  const calculateCamBalkonWidth = (pos: Position): string => {
    if (pos.productId !== "cam-balkon" || !pos.productDetails) {
      return "-";
    }
    
    const pd = pos.productDetails as Record<string, unknown>;
    const kolSayisi = Number(pd.kolSayisi || 1);
    let toplamGenislik = 0;
    
    for (let i = 1; i <= kolSayisi; i++) {
      const g = Number(pd[`kol${i}_genislik`] || 0);
      if (!Number.isNaN(g) && g > 0) {
        toplamGenislik += g;
      }
    }
    
    return toplamGenislik > 0 ? `${toplamGenislik} mm` : "-";
  };

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Fontlar
  doc.addFileToVFS("NotoSans-Regular.ttf", NotoSansRegular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", NotoSansBold);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans");

  // Sol üst köşeye logo ekle (async)
  // Barcode başlangıcı ile aynı y'de hizala
  const logoY = 15;
  try {
    const logoDataUrl = await getLogoDataUrl();
    doc.addImage(logoDataUrl, "JPG", margin, logoY, 18, 18);
  } catch {
    // Logo eklenemedi, devam et
  }

  // Başlık biraz aşağıda
  const titleY = 42;
  doc.setFontSize(14);
  doc.setFont("NotoSans", "bold");
  doc.text("MALZEME FİYAT ANALİZİ", margin, titleY);
  doc.setFontSize(11);
  doc.setFont("NotoSans", "normal");
  doc.text(offer.name || "Teklif Adı", margin, titleY + 8);
  doc.setFontSize(9);
  doc.text(
    `Tarih: ${new Date().toLocaleDateString(
      "tr-TR"
    )} ${new Date().toLocaleTimeString("tr-TR")}`,
    margin,
    titleY + 14
  );

  // Poz Listesi başlığı
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text("Poz Listesi", margin, 75); // y: 55 -> 75
  doc.setFont("NotoSans", "normal");

  // Poz Listesi Tablosu
  const pozTableData: RowInput[] = positions.map((pos) => {
    const unitPrice = pos.unitPrice || 0;
    const total = unitPrice * pos.quantity;
    const posCurrency = pos.currency?.code || "EUR";
    const isCamBalkon = pos.productId === "cam-balkon";
    
    // Cam balkon için genişlik hesapla
    let genislik: number | string = pos.productDetails?.width ?? "-";
    if (isCamBalkon) {
      genislik = calculateCamBalkonWidth(pos);
    }

    return [
      pos.pozNo,
      pos.productName || "-",
      genislik,
      pos.productDetails?.height ?? "-",
      pos.quantity,
      pos.unit ? pos.unit.charAt(0).toUpperCase() + pos.unit.slice(1) : "-",
      unitPrice !== undefined ? formatPrice(unitPrice, posCurrency, isCamBalkon) : "-",
      total !== undefined ? formatPrice(total, posCurrency, isCamBalkon) : "-",
    ];
  });

  // Malzeme Listesi Tablosu (ürünler + aksesuarlar) - TOPLU GÖSTERİM
  // Önce tüm malzemeleri topla ve grupla
  interface MalzemeItem {
    stock_code: string;
    description: string;
    unit: string;
    price: number;
    currency: string;
    isCamBalkon: boolean;
    totalQuantity: number;
    totalPrice: number;
  }

  const malzemeMap = new Map<string, MalzemeItem>();

  positions.forEach((pos) => {
    const posCurrency = pos.currency?.code || "EUR";
    const isCamBalkon = pos.productId === "cam-balkon";
    
    // Ürünler
    if (pos.selectedProducts && Array.isArray(pos.selectedProducts.products)) {
      pos.selectedProducts.products.forEach((prod) => {
        // Metre bazında satılan ürünler için size değerini metre'ye çevir
        const isMetre = prod.unit?.toLowerCase() === "metre";
        const prodSize = (prod as { size?: number }).size;
        const baseQuantity = isMetre && prodSize 
          ? Number((prodSize / 1000).toFixed(2)) 
          : (prod.quantity ?? 1);
        // Pozisyon quantity'si ile çarp
        const totalQuantity = baseQuantity * (pos.quantity ?? 1);
        const prodPrice = prod.price ? Number(prod.price) : 0;
        const totalPrice = prod.totalPrice 
          ? Number(prod.totalPrice) * (pos.quantity ?? 1)
          : prodPrice * totalQuantity;

        // Unique key: stock_code + description + unit + currency (fiyat hariç - aynı malzemeler toplu gösterilecek)
        const key = `${prod.stock_code || "-"}|${prod.description || "-"}|${prod.unit || "-"}|${posCurrency}`;
        
        if (malzemeMap.has(key)) {
          // Mevcut malzemeyi güncelle
          const existing = malzemeMap.get(key)!;
          existing.totalQuantity += totalQuantity;
          existing.totalPrice += totalPrice;
          // Fiyat farklıysa ortalama fiyatı hesapla (toplam fiyat / toplam miktar)
          if (existing.totalQuantity > 0) {
            existing.price = existing.totalPrice / existing.totalQuantity;
          }
        } else {
          // Yeni malzeme ekle
          malzemeMap.set(key, {
            stock_code: prod.stock_code || "-",
            description: prod.description || "-",
            unit: prod.unit ? prod.unit.charAt(0).toUpperCase() + prod.unit.slice(1) : "-",
            price: prodPrice,
            currency: posCurrency,
            isCamBalkon,
            totalQuantity,
            totalPrice,
          });
        }
      });
    }
    // Aksesuarlar
    if (
      pos.selectedProducts &&
      Array.isArray(pos.selectedProducts.accessories)
    ) {
      pos.selectedProducts.accessories.forEach((acc) => {
        // Metre bazında satılan aksesuarlar için size değerini metre'ye çevir
        const isMetre = acc.unit?.toLowerCase() === "metre";
        const accSize = (acc as { size?: number }).size;
        const baseQuantity = isMetre && accSize 
          ? Number((accSize / 1000).toFixed(2)) 
          : (acc.quantity ?? 1);
        // Pozisyon quantity'si ile çarp
        const totalQuantity = baseQuantity * (pos.quantity ?? 1);
        const accPrice = acc.price ? Number(acc.price) : 0;
        const totalPrice = acc.totalPrice 
          ? Number(acc.totalPrice) * (pos.quantity ?? 1)
          : accPrice * totalQuantity;

        // Unique key: stock_code + description + unit + currency (fiyat hariç - aynı malzemeler toplu gösterilecek)
        const key = `${acc.stock_code || "-"}|${acc.description || "-"}|${acc.unit || "-"}|${posCurrency}`;
        
        if (malzemeMap.has(key)) {
          // Mevcut malzemeyi güncelle
          const existing = malzemeMap.get(key)!;
          existing.totalQuantity += totalQuantity;
          existing.totalPrice += totalPrice;
          // Fiyat farklıysa ortalama fiyatı hesapla (toplam fiyat / toplam miktar)
          if (existing.totalQuantity > 0) {
            existing.price = existing.totalPrice / existing.totalQuantity;
          }
        } else {
          // Yeni malzeme ekle
          malzemeMap.set(key, {
            stock_code: acc.stock_code || "-",
            description: acc.description || "-",
            unit: acc.unit ? acc.unit.charAt(0).toUpperCase() + acc.unit.slice(1) : "-",
            price: accPrice,
            currency: posCurrency,
            isCamBalkon,
            totalQuantity,
            totalPrice,
          });
        }
      });
    }
  });

  // Map'ten array'e çevir ve sırala
  const malzemeListesiData: RowInput[] = Array.from(malzemeMap.values())
    .map((item, index) => [
      index + 1,
      item.stock_code,
      item.description,
      item.totalQuantity,
      item.unit,
      item.price ? formatPrice(item.price, item.currency, item.isCamBalkon) : "-",
      item.totalPrice !== undefined ? formatPrice(item.totalPrice, item.currency, item.isCamBalkon) : "-",
    ]);

  // Poz Listesi Tablosu çizimi
  autoTable(doc, {
    startY: 80, // 60 -> 80
    head: [
      [
        "Poz No",
        "Ürün",
        "Genişlik",
        "Yükseklik",
        "Miktar",
        "Birim",
        "Birim Fiyat",
        "Toplam",
      ],
    ],
    body: pozTableData,
    theme: "grid",
    tableWidth: pageWidth - 2 * margin,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      font: "NotoSans",
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      font: "NotoSans",
    },
  });

  // Malzeme Listesi başlığı
  // @ts-expect-error: lastAutoTable is a runtime property added by jspdf-autotable
  const lastAutoTable = doc.lastAutoTable as { finalY: number } | undefined;
  const malzemeListesiBaslikY =
    lastAutoTable && lastAutoTable.finalY ? lastAutoTable.finalY + 16 : 110;
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text("Malzeme Listesi", margin, malzemeListesiBaslikY);
  doc.setFont("NotoSans", "normal");

  // Cam balkon var mı kontrol et - varsa TRY kullan
  const hasCamBalkon = positions.some((pos) => pos.productId === "cam-balkon");
  const currencySymbol = hasCamBalkon ? "₺" : (currency === "EUR" ? "€" : "₺");

  // Malzeme Listesi Tablosu çizimi
  autoTable(doc, {
    startY: malzemeListesiBaslikY + 5,
    head: [
      [
        "S.No",
        "Stok Kodu",
        "Açıklama",
        "Miktar",
        "Birim",
        "Birim Fiyat",
        `Tutar (${currencySymbol})`,
      ],
    ],
    body: malzemeListesiData,
    theme: "grid",
    tableWidth: pageWidth - 2 * margin,
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 9,
      font: "NotoSans",
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      font: "NotoSans",
    },
  });

  // Barcode area (sadece ilk sayfa için sağ üst köşe)
  doc.setPage(1); // Her zaman ilk sayfaya dön
  const tableRight = pageWidth - margin;
  const barcodeWidth = 60;
  const barcodeY = 15;
  const barcodeValue = offer.id;
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, barcodeValue, {
    format: "CODE128",
    width: 2,
    height: 40,
    displayValue: false,
    fontSize: 12,
    textMargin: 2,
    margin: 10,
  });
  const barcodeCanvasWidth = canvas.width;
  const barcodeDrawWidth = Math.min(barcodeCanvasWidth / 4, barcodeWidth);
  const barcodeDrawX = tableRight - barcodeDrawWidth;
  const barcodeDataUrl = canvas.toDataURL("image/png");
  doc.addImage(
    barcodeDataUrl,
    "PNG",
    barcodeDrawX,
    barcodeY,
    barcodeDrawWidth,
    25
  );
  // Barkodun altına değerini yaz (barcode ile ortalı)
  doc.setFontSize(16);
  doc.setFont("NotoSans", "normal");
  const offerId = offer.id;
  const textY = barcodeY + 25 + 8;
  const barcodeCenterX = barcodeDrawX + barcodeDrawWidth / 2;
  const offerIdWidth = doc.getTextWidth(offerId);
  const textX = barcodeCenterX - offerIdWidth / 2;
  doc.text(offerId, textX, textY);

  // PDF'i yeni sekmede aç
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
