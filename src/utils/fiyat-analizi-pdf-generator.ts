import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";
import { Offer, Position } from "@/documents/offers";

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
    const unitPriceEUR = pos.unitPrice || 0;
    // const unitPriceTL = eurRate ? unitPriceEUR * eurRate : undefined;
    const totalEUR = unitPriceEUR * pos.quantity;
    // const totalTL = eurRate ? totalEUR * eurRate : undefined;
    return [
      pos.pozNo,
      pos.productName || "-",
      pos.productDetails?.width ?? "-",
      pos.productDetails?.height ?? "-",
      pos.quantity,
      pos.unit ? pos.unit.charAt(0).toUpperCase() + pos.unit.slice(1) : "-",
      unitPriceEUR !== undefined
        ? `€ ${unitPriceEUR.toLocaleString("tr-TR", {
            maximumFractionDigits: 2,
          })}`
        : "-",
      totalEUR !== undefined
        ? `€ ${totalEUR.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`
        : "-",
    ];
  });

  // Malzeme Listesi Tablosu (ürünler + aksesuarlar)
  const malzemeListesiData: RowInput[] = [];
  let rowIndex = 1;
  positions.forEach((pos) => {
    // Ürünler
    if (pos.selectedProducts && Array.isArray(pos.selectedProducts.products)) {
      pos.selectedProducts.products.forEach((prod) => {
        const euroTotal =
          prod.price && prod.quantity ? Number(prod.price) * prod.quantity : 0;
        malzemeListesiData.push([
          rowIndex++,
          prod.stock_code || "-",
          prod.description || "-",
          prod.quantity ?? 1,
          prod.unit
            ? prod.unit.charAt(0).toUpperCase() + prod.unit.slice(1)
            : "-",
          prod.price
            ? "€ " +
              Number(prod.price).toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              })
            : "-",
          euroTotal !== undefined
            ? "€ " +
              euroTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
            : "-",
        ]);
      });
    }
    // Aksesuarlar
    if (
      pos.selectedProducts &&
      Array.isArray(pos.selectedProducts.accessories)
    ) {
      pos.selectedProducts.accessories.forEach((acc) => {
        const euroTotal =
          acc.price && acc.quantity ? Number(acc.price) * acc.quantity : 0;
        malzemeListesiData.push([
          rowIndex++,
          acc.stock_code || "-",
          acc.description || "-",
          acc.quantity ?? 1,
          acc.unit ? acc.unit.charAt(0).toUpperCase() + acc.unit.slice(1) : "-",
          acc.price
            ? "€ " +
              Number(acc.price).toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              })
            : "-",
          euroTotal !== undefined
            ? "€ " +
              euroTotal.toLocaleString("tr-TR", { maximumFractionDigits: 2 })
            : "-",
        ]);
      });
    }
  });

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
        "Tutar (€)",
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
