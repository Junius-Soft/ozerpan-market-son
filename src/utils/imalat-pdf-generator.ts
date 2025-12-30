import jsPDF from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { Offer, Position } from "@/documents/offers";
import { getProductSortConfig } from "./yalitimli-config";
import { getTypeFilters } from "./imalat-type-mapping";

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
  size?: number;
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

  public async generateImalatList(
    data: ImalatPDFData,
    selectedTypes?: string[]
  ): Promise<void> {
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
      // Aksesuarları da ekle
      if (
        position.selectedProducts?.accessories &&
        Array.isArray(position.selectedProducts.accessories)
      ) {
        position.selectedProducts.accessories.forEach((accessory) => {
          allProducts.push({ pozNo: position.pozNo, product: accessory });
        });
      }
    });

    // Tip filtreleme: selectedTypes varsa, sadece seçilen tiplere ait ürünleri göster
    let filteredProducts = allProducts;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes("preview")) {
      const allowedTypes = getTypeFilters(selectedTypes);
      filteredProducts = allProducts.filter((item) => {
        const productType = item.product.type || "";
        return allowedTypes.includes(productType);
      });
    }

    // Özel filtreleme kuralları: Seçilen tipe göre belirli ürünleri hariç tut
    if (selectedTypes && selectedTypes.length > 0) {
      filteredProducts = filteredProducts.filter((item) => {
        const productType = (item.product.type || "").toLowerCase();
        const description = (item.product.description || "").toLowerCase();
        const stockCode = (item.product.stock_code || "").toLowerCase();

        // Lamel seçildiğinde: tapa, çelik askı, zımba teli gelmesin
        if (selectedTypes.includes("Lamel")) {
          if (
            description.includes("tapa") ||
            description.includes("çelik askı") ||
            description.includes("askı") ||
            description.includes("zımba teli") ||
            description.includes("zimba teli") ||
            stockCode.includes("tapa") ||
            stockCode.includes("askı") ||
            stockCode.includes("zimba")
          ) {
            return false;
          }
        }

        // Alt Parça seçildiğinde: alt parça lastiği gelmesin
        if (selectedTypes.includes("Alt Parça")) {
          if (
            description.includes("alt parça lastiği") ||
            description.includes("alt parça lastik") ||
            stockCode.includes("lastik")
          ) {
            return false;
          }
        }

        // Kutu seçildiğinde: yan kapak gelmesin
        if (selectedTypes.includes("Kutu")) {
          if (
            description.includes("yan kapak") ||
            stockCode.includes("yan kapak")
          ) {
            return false;
          }
        }

        // Tambur seçildiğinde: boru başı ve rulman gelmesin
        if (selectedTypes.includes("Boru")) {
          if (
            description.includes("boru başı") ||
            description.includes("boru baş") ||
            description.includes("rulman") ||
            stockCode.includes("boru baş") ||
            stockCode.includes("rulman")
          ) {
            return false;
          }
        }

        return true;
      });
    }

    // Pozisyonlardan unique productId'leri al
    const uniqueProductIds = [
      ...new Set(data.positions.map((p) => p.productId).filter(Boolean)),
    ];

    // Tüm ürünlerin sıralama konfigürasyonlarını birleştir
    const typeOrder: string[] = [];
    uniqueProductIds.forEach((productId) => {
      const productSortConfig = getProductSortConfig(productId!);
      productSortConfig.forEach((type) => {
        if (!typeOrder.includes(type)) {
          typeOrder.push(type);
        }
      });
    });

    // Aynı stok koduna sahip ürünleri grupla
    type GroupedProduct = {
      pozNo: string;
      product: SelectedProduct;
      totalQuantity: number;
      pozNumbers: string[]; // Bu ürünün bulunduğu pozisyon numaraları
    };

    // Açıklamadaki pozisyon bilgilerini temizle (Sol Dikme, Sağ Dikme vb.)
    const cleanDescription = (desc: string): string => {
      return desc.replace(/\s*\([^)]*Dikme[^)]*\)\s*/g, "").trim();
    };

    // Grupla: stok kodu + temiz açıklama + ölçü (size) bazında
    const groupedProductsMap = new Map<string, GroupedProduct>();
    
    filteredProducts.forEach((item) => {
      const stockCode = item.product.stock_code || "";
      const cleanDesc = cleanDescription(item.product.description || "");
      const size = item.product.size || "";
      const key = `${stockCode}|${cleanDesc}|${size}`;
      
      const poz = data.positions.find((p) => p.pozNo === item.pozNo);
      const pozQuantity = Number(poz?.quantity ?? 1);
      const productQuantity = Number(item.product.quantity ?? 1);
      const itemTotalQuantity = productQuantity * pozQuantity;

      if (groupedProductsMap.has(key)) {
        const existing = groupedProductsMap.get(key)!;
        existing.totalQuantity += itemTotalQuantity;
        if (!existing.pozNumbers.includes(item.pozNo)) {
          existing.pozNumbers.push(item.pozNo);
        }
      } else {
        groupedProductsMap.set(key, {
          pozNo: item.pozNo,
          product: {
            ...item.product,
            description: cleanDesc,
            quantity: itemTotalQuantity,
          },
          totalQuantity: itemTotalQuantity,
          pozNumbers: [item.pozNo],
        });
      }
    });

    // Gruplanmış ürünleri array'e çevir ve sırala
    const groupedProducts = Array.from(groupedProductsMap.values());
    
    groupedProducts.sort((a, b) => {
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
    const profileData: RowInput[] = groupedProducts.map((item, i): RowInput => {
      // Gruplanmış ürünün toplam miktarını kullan
      const rawTotalQuantity = item.totalQuantity;

      // Varsayılan gösterim (ondalıklı olabilir)
      let displayQuantity = rawTotalQuantity.toString();

      // Cam balkon profilleri için imalatta adet tam sayı olmalı
      // Örn: İç içe profil, kanat profili vb. → 3.144 m yerine 4 adet
      const productType = (item.product.type || "").toLowerCase();
      type ProductWithOptionalUnit = { unit?: string };
      const unit = (item.product as ProductWithOptionalUnit).unit || "";
      const isCamBalkonProfile =
        productType.includes("cam_balkon_profiller") ||
        productType.includes("cam_balkon") && !productType.includes("aksesuar");

      if (isCamBalkonProfile && unit === "metre" && rawTotalQuantity > 0) {
        // Kesim listesinde profil adedi yukarı yuvarlanır
        // Örn: 3.144 → 4 adet (her biri 'size' uzunluğunda)
        displayQuantity = Math.ceil(rawTotalQuantity).toString();
      } else {
        // Diğer ürünler için 2 ondalık basamak
        displayQuantity = parseFloat(rawTotalQuantity.toFixed(2)).toString();
      }

      // Pozisyon numaralarını birleştir (birden fazla pozisyonda varsa)
      const pozNoDisplay = item.pozNumbers.join(", ");

      return [
        (i + 1).toString(),
        item.product.stock_code || "",
        item.product.description || "",
        item.product.size || "",
        displayQuantity,
        pozNoDisplay,
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

    // Canvas preview'larını ekle (sadece "Ürün Önizlemesi" seçiliyse)
    // Sadece panjur görselleri gösterilecek
    if (selectedTypes?.includes("preview")) {
      const panjurPositions = data.positions.filter(
        (pos) => pos.productId === "panjur"
      );
      if (panjurPositions.length > 0) {
        this.addCanvasPreviewsForPositions(panjurPositions);
      }
    }

    // Footer ekle
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addFooter(
        data.offer.id,
        data.positions[0]?.pozNo || "",
        i,
        totalPages
      );
    }

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

  private addCanvasPreviewsForPositions(positions: Position[]): void {
    // Tablonun bittiği yeri bul (autoTable'dan sonraki son y pozisyonu)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let currentY = (this.doc as any).lastAutoTable?.finalY || 150;

    // Pozisyonları 2'li gruplara böl
    const positionPairs: Position[][] = [];
    for (let i = 0; i < positions.length; i += 2) {
      positionPairs.push(positions.slice(i, i + 2));
    }

    // Canvas preview için başlık (sadece bir kez)
    const headerY = currentY + 15;
    this.doc.setFontSize(11);
    this.doc.setFont("NotoSans", "bold");
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(
      this.margin,
      headerY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );
    this.doc.text("Ürün Önizlemesi", this.margin + 2, headerY + 5);

    // Header'dan sonraki pozisyonu ayarla
    currentY = headerY + 15; // Header yüksekliği + padding

    positionPairs.forEach((pair, index) => {
      // İlk çift değilse yukarıdan spacing ekle
      if (index > 0) {
        currentY += 3; // Pozisyon çiftleri arası boşluk (azaltıldı)
      }

      // Eğer yeni satır başlangıcında sayfaya sığmıyorsa yeni sayfa ekle
      const maxImageHeight = 70; // Her zaman aynı yükseklik kullan
      const requiredHeight = maxImageHeight * 0.8 + 15 + 4; // görüntü + padding + border
      if (currentY + requiredHeight > this.pageHeight - 20) {
        this.doc.addPage();
        currentY = 20; // Yeni sayfada üstten başla
      }

      // Canvas görüntülerini ekle
      const imageY = currentY;
      const headerPadding = 2; // Header içindeki text padding'i
      const contentWidth = this.pageWidth - 2 * this.margin - 2 * headerPadding; // Header içerik genişliği
      const spacing = 6; // Görüntüler arası boşluk (artırıldı)
      const imageHeight = 70;

      // Görüntü genişliğini header içeriği ile tam hizalı olacak şekilde hesapla
      // Grid yapısını koru - tek pozisyon da sol tarafa hizalı olsun
      const imageWidth = (contentWidth - spacing) / 2;
      const leftImageX = this.margin + headerPadding;
      const rightImageX = leftImageX + imageWidth + spacing;

      // Sol görüntü (her zaman var)
      this.addSinglePositionImage(
        pair[0].canvasDataUrl || "", // Her pozisyonun kendi canvas verisini kullan
        leftImageX,
        imageY,
        imageWidth,
        imageHeight,
        pair[0]
      );

      // Sağ görüntü (varsa)
      if (pair.length > 1) {
        this.addSinglePositionImage(
          pair[1].canvasDataUrl || "", // Her pozisyonun kendi canvas verisini kullan
          rightImageX,
          imageY,
          imageWidth,
          imageHeight,
          pair[1]
        );
      }

      // Bir sonraki görüntü grubu için Y pozisyonunu güncelle
      const actualImageHeight = imageHeight * 0.7 + 3; // Görüntü yüksekliği * 0.7 + 3
      currentY = imageY + actualImageHeight; // Alt margin'i kaldır, satır arası boşluk sadece üstteki 6px olsun
    });
  }

  private addSinglePositionImage(
    canvasDataUrl: string,
    x: number,
    y: number,
    width: number,
    height: number,
    position: Position
  ): void {
    // Siyah çerçeve çiz (görüntünün bittiği yere yakın)
    const borderPadding = 2;
    const imageEndY = y + height * 0.55; // Görüntünün bittiği y pozisyonu
    const previewTopPadding = 10; // Preview başlığı ile görüntü arasındaki padding'i azalt
    const totalHeight = imageEndY - y + previewTopPadding; // Görüntünün sonuna kadar + padding
    this.doc.setDrawColor(0, 0, 0); // Siyah renk
    this.doc.setLineWidth(0.5);
    this.doc.rect(
      x - borderPadding,
      y - borderPadding,
      width + 2 * borderPadding,
      totalHeight + 2 * borderPadding
    );

    try {
      // Sol tarafta canvas görüntüsü için alan ayır - preview'ı büyüt ama sağa yapışmasın
      const imageAreaWidth = width * 0.7; // Genişliğin %70'i görüntü için
      const imageAreaX = x; // Sol kenardan biraz daha içerde başlat

      // Canvas görüntüsünü sol tarafa ekle
      this.doc.addImage(
        canvasDataUrl,
        "PNG",
        imageAreaX,
        y,
        imageAreaWidth,
        height * 0.8
      );

      // Siyah çerçevenin içinde poz ve adet bilgileri (dış çerçevenin sağ üst köşesine yapıştır)
      this.doc.setFontSize(8);
      this.doc.setFont("NotoSans", "bold");

      // Poz ve adet bilgilerini ayrı ayrı hesapla
      const pozText = `Poz: ${position.pozNo}`;
      const quantityText = `Adet: ${position.quantity}`;
      const pozWidth = this.doc.getTextWidth(pozText);
      const quantityWidth = this.doc.getTextWidth(quantityText);
      const dividerWidth = 1; // Dikey çizgi genişliği

      // Beyaz background box çiz (eşit iki bölüm + dikey çizgi) - dış çerçeveye yapıştır
      const maxTextWidth = Math.max(pozWidth, quantityWidth);
      const sectionWidth = maxTextWidth + 4; // Her bölüme 4px ekstra alan
      const totalBoxWidth = sectionWidth * 2 + dividerWidth;
      const boxX = x + width + borderPadding - totalBoxWidth; // Dış çerçeveye yapıştır
      const boxY = y - borderPadding; // Dış çerçevenin üst kenarına yapıştır
      const boxHeight = 8;

      this.doc.setFillColor(255, 255, 255); // Beyaz background
      this.doc.rect(boxX, boxY, totalBoxWidth, boxHeight, "F");

      // Siyah çerçeve çiz
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.3);
      this.doc.rect(boxX, boxY, totalBoxWidth, boxHeight);

      // Sol bölümde poz metnini yaz (ortalanmış)
      this.doc.setTextColor(0, 0, 0); // Siyah metin
      const leftSectionWidth = (totalBoxWidth - dividerWidth) / 2;
      const pozCenterX = boxX + leftSectionWidth / 2 - pozWidth / 2;
      this.doc.text(pozText, pozCenterX, boxY + 5.5);

      // Dikey ayırıcı çizgi çiz (kutunun ortasında, üst ve alt kenarlara tam temas)
      const dividerX = boxX + leftSectionWidth;
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.3);
      this.doc.line(dividerX, boxY, dividerX, boxY + boxHeight);

      // Sağ bölümde adet metnini yaz (ortalanmış)
      const rightSectionStart = dividerX + dividerWidth;
      const rightSectionWidth = leftSectionWidth;
      const quantityCenterX =
        rightSectionStart + rightSectionWidth / 2 - quantityWidth / 2;
      this.doc.text(quantityText, quantityCenterX, boxY + 5.5);

      // Pozun detay bilgileri (sağ tarafın alt kısmında)
      this.doc.setFont("NotoSans", "normal");
      this.doc.setFontSize(8);

      let detailY = y + 15; // Poz bilgilerini çizime daha yaklaştır
      const lineHeight = 6;

      // Poz detaylarını ekle (sağa yaslanmış ama biraz margin bırak)
      const infoRightEdge = x + width + borderPadding - 3; // Sağ kenardan 3px içerde

      // CAM BALKON için özel bilgi bloğu
      if (position.productId === "cam-balkon" && position.productDetails) {
        const pd = position.productDetails as Record<string, unknown> & {
          color?: string;
          renk?: string;
          kolSayisi?: number | string;
          height?: number | string;
        };

        // Renk (profil rengi)
        const renk = pd.color || pd.renk;
        if (renk) {
          const renkText = `Renk: ${renk}`;
          const renkWidth = this.doc.getTextWidth(renkText);
          this.doc.text(renkText, infoRightEdge - renkWidth, detailY);
          detailY += lineHeight;
        }

        // Seri (ürün alt tipi)
        const seri =
          pd["productSubType-katlanir"] ||
          pd["productSubType-surme"] ||
          pd["productSubType-giyotin"] ||
          pd.camBalkonType ||
          position.productName;
        if (seri) {
          const seriText = `Seri: ${seri}`;
          const seriWidth = this.doc.getTextWidth(seriText);
          this.doc.text(seriText, infoRightEdge - seriWidth, detailY);
          detailY += lineHeight;
        }

        // En (toplam kol genişliği, mm)
        const kolSayisi = Number(pd.kolSayisi || 1);
        let toplamGenislik = 0;
        for (let i = 1; i <= kolSayisi; i++) {
          const g = Number(pd[`kol${i}_genislik`] || 0);
          if (!Number.isNaN(g)) toplamGenislik += g;
        }
        if (toplamGenislik > 0) {
          const enText = `En: ${toplamGenislik} mm`;
          const enWidth = this.doc.getTextWidth(enText);
          this.doc.text(enText, infoRightEdge - enWidth, detailY);
          detailY += lineHeight;
        }

        // Boy (yükseklik, mm)
        const boy = Number(pd.height || 0);
        if (!Number.isNaN(boy) && boy > 0) {
          const boyText = `Boy: ${boy} mm`;
          const boyWidth = this.doc.getTextWidth(boyText);
          this.doc.text(boyText, infoRightEdge - boyWidth, detailY);
          detailY += lineHeight;
        }

        // Dönüş açıları (kol sayısı 1'den fazlaysa)
        const acilar: number[] = [];
        if (kolSayisi > 1) {
          for (let i = 2; i <= kolSayisi; i++) {
            const aci = Number(pd[`kol${i}_aci`] || 0);
            if (!Number.isNaN(aci) && aci !== 0) {
              acilar.push(aci);
            }
          }
        }

        if (acilar.length === 1) {
          const aciText = `Dönüş Açısı: ${acilar[0]}°`;
          const aciWidth = this.doc.getTextWidth(aciText);
          this.doc.text(aciText, infoRightEdge - aciWidth, detailY);
          detailY += lineHeight;
        } else if (acilar.length > 1) {
          acilar.forEach((aci, index) => {
            const aciText = `${index + 1}. Açı: ${aci}°`;
            const aciWidth = this.doc.getTextWidth(aciText);
            this.doc.text(aciText, infoRightEdge - aciWidth, detailY);
            detailY += lineHeight;
          });
        }
      } else {
        // DİĞER ÜRÜNLER İÇİN VAR OLAN METİN BLOĞU
        if (position.productName) {
          // Uzun isimleri kısalt
          const shortName =
            position.productName.length > 20
              ? position.productName.substring(0, 20) + "..."
              : position.productName;
          const vizonText = `VIZON: ${shortName}`;
          const vizonWidth = this.doc.getTextWidth(vizonText);
          this.doc.text(vizonText, infoRightEdge - vizonWidth, detailY);
          detailY += lineHeight;
        }

        // Hareket türü bilgisi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((position.productDetails as any)?.movementType) {
          const movementText = "Motorlu (Redüktörlü)";
          const hareketText = `Hareket: ${movementText}`;
          const hareketWidth = this.doc.getTextWidth(hareketText);
          this.doc.text(hareketText, infoRightEdge - hareketWidth, detailY);
          detailY += lineHeight;
        }

        // Motor markası (eğer motorlu ise)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((position.productDetails as any)?.motorMarka) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const motorText = ((position.productDetails as any).motorMarka as string).toUpperCase();
          const fullMotorText = `Motor: ${motorText}`;
          const motorWidth = this.doc.getTextWidth(fullMotorText);
          this.doc.text(fullMotorText, infoRightEdge - motorWidth, detailY);
          detailY += lineHeight;
        }
      }
    } catch {
      // Görüntü eklenemezse hata mesajı yazdır
      this.doc.setFontSize(10);
      this.doc.setFont("NotoSans", "normal");
      this.doc.text("Görüntü yüklenemedi", x + 5, y + 20);

      // Pozisyon bilgilerini yine de ekle (beyaz kutuda, dikey çizgili)
      this.doc.setFontSize(8);
      this.doc.setFont("NotoSans", "bold");

      // Poz ve adet bilgilerini ayrı ayrı hesapla
      const pozText = `Poz: ${position.pozNo}`;
      const quantityText = `Adet: ${position.quantity}`;
      const pozWidth = this.doc.getTextWidth(pozText);
      const quantityWidth = this.doc.getTextWidth(quantityText);
      const dividerWidth = 1; // Dikey çizgi genişliği

      // Beyaz background box çiz (eşit iki bölüm + dikey çizgi) - dış çerçeveye yapıştır
      const maxTextWidth = Math.max(pozWidth, quantityWidth);
      const sectionWidth = maxTextWidth + 4; // Her bölüme 4px ekstra alan
      const totalBoxWidth = sectionWidth * 2 + dividerWidth;
      const boxX = x + width + borderPadding - totalBoxWidth; // Dış çerçeveye yapıştır
      const boxY = y - borderPadding; // Dış çerçevenin üst kenarına yapıştır
      const boxHeight = 8;

      this.doc.setFillColor(255, 255, 255); // Beyaz background
      this.doc.rect(boxX, boxY, totalBoxWidth, boxHeight, "F");

      // Siyah çerçeve çiz
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.3);
      this.doc.rect(boxX, boxY, totalBoxWidth, boxHeight);

      // Sol bölümde poz metnini yaz (ortalanmış)
      this.doc.setTextColor(0, 0, 0); // Siyah metin
      const leftSectionWidth = (totalBoxWidth - dividerWidth) / 2;
      const pozCenterX = boxX + leftSectionWidth / 2 - pozWidth / 2;
      this.doc.text(pozText, pozCenterX, boxY + 5.5);

      // Dikey ayırıcı çizgi çiz (kutunun ortasında, üst ve alt kenarlara tam temas)
      const dividerX = boxX + leftSectionWidth;
      this.doc.setDrawColor(0, 0, 0);
      this.doc.setLineWidth(0.3);
      this.doc.line(dividerX, boxY, dividerX, boxY + boxHeight);

      // Sağ bölümde adet metnini yaz (ortalanmış)
      const rightSectionStart = dividerX + dividerWidth;
      const rightSectionWidth = leftSectionWidth;
      const quantityCenterX =
        rightSectionStart + rightSectionWidth / 2 - quantityWidth / 2;
      this.doc.text(quantityText, quantityCenterX, boxY + 5.5);

      // CAM BALKON için yan bilgi bloğu (görüntü yokken de göster)
      this.doc.setFont("NotoSans", "normal");
      this.doc.setFontSize(8);

      let detailY = y + 25;
      const lineHeight = 6;
      const infoRightEdge = x + width + borderPadding - 3;

      if (position.productId === "cam-balkon" && position.productDetails) {
        const pd = position.productDetails as Record<string, unknown> & {
          color?: string;
          renk?: string;
          kolSayisi?: number | string;
          height?: number | string;
        };

        const renk = pd.color || pd.renk;
        if (renk) {
          const renkText = `Renk: ${renk}`;
          const renkWidth = this.doc.getTextWidth(renkText);
          this.doc.text(renkText, infoRightEdge - renkWidth, detailY);
          detailY += lineHeight;
        }

        const seri =
          pd["productSubType-katlanir"] ||
          pd["productSubType-surme"] ||
          pd["productSubType-giyotin"] ||
          pd.camBalkonType ||
          position.productName;
        if (seri) {
          const seriText = `Seri: ${seri}`;
          const seriWidth = this.doc.getTextWidth(seriText);
          this.doc.text(seriText, infoRightEdge - seriWidth, detailY);
          detailY += lineHeight;
        }

        const kolSayisi = Number(pd.kolSayisi || 1);
        let toplamGenislik = 0;
        for (let i = 1; i <= kolSayisi; i++) {
          const g = Number(pd[`kol${i}_genislik`] || 0);
          if (!Number.isNaN(g)) toplamGenislik += g;
        }
        if (toplamGenislik > 0) {
          const enText = `En: ${toplamGenislik} mm`;
          const enWidth = this.doc.getTextWidth(enText);
          this.doc.text(enText, infoRightEdge - enWidth, detailY);
          detailY += lineHeight;
        }

        const boy = Number(pd.height || 0);
        if (!Number.isNaN(boy) && boy > 0) {
          const boyText = `Boy: ${boy} mm`;
          const boyWidth = this.doc.getTextWidth(boyText);
          this.doc.text(boyText, infoRightEdge - boyWidth, detailY);
          detailY += lineHeight;
        }

        const acilar: number[] = [];
        if (kolSayisi > 1) {
          for (let i = 2; i <= kolSayisi; i++) {
            const aci = Number(pd[`kol${i}_aci`] || 0);
            if (!Number.isNaN(aci) && aci !== 0) {
              acilar.push(aci);
            }
          }
        }

        if (acilar.length === 1) {
          const aciText = `Dönüş Açısı: ${acilar[0]}°`;
          const aciWidth = this.doc.getTextWidth(aciText);
          this.doc.text(aciText, infoRightEdge - aciWidth, detailY);
        } else if (acilar.length > 1) {
          acilar.forEach((aci, index) => {
            const aciText = `${index + 1}. Açı: ${aci}°`;
            const aciWidth = this.doc.getTextWidth(aciText);
            this.doc.text(aciText, infoRightEdge - aciWidth, detailY);
            detailY += lineHeight;
          });
        }
      }
    }
  }

  private addCanvasPreview(canvasDataUrl: string): void {
    // Tablonun bittiği yeri bul (autoTable'dan sonraki son y pozisyonu)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (this.doc as any).lastAutoTable?.finalY || 150;

    // Canvas preview için başlık
    const previewY = finalY + 15;
    this.doc.setFontSize(11);
    this.doc.setFont("NotoSans", "bold");
    this.doc.setFillColor(230, 230, 230);
    this.doc.rect(
      this.margin,
      previewY,
      this.pageWidth - 2 * this.margin,
      8,
      "F"
    );
    this.doc.text("Ürün Önizlemesi", this.margin + 2, previewY + 5);

    // Canvas görüntüsünü ekle
    const imageY = previewY + 15;
    const availableWidth = this.pageWidth - 2 * this.margin;
    const maxImageWidth = Math.min(availableWidth, 120); // Max genişlik 120mm
    const maxImageHeight = 80; // Max yükseklik 80mm

    // Görüntüyü ortala
    const imageX = this.margin + (availableWidth - maxImageWidth) / 2;

    try {
      this.doc.addImage(
        canvasDataUrl,
        "PNG",
        imageX,
        imageY,
        maxImageWidth,
        maxImageHeight
      );
    } catch {
      // Görüntü eklenemezse hata mesajı yazdır
      this.doc.setFontSize(10);
      this.doc.setFont("NotoSans", "normal");
      this.doc.text("Görüntü yüklenemedi", imageX, imageY + 20);
    }
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
            product.size ? `${product.size}mm` : "", // Ürün ölçüsü varsa göster
            "0,0/0,0", // Sol/Sağ Açı default
            product.quantity?.toString() || "1",
            "☐", // Ok sütunu: boş checkbox
          ]);
        });
      }
      // Aksesuarları da ekle
      if (
        position.selectedProducts?.accessories &&
        Array.isArray(position.selectedProducts.accessories)
      ) {
        const pozQuantity = Number(position.quantity ?? 1);
        position.selectedProducts.accessories.forEach((accessory) => {
          const accessoryQuantity = Number(accessory.quantity ?? 1);
          const totalQuantityRaw = accessoryQuantity * pozQuantity;
          const totalQuantity = parseFloat(totalQuantityRaw.toFixed(2)).toString();
          profileData.push([
            (profileData.length + 1).toString(),
            accessory.stock_code || "",
            accessory.description || "",
            accessory.size ? `${accessory.size}mm` : "", // Aksesuar ölçüsü varsa göster
            "0,0/0,0", // Sol/Sağ Açı default
            totalQuantity,
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
  selectedPositions: Position[],
  selectedTypes?: string[]
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

  await generator.generateImalatList(data, selectedTypes);
}

// Export function for use in offer-utils
export async function openImalatListPDFMulti(
  offer: Offer,
  positions: Position[],
  selectedTypes?: string[]
): Promise<void> {
  await generateImalatListPDF(offer, positions, selectedTypes);
}
