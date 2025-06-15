import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { Offer, Position } from "@/documents/offers";

// Base64 font data will be imported
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";

interface ImalatPDFData {
  offer: Offer;
  positions: Position[];
  orderNumber?: string;
  date?: string;
  quantity?: string;
}

export class ImalatPDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 15;

  constructor() {
    this.doc = new jsPDF("p", "mm", "a4");
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();

    // Add Turkish font support
    this.doc.addFileToVFS("NotoSans-Regular.ttf", NotoSansRegular);
    this.doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
    this.doc.addFileToVFS("NotoSans-Bold.ttf", NotoSansBold);
    this.doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
    this.doc.setFont("NotoSans");
  }

  public generateImalatList(data: ImalatPDFData): void {
    data.positions.forEach((position, idx) => {
      if (idx > 0) this.doc.addPage();
      // pozNo'yu baştaki sıfırları atarak sayıya çevir
      const pozNoNumber = position.pozNo ? String(Number(position.pozNo)) : "";
      // Her sayfa için tek pozisyonluk data oluştur
      const singleData: ImalatPDFData = {
        ...data,
        positions: [position],
        quantity: position.quantity.toString(),
      };
      this.addHeader(singleData, pozNoNumber); // pozisyon sırası 1'den başlasın
      this.addOrderInfo();
      this.addProfileList(singleData);
      this.addAccessoryList(singleData);
    });

    // Open PDF in new tab using Blob URL for better compatibility
    const pdfBlob = this.doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  }

  private addHeader(data: ImalatPDFData, pozNo: string): void {
    // Company info
    this.doc.setFontSize(12);
    this.doc.setFont("NotoSans", "bold");
    this.doc.text(data.offer.name || "Teklif Adı", this.margin, 20);

    // Title
    this.doc.setFontSize(14);
    this.doc.setFont("NotoSans", "bold");
    this.doc.text("POZ İMALAT LİSTESİ", this.margin, 40);

    // Miktar bilgisi (altına)
    const miktarY = 48;
    const totalQuantity = data.positions.reduce(
      (sum, pos) => sum + pos.quantity,
      0
    );
    this.doc.setFontSize(12);
    this.doc.setFont("NotoSans", "bold");
    this.doc.text(`Miktar: ${totalQuantity} Adet`, this.margin, miktarY);

    // Tarih ve Hazırlayan (sola, miktarın altına)
    this.doc.setFontSize(9);
    this.doc.setFont("NotoSans", "normal");
    const tarihDate = new Date();
    const tarihStr = `Tarih: ${tarihDate.toLocaleDateString(
      "tr-TR"
    )} ${tarihDate.toLocaleTimeString("tr-TR")}`;
    this.doc.text(tarihStr, this.margin, miktarY + 7);
    this.doc.text("Hazırlayan:", this.margin, miktarY + 13);

    // Barcode area (Profil Listesi tablosunun sağ kenarıyla hizalı)
    const tableRight = this.pageWidth - this.margin;
    const barcodeWidth = 60;
    const barcodeX = tableRight - barcodeWidth;
    const barcodeY = 15;

    // Generate barcode
    const barcodeValue = `${data.offer.id}${pozNo}`;
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      width: 2, // varsayılan genişlik
      height: 40,
      displayValue: false,
      fontSize: 12,
      textMargin: 2,
      margin: 10, // varsayılan padding
    });
    // Barkodun gerçek genişliğini ölç
    const barcodeCanvasWidth = canvas.width;
    // Profil Listesi tablosunun sağ kenarına hizala
    const barcodeDrawWidth = Math.min(barcodeCanvasWidth / 4, barcodeWidth); // 4: px->mm oranı
    const barcodeDrawX = tableRight - barcodeDrawWidth;
    const barcodeDataUrl = canvas.toDataURL("image/png");
    this.doc.addImage(
      barcodeDataUrl,
      "PNG",
      barcodeDrawX,
      barcodeY,
      barcodeDrawWidth,
      25
    );
    // Barkodun altına değerini yaz (en sağa dayalı)
    this.doc.setFontSize(18);
    this.doc.setFont("NotoSans", "normal");
    const offerId = data.offer.id;
    const textY = barcodeY + 25 + 8;
    const offerIdWidth = this.doc.getTextWidth(offerId);
    const pozNoWidth = this.doc.getTextWidth(pozNo);
    const totalWidth = offerIdWidth + 10 + pozNoWidth; // 10 birim boşluk
    const textX = barcodeX + barcodeWidth - totalWidth;
    this.doc.text(offerId, textX, textY);
    this.doc.text(pozNo, textX + offerIdWidth + 10, textY);

    // Eski tarih ve hazırlayan bilgisi kaldırıldı (en sağda tekrar yazılmayacak)
  }

  private addOrderInfo(): void {
    // Bu fonksiyon artık boş, tarih ve hazırlayan bilgisi kaldırıldı
  }

  private addProfileList(data: ImalatPDFData): void {
    const startY = 85;
    this.doc.setFontSize(11);
    this.doc.setFont("NotoSans", "bold");
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(
      this.margin,
      startY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );
    this.doc.text("Profil Listesi", this.margin + 2, startY + 5);

    // Prepare profile data
    const profileData: RowInput[] = [];
    data.positions.forEach((position) => {
      if (
        position.selectedProducts?.products &&
        Array.isArray(position.selectedProducts.products)
      ) {
        position.selectedProducts.products.forEach((product) => {
          profileData.push([
            (profileData.length + 1).toString(),
            product.stock_code || "",
            product.description || "",
            "0",
            "0,0/0,0", // Sol/Sağ Açı default
            product.quantity?.toString() || "1",
            "☐", // Ok sütunu: boş checkbox
          ]);
        });
      }
    });
    if (profileData.length === 0) {
      profileData.push(["1", "", "Profil bulunmuyor", "", "0,0/0,0", "", "☐"]);
    }
    autoTable(this.doc, {
      startY: startY + 10,
      head: [
        [
          "S.No",
          "Stok Kodu",
          "Açıklama",
          "Ölçü",
          "Sol/Sağ Açı",
          "Miktar",
          "Ok",
        ],
      ],
      body: profileData,
      theme: "grid",
      tableWidth: this.pageWidth - 2 * this.margin,
      margin: { left: this.margin, right: this.margin },
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
  }

  private addAccessoryList(data: ImalatPDFData): void {
    // @ts-expect-error: lastAutoTable is attached by jsPDF-AutoTable plugin
    const finalY = this.doc.lastAutoTable?.finalY || 150;
    const startY = finalY + 15;
    this.doc.setFontSize(11);
    this.doc.setFont("NotoSans", "bold");
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(
      this.margin,
      startY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );
    this.doc.text("Aksesuar Listesi", this.margin + 2, startY + 5);
    const accessoryData: RowInput[] = [];
    data.positions.forEach((position) => {
      if (
        position.selectedProducts?.accessories &&
        Array.isArray(position.selectedProducts.accessories)
      ) {
        position.selectedProducts.accessories.forEach((accessory) => {
          accessoryData.push([
            (accessoryData.length + 1).toString(),
            accessory.stock_code || "",
            accessory.description || "",
            accessory.quantity ? accessory.quantity + " Adet" : "1 Adet",
          ]);
        });
      }
    });
    if (accessoryData.length === 0) {
      accessoryData.push(["1", "", "Aksesuar bulunmuyor", "0 Adet"]);
    }
    autoTable(this.doc, {
      startY: startY + 10,
      head: [["S.No", "Stok Kodu", "Açıklama", "Miktar"]],
      body: accessoryData,
      theme: "grid",
      tableWidth: this.pageWidth - 2 * this.margin,
      margin: { left: this.margin, right: this.margin },
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
  }
}

// Main function to generate PDF for selected positions
export function generateImalatListPDF(
  offer: Offer,
  selectedPositions: Position[]
): void {
  const generator = new ImalatPDFGenerator();

  const data: ImalatPDFData = {
    offer,
    positions: selectedPositions,
    orderNumber: offer.id,
    date: new Date().toLocaleDateString("tr-TR"),
    quantity: selectedPositions
      .reduce((sum, pos) => sum + pos.quantity, 0)
      .toString(),
  };

  generator.generateImalatList(data);
}

// Export function for use in offer-utils
export function openImalatListPDFMulti(
  offer: Offer,
  positions: Position[]
): void {
  generateImalatListPDF(offer, positions);
}
