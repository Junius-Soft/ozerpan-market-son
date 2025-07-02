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

// Uygun SelectedProduct tipini tanımla (Product yerine)
type SelectedProduct = {
  stock_code?: string;
  description?: string;
  size?: string;
  quantity?: number;
  type?: string;
};

// Helper to load logo as DataURL (browser only)
async function getLogoDataUrl(): Promise<string> {
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
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = "/logo.png";
  });
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

  private addFooter(
    offerId: string,
    pozNo: string,
    currentPage: number,
    totalPages: number
  ): void {
    const footerText = `${offerId} / ${pozNo}    Sayfa : ${currentPage}-${totalPages}`;
    this.doc.setFontSize(8);
    this.doc.setFont("NotoSans", "normal");
    const textWidth = this.doc.getTextWidth(footerText);
    const x = this.pageWidth - this.margin - textWidth;
    const y = this.pageHeight - 10;
    this.doc.text(footerText, x, y);
  }

  public async generateImalatList(data: ImalatPDFData): Promise<void> {
    // PDF başlığı (metadata)
    this.doc.setProperties({
      title:
        (data.offer.name ? data.offer.name + " - " : "") + "Poz İmalat Listesi",
    });

    // LOGO: sol üst köşe, teklif adı ile hizalı
    // Teklif adı y: 20 idi, logoyu da aynı y'den başlat
    const logoY = 20;
    const logoHeight = 18;
    const logoWidth = 18;
    try {
      const logoDataUrl = await getLogoDataUrl();
      this.doc.addImage(
        logoDataUrl,
        "JPG",
        this.margin,
        logoY,
        logoWidth,
        logoHeight
      );
    } catch {
      // Logo yüklenemezse devam et
    }

    // Tüm pozisyonların ürünlerini tek dizide topla
    const allProducts: Array<{
      pozNo: string;
      product: SelectedProduct;
    }> = [];
    data.positions.forEach((position) => {
      if (
        position.selectedProducts?.products &&
        Array.isArray(position.selectedProducts.products)
      ) {
        position.selectedProducts.products.forEach((product) => {
          allProducts.push({ pozNo: position.pozNo, product });
        });
      }
    });

    // Tip sıralaması (önce lamel, sonra alt parça, dikme, kutu, boru, diğer)
    const typeOrder = ["Lamel", "Alt Parça", "Dikme", "Kutu", "Boru"];
    allProducts.sort((a, b) => {
      const aType = a.product.type || "Diğer";
      const bType = b.product.type || "Diğer";
      const aIdx = typeOrder.indexOf(aType);
      const bIdx = typeOrder.indexOf(bType);
      if (aIdx === -1 && bIdx === -1) return aType.localeCompare(bType);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });

    // Başlık ve üst bilgiler
    this.addHeader(data);
    this.addOrderInfo();

    // Tek tabloya tüm ürünleri ekle (tip sütunu olmadan)
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
    // Tablo verisi hazırla
    const profileData: RowInput[] = allProducts.map((item, i): RowInput => {
      // Pozun adedini bul
      const poz = data.positions.find((p) => p.pozNo === item.pozNo);
      const pozQuantity = Number(poz?.quantity ?? 1);
      const productQuantity = Number(item.product.quantity ?? 1);
      const totalQuantity = (productQuantity * pozQuantity).toString();
      return [
        (i + 1).toString(),
        item.product.stock_code || "",
        item.product.description || "",
        item.product.size || "",
        totalQuantity,
        item.pozNo || "",
        "☐",
      ];
    });
    autoTable(this.doc, {
      startY: startY + 10,
      head: [
        [
          "S.No",
          "Stok Kodu",
          "Açıklama",
          "Ölçü",
          "Miktar",
          "Poz No",
          "Ok", // Yeni sütun başlığı
        ],
      ],
      body:
        profileData.length > 0
          ? profileData
          : [["1", "", "Profil bulunmuyor", "", "", "", "☐"]],
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

    // Footer ekle
    this.addFooter(data.offer.id, data.positions[0]?.pozNo || "", 1, 1);

    // Open PDF in new tab using Blob URL for better compatibility
    const pdfBlob = this.doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  }

  private addHeader(data: ImalatPDFData): void {
    // Company info
    // Teklif adı logonun altına gelsin, logodan daha uzak, başlığa daha yakın
    const logoY = 20;
    const logoHeight = 18;
    // Teklif adı ile başlık arası daha az, logodan sonra 12mm boşluk bırak
    const teklifAdiY = logoY + logoHeight + 8;
    this.doc.setFontSize(12);
    this.doc.setFont("NotoSans", "bold");
    this.doc.text(data.offer.name || "Teklif Adı", this.margin, teklifAdiY);

    // Title
    this.doc.setFontSize(14);
    this.doc.setFont("NotoSans", "bold");
    this.doc.text("POZ İMALAT LİSTESİ", this.margin, teklifAdiY + 10);

    // Tarih ve Hazırlayan (teklif adı ve başlık altına)
    const miktarY = teklifAdiY + 18;
    this.doc.setFontSize(9);
    this.doc.setFont("NotoSans", "normal");
    const tarihDate = new Date();
    const tarihStr = `Tarih: ${tarihDate.toLocaleDateString(
      "tr-TR"
    )} ${tarihDate.toLocaleTimeString("tr-TR")}`;
    this.doc.text(tarihStr, this.margin, miktarY);
    this.doc.text("Hazırlayan:", this.margin, miktarY + 6);

    // Barcode area (Profil Listesi tablosunun sağ kenarıyla hizalı)
    const tableRight = this.pageWidth - this.margin;
    const barcodeWidth = 60;
    const barcodeY = 15;

    // Generate barcode
    const barcodeValue = data.offer.id; // Sadece teklif no
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
    // Barkodun altına değerini yaz (barcode ile ortalı)
    this.doc.setFontSize(16);
    this.doc.setFont("NotoSans", "normal");
    const offerId = data.offer.id;
    const textY = barcodeY + 25 + 8;
    // Barkodun genişliğini ve yazının genişliğini al
    const barcodeCenterX = barcodeDrawX + barcodeDrawWidth / 2;
    const offerIdWidth = this.doc.getTextWidth(offerId);
    // Ortalamak için x koordinatını hesapla
    const textX = barcodeCenterX - offerIdWidth / 2;
    this.doc.text(offerId, textX, textY);

    // Eski miktar bilgisi kaldırıldı
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
            product.size || "", // Ürün ölçüsü zorunlu
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
}

// Main function to generate PDF for selected positions

export async function generateImalatListPDF(
  offer: Offer,
  selectedPositions: Position[]
): Promise<void> {
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

  await generator.generateImalatList(data);
}

// Export function for use in offer-utils
export async function openImalatListPDFMulti(
  offer: Offer,
  positions: Position[]
): Promise<void> {
  await generateImalatListPDF(offer, positions);
}
