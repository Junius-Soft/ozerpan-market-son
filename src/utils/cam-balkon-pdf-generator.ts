import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import NotoSansRegular from "./NotoSans-Regular.js";
import NotoSansBold from "./NotoSans-Bold.js";
import { getLogoDataUrl } from "./fiyat-analizi-pdf-generator";
import { calculateCamBalkonMalzemeListesi, groupMalzemeListesi, calculateCamListesi, KolBilgisi } from "./cam-balkon-malzeme-listesi";

// Re-export KolBilgisi for external use
export type { KolBilgisi };

export interface CamBalkonPDFData {
  offerName: string;
  pozNo: string;
  totalHeight: number;
  camKalinligi: string;
  camRengi: string;
  renk: string;
  kolBilgileri: KolBilgisi[];
  quantity: number;
  toplamHareketliCamArasi?: number;
  toplamSabitHareketliCamArasi?: number;
  drawingDataUrl?: string;
}

export async function generateCamBalkonMalzemeListesiPDF(data: CamBalkonPDFData): Promise<void> {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Fontlar
  doc.addFileToVFS("NotoSans-Regular.ttf", NotoSansRegular);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", NotoSansBold);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans");

  // Logo ve başlık
  let currentY = 15;
  try {
    const logoDataUrl = await getLogoDataUrl();
    doc.addImage(logoDataUrl, "JPG", margin, currentY, 18, 18);
    currentY += 25;
  } catch {
    // Logo eklenemedi, devam et
    currentY += 10;
  }

  // Başlık
  doc.setFontSize(16);
  doc.setFont("NotoSans", "bold");
  doc.text("CAM BALKON MALZEME LİSTESİ", margin, currentY);
  currentY += 10;

  // Teklif bilgileri
  doc.setFontSize(11);
  doc.setFont("NotoSans", "normal");
  doc.text(`Teklif: ${data.offerName}`, margin, currentY);
  currentY += 6;
  doc.text(`Pozisyon No: ${data.pozNo}`, margin, currentY);
  currentY += 6;
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")} ${new Date().toLocaleTimeString("tr-TR")}`, margin, currentY);
  currentY += 10;

  // Teknik özellikler
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text("Teknik Özellikler:", margin, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setFont("NotoSans", "normal");
  doc.text(`• Yükseklik: ${data.totalHeight} mm`, margin + 5, currentY);
  currentY += 5;
  doc.text(`• Cam Kalınlığı: ${data.camKalinligi}`, margin + 5, currentY);
  currentY += 5;
  doc.text(`• Cam Rengi: ${data.camRengi}`, margin + 5, currentY);
  currentY += 5;
  doc.text(`• Profil Rengi: ${data.renk}`, margin + 5, currentY);
  currentY += 5;
  doc.text(`• Kol Sayısı: ${data.kolBilgileri.length}`, margin + 5, currentY);
  currentY += 10;

  // Kol detayları
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text("Kol Detayları:", margin, currentY);
  currentY += 8;

  data.kolBilgileri.forEach((kol, index) => {
    doc.setFontSize(10);
    doc.setFont("NotoSans", "bold");
    doc.text(`${index + 1}. Kol:`, margin + 5, currentY);
    currentY += 5;

    doc.setFont("NotoSans", "normal");
    doc.text(`• Genişlik: ${kol.genislik} mm`, margin + 10, currentY);
    currentY += 4;
    doc.text(`• Toplam Kanat: ${kol.kanat} adet`, margin + 10, currentY);
    currentY += 4;
    doc.text(`• Çıkış Sayısı: ${kol.cikis_sayisi} adet (${kol.cikis_yonu})`, margin + 10, currentY);
    currentY += 4;
    if (kol.sabitCamAdedi > 0) {
      doc.text(`• Sabit Cam: ${kol.sabitCamAdedi} adet (${kol.sabitCamGenisligi}mm, ${kol.sabitCamYonu})`, margin + 10, currentY);
      currentY += 4;
    }
    if (kol.aci && kol.aci !== 0) {
      doc.text(`• Açı: ${kol.aci}°`, margin + 10, currentY);
      currentY += 4;
    }
    currentY += 3;
  });

  currentY += 5;

  // Malzeme listesini hesapla
  const malzemeListesi = calculateCamBalkonMalzemeListesi(
    data.kolBilgileri,
    data.totalHeight,
    data.camKalinligi,
    data.camRengi,
    data.renk,
    data.pozNo,
    data.toplamHareketliCamArasi,
    data.toplamSabitHareketliCamArasi
  );

  const groupedMalzemeListesi = groupMalzemeListesi(malzemeListesi);

  // Malzeme listesi tablosu
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text("Malzeme Listesi:", margin, currentY);
  currentY += 8;

  // Kategorilere göre grupla ve her kategori için ayrı tablo oluştur
  const kategoriler = ['Aluminyum Malzemeler', 'Cam', 'Profil', 'Aksesuar'];
  let siraNo = 1;
  
  kategoriler.forEach((kategori) => {
    const kategoriMalzemeleri = groupedMalzemeListesi.filter(m => m.kategori === kategori);
    
    if (kategoriMalzemeleri.length > 0) {
      // Kategori başlığını tablo dışında göster
      doc.setFontSize(11);
      doc.setFont("NotoSans", "bold");
      doc.text(kategori.toUpperCase(), margin, currentY);
      currentY += 6;

      // Bu kategorinin tablo verilerini hazırla
      const tableData: RowInput[] = [];
      
      kategoriMalzemeleri.forEach(malzeme => {
        // Kilit PR-24 quantity ile çarpılmaz (sadece çıkış camı sayısı kadar)
        const isKilitProfil = malzeme.stokKodu === "356628_4447_0";
        const toplamMiktar = isKilitProfil ? malzeme.miktar : (malzeme.miktar * data.quantity);
        const adetGoster = isKilitProfil ? 1 : data.quantity;
        
        tableData.push([
          siraNo.toString(),
          malzeme.stokKodu,
          malzeme.aciklama,
          malzeme.olcu,
          malzeme.miktar.toString(),
          adetGoster.toString(),
          toplamMiktar.toString(),
          malzeme.birim
        ]);
        siraNo++;
      });

      // Kategori tablosunu çiz
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "S.No",
            "Stok Kodu",
            "Açıklama",
            "Ölçü",
            "Birim Miktar",
            "Adet",
            "Toplam",
            "Birim"
          ]
        ],
        body: tableData,
        theme: "grid",
        tableWidth: pageWidth - 2 * margin,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 9,
          font: "NotoSans",
          halign: "center"
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          font: "NotoSans"
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 }, // S.No
          1: { halign: "left", cellWidth: 25 },   // Stok Kodu
          2: { halign: "left", cellWidth: 45 },   // Açıklama
          3: { halign: "left", cellWidth: 30 },   // Ölçü
          4: { halign: "center", cellWidth: 20 }, // Birim Miktar
          5: { halign: "center", cellWidth: 15 }, // Adet
          6: { halign: "center", cellWidth: 20 }, // Toplam
          7: { halign: "center", cellWidth: 15 }  // Birim
        }
      });

      // Bir sonraki kategori için currentY'yi güncelle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  });

  // ========================================
  // CAM LİSTESİ TABLOSU
  // ========================================
  
  const camListesi = calculateCamListesi(
    data.kolBilgileri,
    data.totalHeight,
    data.camKalinligi,
    data.camRengi
  );
  
  // Cam rengi başlığı
  const camRengiText = camListesi.camRengi.charAt(0).toUpperCase() + camListesi.camRengi.slice(1);
  
  // Yeni sayfa gerekirse ekle
  const requiredSpaceForCamTable = 60 + (camListesi.camlar.length * 8);
  if (currentY + requiredSpaceForCamTable > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    currentY = 70;
  } else {
    currentY += 15; // Boşluk ekle
  }
  
  // Cam listesi başlığı
  doc.setFontSize(12);
  doc.setFont("NotoSans", "bold");
  doc.text(`Camlar (${camRengiText})`, margin, currentY);
  currentY += 8;
  
  // Cam listesi tablosu
  const camTableData: RowInput[] = camListesi.camlar.map(cam => [
    cam.adet.toString(),
    cam.genislik.toFixed(1),
    cam.yukseklik.toFixed(1),
    cam.kalinlik.toString()
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [["Adet", "Genişlik", "Yükseklik", "Kalınlık"]],
    body: camTableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: "NotoSans"
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      font: "NotoSans"
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 30 },  // Adet
      1: { halign: "center", cellWidth: 40 },  // Genişlik
      2: { halign: "center", cellWidth: 40 },  // Yükseklik
      3: { halign: "center", cellWidth: 30 }   // Kalınlık
    }
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentY = (doc as any).lastAutoTable.finalY + 5;
  
  // Toplam m² bilgileri
  doc.setFontSize(10);
  doc.setFont("NotoSans", "bold");
  doc.text(`Toplam m²: ${camListesi.toplamCamM2.toFixed(2)} m²`, margin, currentY);
  
  // Toplam genel m² hesaplama (tüm kolların genişlikleri toplamı × yükseklik)
  const toplamKolGenislikleri = data.kolBilgileri.reduce((sum, kol) => sum + kol.genislik, 0);
  const toplamGenelM2 = (toplamKolGenislikleri * data.totalHeight) / 1000000; // mm² -> m²
  currentY += 8;
  doc.text(`Toplam m²: ${toplamGenelM2.toFixed(2)} m²`, margin, currentY);

  // Çizim sayfasını sona ekle (varsa)
  if (data.drawingDataUrl) {
    await addDrawingPage(
      doc,
      data.offerName,
      data.pozNo,
      data.drawingDataUrl
    );
  }

  // Sayfa numarası ve footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Sayfa numarası
    doc.setFontSize(8);
    doc.setFont("NotoSans", "normal");
    doc.text(
      `Sayfa ${i} / ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" }
    );
    
    // Footer
    doc.text(
      `${data.offerName} - ${data.pozNo} - Cam Balkon Malzeme Listesi`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // PDF'i yeni sekmede aç
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}

// Tek sayfaya sığdırarak çizim ekler, yatay/düşey yönü otomatik seçer
async function addDrawingPage(
  doc: jsPDF,
  offerName: string,
  pozNo: string,
  dataUrl: string
): Promise<void> {
  // Yeni sayfa ekle
  doc.addPage();
  
  const img = new Image();
  img.src = dataUrl;

  await new Promise<void>((resolve) => {
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;

      const aspectRatio = imgWidth / imgHeight;
      const a4Width = 210; // mm
      const a4Height = 297; // mm
      const margin = 25; // Daha büyük margin (kesilme önleme)

      let targetWidth: number;
      let targetHeight: number;

      // Güvenli ölçekleme: Her zaman portrait kullan, kesilme önleme
      const availableWidth = a4Width - 2 * margin;
      const availableHeight = a4Height - 2 * margin;

      // Önce genişliğe göre ölçekle
      targetWidth = availableWidth;
      targetHeight = targetWidth / aspectRatio;

      // Eğer yükseklik sığmıyorsa, yüksekliğe göre ölçekle
      if (targetHeight > availableHeight) {
        targetHeight = availableHeight;
        targetWidth = targetHeight * aspectRatio;
      }

      // Güvenli pozisyonlama (kesilme önleme)
      const xOffset = margin + (availableWidth - targetWidth) / 2;
      const yOffset = margin + (availableHeight - targetHeight) / 2;

      doc.addImage(dataUrl, 'PNG', xOffset, yOffset, targetWidth, targetHeight);
      resolve();
    };
    img.onerror = () => {
      console.error("Failed to load drawing image for PDF.");
      resolve(); // Resolve even on error to not block PDF generation
    };
  });
}

// Cam balkon malzeme listesi PDF oluşturma yardımcı fonksiyonu
export async function generateCamBalkonPDF(
  offerName: string,
  pozNo: string,
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  camKalinligi: string,
  camRengi: string,
  renk: string,
  quantity: number = 1,
  toplamHareketliCamArasi?: number,
  toplamSabitHareketliCamArasi?: number,
  drawingDataUrl?: string
): Promise<void> {
  const data: CamBalkonPDFData = {
    offerName,
    pozNo,
    totalHeight,
    camKalinligi,
    camRengi,
    renk,
    kolBilgileri,
    quantity,
    toplamHareketliCamArasi,
    toplamSabitHareketliCamArasi,
    drawingDataUrl
  };

  await generateCamBalkonMalzemeListesiPDF(data);
}
