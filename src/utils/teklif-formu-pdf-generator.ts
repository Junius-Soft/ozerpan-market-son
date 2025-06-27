import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";
import JsBarcode from "jsbarcode";
import { Offer, Position } from "@/documents/offers";

export function generateTeklifFormuPDF(
  offer: Offer,
  positions: Position[]
): void {
  const doc = new jsPDF("p", "mm", "a4");
  const margin = 15;

  doc.addFileToVFS("NotoSans-Regular.ttf", NotoSansRegular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", NotoSansBold);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans");

  doc.setFontSize(14);
  doc.setFont("NotoSans", "bold");
  doc.text("Teklif ve Sözleşme Formu", margin, 25);
  doc.setFontSize(11);
  doc.setFont("NotoSans", "normal");
  doc.text(offer.name || "Teklif Adı", margin, 35);
  doc.setFontSize(9);
  doc.text(
    `Tarih: ${new Date().toLocaleDateString(
      "tr-TR"
    )} ${new Date().toLocaleTimeString("tr-TR")}`,
    margin,
    42
  );

  // Tablo başlıkları ve satırları
  const tableColumns = ["Poz", "En", "Boy", "Adet", "Fiyat"];
  const tableRows = positions.map((pos) => {
    const euroPrice =
      pos.unitPrice && pos.quantity ? pos.unitPrice * pos.quantity : 0;
    return [
      pos.pozNo,
      pos.productDetails?.width ?? "-",
      pos.productDetails?.height ?? "-",
      pos.quantity,
      euroPrice
        ? euroPrice.toLocaleString("tr-TR", {
            style: "currency",
            currency: "EUR",
          })
        : "-",
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [tableColumns],
    body:
      tableRows.length > 0 ? tableRows : [["", "Poz bulunmuyor", "", "", ""]],
    theme: "grid",
    tableWidth: doc.internal.pageSize.getWidth() - 2 * margin,
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

  // --- Toplam Bilgileri Tablosu ---
  // Hesaplamalar
  const toplam = positions.reduce(
    (acc, pos) =>
      acc + (pos.unitPrice && pos.quantity ? pos.unitPrice * pos.quantity : 0),
    0
  );
  const araToplam = toplam;
  const kdv = +(toplam * 0.2).toFixed(2); // %20 KDV
  const genelToplam = +(toplam + kdv).toFixed(2);

  // Format helpers
  const euro = (v: number) =>
    v.toLocaleString("tr-TR", { style: "currency", currency: "EUR" });

  // Tablo konumu
  // Toplamlar tablosu için üstteki tabloya uyumlu ölçü ve renkler
  // Üstteki tablo ile aynı genişlik ve başlık stili
  // autoTable fonksiyonundan dönen finalY, tablonun alt kenarının Y koordinatını verir
  // autoTable fonksiyonundan dönen değer void tipinde, fakat doc.lastAutoTable.finalY her zaman güncel değeri verir
  // jsPDF tipleri lastAutoTable'ı bilmiyor, bu yüzden tip genişletiyoruz
  type JsPDFWithAutoTable = jsPDF & {
    lastAutoTable?: { finalY?: number; body?: { height?: number }[] };
  };
  const docWithTable = doc as JsPDFWithAutoTable;
  const afterTableY = docWithTable.lastAutoTable?.finalY;
  // Genişliği azalt (ör: 70mm)
  const summaryTableW = 70;
  const summaryTableX =
    doc.internal.pageSize.getWidth() - margin - summaryTableW;
  // Eğer tablo çizildiyse, kutu tam bitişik başlasın; yoksa default Y kullan
  // finalY, tablonun son satırının ortasını değil, alt kenarını vermelidir. Ancak autoTable'ın bazı sürümlerinde finalY satır ortası olabiliyor.
  // Bunu düzeltmek için, son satır yüksekliğini ekleyerek kutuyu tam alt kenara hizalayabiliriz.
  let y = 75;
  if (typeof afterTableY === "number") {
    // Son satır yüksekliğini bulmak için autoTable'ın body dizisinin son elemanını al
    const bodyRows = docWithTable.lastAutoTable?.body;
    const lastRow = Array.isArray(bodyRows)
      ? bodyRows[bodyRows.length - 1]
      : undefined;
    const lastRowHeight = lastRow?.height || 9;
    // finalY + (satır yüksekliğinin yarısı) yerine, tam alt kenar için finalY + (satır yüksekliğinin tamamı / 2) değil, tamamı eklenmeli
    y = afterTableY + lastRowHeight;
  }

  // Satır başlıkları ve değerleri
  const rows = [
    { label: "TOPLAM", value: euro(toplam), bold: true },
    { label: "ARA TOPLAM", value: euro(araToplam), bold: true },
    { label: "KDV", value: euro(kdv), bold: true },
    { label: "GENEL TOPLAM", value: euro(genelToplam), bold: true },
  ];

  // Kutunun yüksekliği ve satır yüksekliği
  // Font ve satır yüksekliği tabloyla aynı olsun (bodyStyles.fontSize: 8)
  const fontSize = 8;
  const rowHeight = 8;
  const boxHeight = rows.length * rowHeight;

  // Kutunun arka planı ve kenarlığı
  // Sadece label kolonunun arka planı gri olacak şekilde kutu çizimi
  // Kenarlık yine tüm kutuya uygulanacak
  const labelColW = summaryTableW * 0.55; // label için genişlik oranı
  // Her satır için label arka planı çiz
  rows.forEach((row, i) => {
    const rowY = y - 4 + i * rowHeight;
    doc.setFillColor(240, 240, 240);
    doc.rect(summaryTableX, rowY, labelColW, rowHeight, "F");
    // Sağ border (ince gri çizgi)
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(
      summaryTableX + labelColW,
      rowY,
      summaryTableX + labelColW,
      rowY + rowHeight
    );
  });
  // Kenarlık tüm kutuya
  doc.setDrawColor(180, 180, 180);
  doc.rect(summaryTableX, y - 4, summaryTableW, boxHeight, "S");

  // Satırları yaz ve aralara ince çizgi çek
  rows.forEach((row, i) => {
    const rowY = y - 4 + i * rowHeight;
    // Satır ayırıcı çizgi (ilk satır hariç)
    if (i > 0) {
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(summaryTableX, rowY, summaryTableX + summaryTableW, rowY);
    }
    // Başlık (label)
    doc.setFont("NotoSans", row.bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(row.label, summaryTableX + 4, rowY + rowHeight / 2 + 1, {
      baseline: "middle",
    });
    // Değer (value) arka plansız
    doc.setFont("NotoSans", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(
      row.value,
      summaryTableX + summaryTableW - 4,
      rowY + rowHeight / 2 + 1,
      { align: "right", baseline: "middle" }
    );
  });

  // Barcode area (sadece ilk sayfa için sağ üst köşe)
  doc.setPage(1); // Her zaman ilk sayfaya dön
  const pageWidth = doc.internal.pageSize.getWidth();
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

  // --- Satış Sözleşmesi Şartları ---
  // Metin içeriği
  const contractTitle = "SATIŞ SÖZLEŞME ŞARTLARI:";
  const contractLines = [
    "1. Sipariş formu kaşe ve imza ile onaylandıktan sonra firmamıza iletilmelidir. Onayı olmayan siparişler işleme alınmayacaktır.",
    "2. Ödemesi alınmayan siparişler işleme alınmaz ve kesinlikle sevk edilmez. Ödemeden kaynaklı gecikmelerden firmamız sorumlu değildir.",
    "3. Satışlarımız EURO olup, Cari Hesap işleyişi; sipariş onay tarihi ve ödemenin nakite döndüğü günkü TCMB döviz efektif satış kuru esas alınacaktır.",
    "4. Ürün Teslimi: Siparişlerin teslim yeri Kayseri ALENDA depolarıdır. Depolardan ambara veya kargoya yapılacak nakliye ve sigorta bedelleri alıcıya aittir.",
    "5. Ambar ve kargodan yapılan sevkiyatlarda oluşabilecek hasar ve gecikmelerden firmamız sorumlu değildir. Eksik veya hatalı ürünler ile ilgili 24 saat içinde bilgi verilmesi zorunludur. Hasarlı ürünler için kargo teslimi esnasında kontrol yapılarak tutanak tutulmalıdır.",
  ];
  const contractFooterTitle = "SİPARİŞ ONAYLANMIŞTIR";
  const contractFooter = "KAŞE - İMZA - TARİH";

  // Sözleşme metni konumu: toplam tablosunun hemen altı
  let contractY = y - 4 + boxHeight + 12; // 12mm boşluk bırak
  doc.setFontSize(11);
  doc.setFont("NotoSans", "bold");
  doc.text(contractTitle, margin, contractY);
  contractY += 7;
  doc.setFontSize(9);
  doc.setFont("NotoSans", "normal");
  const contractLineSpacing = 7;
  const contractMaxWidth = doc.internal.pageSize.getWidth() - 2 * margin;
  contractLines.forEach((line, idx) => {
    // 2. ve 3. maddeler bold
    if (idx === 1 || idx === 2) {
      doc.setFont("NotoSans", "bold");
    } else {
      doc.setFont("NotoSans", "normal");
    }
    const splitLines = doc.splitTextToSize(line, contractMaxWidth);
    splitLines.forEach((splitLine: string) => {
      doc.text(splitLine, margin, contractY);
      contractY += contractLineSpacing;
    });
  });
  // Footer
  contractY += 4;
  // Sağ tarafa hizalama için X koordinatı
  const rightX = doc.internal.pageSize.getWidth() - margin;
  // 'SİPARİŞ ONAYLANMIŞTIR' sağa hizalı
  doc.setFontSize(11);
  doc.setFont("NotoSans", "bold");
  doc.text(contractFooterTitle, rightX, contractY, { align: "right" });
  contractY += 6;
  // 'KAŞE - İMZA - TARİH' sağa hizalı, hemen altında
  doc.setFontSize(10);
  doc.setFont("NotoSans", "normal");
  doc.text(contractFooter, rightX, contractY, { align: "right" });

  // PDF'i yeni sekmede aç
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
