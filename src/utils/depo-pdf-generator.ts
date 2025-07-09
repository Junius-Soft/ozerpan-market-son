import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";
import { Offer, Position } from "@/documents/offers";
import { PriceItem } from "@/types/panjur";
import { getLogoDataUrl } from "./fiyat-analizi-pdf-generator";

export async function generateDepoCikisFisiPDF(
  offer: Offer,
  selectedPositions: Position[]
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

  // Logo ve başlık hizalama
  const logoY = 15;
  try {
    const logoDataUrl = await getLogoDataUrl();
    doc.addImage(logoDataUrl, "JPG", margin, logoY, 18, 18);
  } catch {
    // Logo eklenemedi, devam et
  }

  // Başlık (logo ile hizalı, biraz aşağıda)
  const titleY = logoY + 18 + 10;
  doc.setFontSize(14);
  doc.setFont("NotoSans", "bold");
  doc.text("DEPO ÇIKIŞ FİŞİ", margin, titleY);
  doc.setFontSize(11);
  doc.setFont("NotoSans", "normal");
  doc.text(offer.name || "Teklif Adı", margin, titleY + 8);
  doc.setFontSize(9);
  doc.setFont("NotoSans", "normal");
  doc.text(
    `Tarih: ${new Date().toLocaleDateString(
      "tr-TR"
    )} ${new Date().toLocaleTimeString("tr-TR")}`,
    margin,
    titleY + 14
  );

  // Aksesuarları topla ve pozNo'ya göre grupla
  type AccessoryRow = {
    stock_code: string;
    description: string;
    quantity: number;
    unit: string;
  };
  const accessoryRows: AccessoryRow[] = [];
  selectedPositions.forEach((position) => {
    // Ürünler
    if (
      position.selectedProducts?.products &&
      Array.isArray(position.selectedProducts.products)
    ) {
      position.selectedProducts.products.forEach(
        (product: PriceItem & { size?: string | number }) => {
          let miktar = 1;
          let sizeValue = 1;
          if (product.size !== undefined) {
            if (typeof product.size === "number") {
              sizeValue = product.size;
            } else if (typeof product.size === "string") {
              // Örneğin "3400 mm" gibi ise sadece sayıyı al
              const match = product.size.match(/\d+(?:[\.,]\d+)?/);
              if (match) {
                sizeValue = parseFloat(match[0].replace(",", "."));
              }
            }
          }
          // mm'yi metreye çevir
          const metreValue = sizeValue / 1000;
          if (
            metreValue !== undefined &&
            product.quantity !== undefined &&
            !isNaN(Number(metreValue)) &&
            !isNaN(Number(product.quantity))
          ) {
            miktar = Number(metreValue) * Number(product.quantity);
          }
          const unit = "Mtül";

          accessoryRows.push({
            stock_code: product.stock_code || "",
            description: product.description || "",
            quantity:
              Number.isFinite(miktar) && miktar > 0
                ? parseFloat(miktar.toFixed(2))
                : 1,
            unit,
          });
        }
      );
    }
    // Aksesuarlar
    if (
      position.selectedProducts?.accessories &&
      Array.isArray(position.selectedProducts.accessories)
    ) {
      position.selectedProducts.accessories.forEach((accessory: PriceItem) => {
        let unit = accessory.unit || "Adet";
        if (unit.toLowerCase() === "metre") {
          unit = "Mtül";
        }
        accessoryRows.push({
          stock_code: accessory.stock_code || "",
          description: accessory.description || "",
          quantity: Number(accessory.quantity) || 1,
          unit,
        });
      });
    }
  });

  // Aynı ürünleri grupla (pozNo bağımsız)
  const groupedRows: Record<string, AccessoryRow> = {};
  accessoryRows.forEach((row) => {
    const key = `${row.stock_code}|${row.description}|${row.unit}`;
    if (!groupedRows[key]) {
      groupedRows[key] = { ...row };
    } else {
      groupedRows[key].quantity += row.quantity;
    }
  });

  // Tablo verisi
  const tableData: RowInput[] = Object.values(groupedRows).map((item) => [
    item.stock_code,
    item.description,
    item.quantity.toString(),
    item.unit,
    "",
  ]);

  // Tablo çiz
  autoTable(doc, {
    startY: 65,
    head: [["Stok Kodu", "Açıklama", "Miktar", "Birim", "OK"]],
    body:
      tableData.length > 0
        ? tableData
        : [["", "Aksesuar bulunmuyor", "", "", ""]],
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

export async function openDepoCikisFisiPDFMulti(
  offer: Offer,
  positions: Position[]
): Promise<void> {
  await generateDepoCikisFisiPDF(offer, positions);
}
