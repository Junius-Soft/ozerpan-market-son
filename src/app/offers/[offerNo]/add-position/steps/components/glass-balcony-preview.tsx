"use client";

import { useCallback, useEffect, useRef, useMemo, memo, useState } from "react";
import { 
  calculateTurnPiece, 
  getProfileDimensions, 
  createPanels, 
  calculateHareketliCamArasi, 
  calculateSabitHareketliCamArasi
} from "@/utils/cam-balkon-calculations";

interface GlassBalconyPreviewProps {
  width: number;
  height: number;
  className?: string;
  color?: string;
  altRayProfili?: string;
  camKalinligi?: string;
  camRengi?: string;
  conta?: string;
  kasaUzatma?: string;
  // PDF için gerekli bilgiler
  offerName?: string;
  pozNo?: string;
  quantity?: number;
  // Hareketli cam arası hesaplama callback'i
  onHareketliCamArasiHesapla?: (toplamAralik: number) => void;
  // Sabit cam - Hareketli cam arası hesaplama callback'i
  onSabitHareketliCamArasiHesapla?: (toplamAralik: number) => void;
  // Kol bilgileri
  kolSayisi?: number;
  kol1_genislik?: number;
  kol1_kanat?: number;
  kol1_cikis_sayisi?: number;
  kol1_cikis_yonu?: string; // "sag" veya "sol"
  kol1_sola_kanat?: number; // Sola kanat sayısı
  kol1_sabitCamAdedi?: number; // Sabit cam adedi
  kol1_sabitCamGenisligi?: number; // Sabit cam genişliği
  kol1_sabitCamYonu?: string; // "sag" veya "sol"
  kol2_genislik?: number;
  kol2_aci?: number; // 2. Kol açısı (derece)
  kol2_kanat?: number;
  kol2_cikis_sayisi?: number;
  kol2_cikis_yonu?: string;
  kol2_sola_kanat?: number; // Sola kanat sayısı
  kol2_sabitCamAdedi?: number; // Sabit cam adedi
  kol2_sabitCamGenisligi?: number; // Sabit cam genişliği
  kol2_sabitCamYonu?: string; // "sag" veya "sol"
  kol3_genislik?: number;
  kol3_aci?: number; // 3. Kol açısı (derece)
  kol3_kanat?: number;
  kol3_cikis_sayisi?: number;
  kol3_cikis_yonu?: string;
  kol3_sola_kanat?: number; // Sola kanat sayısı
  kol3_sabitCamAdedi?: number; // Sabit cam adedi
  kol3_sabitCamGenisligi?: number; // Sabit cam genişliği
  kol3_sabitCamYonu?: string; // "sag" veya "sol"
  kol4_genislik?: number;
  kol4_aci?: number; // 4. Kol açısı (derece)
  kol4_kanat?: number;
  kol4_cikis_sayisi?: number;
  kol4_cikis_yonu?: string;
  kol4_sola_kanat?: number; // Sola kanat sayısı
  kol4_sabitCamAdedi?: number; // Sabit cam adedi
  kol4_sabitCamGenisligi?: number; // Sabit cam genişliği
  kol4_sabitCamYonu?: string; // "sag" veya "sol"
  kol5_genislik?: number;
  kol5_aci?: number; // 5. Kol açısı (derece)
  kol5_kanat?: number;
  kol5_cikis_sayisi?: number;
  kol5_cikis_yonu?: string;
  kol5_sola_kanat?: number; // Sola kanat sayısı
  kol5_sabitCamAdedi?: number; // Sabit cam adedi
  kol5_sabitCamGenisligi?: number; // Sabit cam genişliği
  kol5_sabitCamYonu?: string; // "sag" veya "sol"
}



// Ok işareti çizme fonksiyonu - Net ve ok şeklinde
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: "left" | "right",
  color: string
) {
  // Net ok boyutları
  const arrowLength = 20; // Ok gövdesi uzunluğu
  const arrowHeadSize = 8; // Ok başı boyutu
  const lineWidth = 3; // Daha kalın çizgi
  
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([]);
  
  // Keskin köşeler için
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  
  if (direction === "left") {
    // Sola doğru net ok
    // Ok gövdesi
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - arrowLength, y);
    ctx.stroke();
    
    // Ok başı - keskin üçgen (sola doğru işaret ediyor)
    ctx.beginPath();
    ctx.moveTo(x - arrowLength, y);
    ctx.lineTo(x - arrowLength + arrowHeadSize, y - arrowHeadSize);
    ctx.lineTo(x - arrowLength + arrowHeadSize, y + arrowHeadSize);
    ctx.closePath();
    ctx.fill();
    
  } else {
    // Sağa doğru net ok
    // Ok gövdesi
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + arrowLength, y);
    ctx.stroke();
    
    // Ok başı - keskin üçgen (sağa doğru işaret ediyor)
    ctx.beginPath();
    ctx.moveTo(x + arrowLength, y);
    ctx.lineTo(x + arrowLength - arrowHeadSize, y - arrowHeadSize);
    ctx.lineTo(x + arrowLength - arrowHeadSize, y + arrowHeadSize);
    ctx.closePath();
    ctx.fill();
  }
}





function GlassBalconyPreviewComponent({
  width = 1000,
  height = 1000,
  color,
  altRayProfili,
  camKalinligi,
  camRengi,
  conta,
  kasaUzatma,
  onHareketliCamArasiHesapla,
  onSabitHareketliCamArasiHesapla,
  kolSayisi = 1,
  kol1_genislik = 1000,
  kol1_kanat = 1,
  kol1_cikis_sayisi = 0,
  kol1_cikis_yonu = "sol",
  kol1_sola_kanat = 0,
  kol1_sabitCamAdedi = 0,
  kol1_sabitCamGenisligi = 0,
  kol1_sabitCamYonu = "sag",
  kol2_genislik = 1000,
  kol2_aci = 90,
  kol2_kanat = 1,
  kol2_cikis_sayisi = 0,
  kol2_cikis_yonu = "sag",
  kol2_sola_kanat = 0,
  kol2_sabitCamAdedi = 0,
  kol2_sabitCamGenisligi = 0,
  kol2_sabitCamYonu = "sag",
  kol3_genislik = 1000,
  kol3_aci = 90,
  kol3_kanat = 1,
  kol3_cikis_sayisi = 0,
  kol3_cikis_yonu = "sag",
  kol3_sola_kanat = 0,
  kol3_sabitCamAdedi = 0,
  kol3_sabitCamGenisligi = 0,
  kol3_sabitCamYonu = "sag",
  kol4_genislik = 1000,
  kol4_aci = 90,
  kol4_kanat = 1,
  kol4_cikis_sayisi = 0,
  kol4_cikis_yonu = "sag",
  kol4_sola_kanat = 0,
  kol4_sabitCamAdedi = 0,
  kol4_sabitCamGenisligi = 0,
  kol4_sabitCamYonu = "sag",
  kol5_genislik = 1000,
  kol5_aci = 90,
  kol5_kanat = 1,
  kol5_cikis_sayisi = 0,
  kol5_cikis_yonu = "sag",
  kol5_sola_kanat = 0,
  kol5_sabitCamAdedi = 0,
  kol5_sabitCamGenisligi = 0,
  kol5_sabitCamYonu = "sag",
}: GlassBalconyPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastHareketliCamArasi, setLastHareketliCamArasi] = useState<number | null>(null);
  const [lastSabitHareketliCamArasi, setLastSabitHareketliCamArasi] = useState<number | null>(null);


  // Memoize kol bilgilerini toplu olarak
  const kolBilgileri = useMemo(() => {
    const kol1Genislik = Number(kol1_genislik) || 0;
    const kol1Kanat = Number(kol1_kanat) || 1;
    const kol1CikisSayisi = Number(kol1_cikis_sayisi) || 0;
    const kol1CikisYonu = kol1_cikis_yonu || "sol";
    const kol1SolaKanat = Number(kol1_sola_kanat) || 0;
    const kol1SabitCamAdedi = Number(kol1_sabitCamAdedi) || 0;
    const kol1SabitCamGenisligi = Number(kol1_sabitCamGenisligi) || 0;
    const kol1SabitCamYonu = kol1_sabitCamYonu || "sag";
    

    
    return {
      kolSayisi: Number(kolSayisi) || 1,
      kol1: {
        genislik: kol1Genislik,
        kanat: kol1Kanat,
        cikis_sayisi: kol1CikisSayisi,
        cikis_yonu: kol1CikisYonu,
        sola_kanat: kol1SolaKanat,
        sabitCamAdedi: kol1SabitCamAdedi,
        sabitCamGenisligi: kol1SabitCamGenisligi,
        sabitCamYonu: kol1SabitCamYonu,
      },
      kol2: {
        genislik: Number(kol2_genislik) || 0,
        kanat: Number(kol2_kanat) || 1,
        cikis_sayisi: Number(kol2_cikis_sayisi) || 0,
        cikis_yonu: kol2_cikis_yonu || "sag",
        sola_kanat: Number(kol2_sola_kanat) || 0,
        sabitCamAdedi: Number(kol2_sabitCamAdedi) || 0,
        sabitCamGenisligi: Number(kol2_sabitCamGenisligi) || 0,
        sabitCamYonu: kol2_sabitCamYonu || "sag",
        aci: Number(kol2_aci) || 0,
      },
      kol3: {
        genislik: Number(kol3_genislik) || 0,
        kanat: Number(kol3_kanat) || 1,
        cikis_sayisi: Number(kol3_cikis_sayisi) || 0,
        cikis_yonu: kol3_cikis_yonu || "sag",
        sola_kanat: Number(kol3_sola_kanat) || 0,
        sabitCamAdedi: Number(kol3_sabitCamAdedi) || 0,
        sabitCamGenisligi: Number(kol3_sabitCamGenisligi) || 0,
        sabitCamYonu: kol3_sabitCamYonu || "sag",
        aci: Number(kol3_aci) || 0,
      },
      kol4: {
        genislik: Number(kol4_genislik) || 0,
        kanat: Number(kol4_kanat) || 1,
        cikis_sayisi: Number(kol4_cikis_sayisi) || 0,
        cikis_yonu: kol4_cikis_yonu || "sag",
        sola_kanat: Number(kol4_sola_kanat) || 0,
        sabitCamAdedi: Number(kol4_sabitCamAdedi) || 0,
        sabitCamGenisligi: Number(kol4_sabitCamGenisligi) || 0,
        sabitCamYonu: kol4_sabitCamYonu || "sag",
        aci: Number(kol4_aci) || 0,
      },
      kol5: {
        genislik: Number(kol5_genislik) || 0,
        kanat: Number(kol5_kanat) || 1,
        cikis_sayisi: Number(kol5_cikis_sayisi) || 0,
        cikis_yonu: kol5_cikis_yonu || "sag",
        sola_kanat: Number(kol5_sola_kanat) || 0,
        sabitCamAdedi: Number(kol5_sabitCamAdedi) || 0,
        sabitCamGenisligi: Number(kol5_sabitCamGenisligi) || 0,
        sabitCamYonu: kol5_sabitCamYonu || "sag",
        aci: Number(kol5_aci) || 0,
      },
    };
  }, [
    kolSayisi, kol1_genislik, kol1_kanat, kol1_cikis_sayisi, kol1_cikis_yonu, kol1_sola_kanat, kol1_sabitCamAdedi, kol1_sabitCamGenisligi, kol1_sabitCamYonu,
    kol2_genislik, kol2_aci, kol2_kanat, kol2_cikis_sayisi, kol2_cikis_yonu, kol2_sola_kanat, kol2_sabitCamAdedi, kol2_sabitCamGenisligi, kol2_sabitCamYonu,
    kol3_genislik, kol3_aci, kol3_kanat, kol3_cikis_sayisi, kol3_cikis_yonu, kol3_sola_kanat, kol3_sabitCamAdedi, kol3_sabitCamGenisligi, kol3_sabitCamYonu,
    kol4_genislik, kol4_aci, kol4_kanat, kol4_cikis_sayisi, kol4_cikis_yonu, kol4_sola_kanat, kol4_sabitCamAdedi, kol4_sabitCamGenisligi, kol4_sabitCamYonu,
    kol5_genislik, kol5_aci, kol5_kanat, kol5_cikis_sayisi, kol5_cikis_yonu, kol5_sola_kanat, kol5_sabitCamAdedi, kol5_sabitCamGenisligi, kol5_sabitCamYonu,
  ]);

  // Memoize diğer props'ları
  const otherProps = useMemo(() => ({
    color,
    altRayProfili,
    camKalinligi,
    camRengi,
    conta,
    kasaUzatma,
    kol2_aci,
  }), [color, altRayProfili, camKalinligi, camRengi, conta, kasaUzatma, kol2_aci]);


  // Sabit cam bilgilerini al
  const getSabitCamInfo = useCallback((kolIndex: number): {
    adet: number;
    genislik: number;
    yon: string;
  } => {
    let adet = 0;
    let genislik = 0;
    let yon = "sag";
    
    switch (kolIndex) {
      case 1:
        adet = kolBilgileri.kol1.sabitCamAdedi;
        genislik = kolBilgileri.kol1.sabitCamGenisligi;
        yon = kolBilgileri.kol1.sabitCamYonu;
        break;
      case 2:
        adet = kolBilgileri.kol2.sabitCamAdedi;
        genislik = kolBilgileri.kol2.sabitCamGenisligi;
        yon = kolBilgileri.kol2.sabitCamYonu;
        break;
      case 3:
        adet = kolBilgileri.kol3.sabitCamAdedi;
        genislik = kolBilgileri.kol3.sabitCamGenisligi;
        yon = kolBilgileri.kol3.sabitCamYonu;
        break;
      case 4:
        adet = kolBilgileri.kol4.sabitCamAdedi;
        genislik = kolBilgileri.kol4.sabitCamGenisligi;
        yon = kolBilgileri.kol4.sabitCamYonu;
        break;
      case 5:
        adet = kolBilgileri.kol5.sabitCamAdedi;
        genislik = kolBilgileri.kol5.sabitCamGenisligi;
        yon = kolBilgileri.kol5.sabitCamYonu;
        break;
    }
    
    return { adet, genislik, yon };
  }, [kolBilgileri]);

  // Cam balkon çizim fonksiyonu - Simple.js mantığıyla yeniden yazıldı
  const drawGlassBalcony = useCallback(
    (
      canvas: HTMLCanvasElement,
      width: number,
      height: number,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      // Profil boyutlarını al - kolAci parametresini de geç
      const profileDimensions = getProfileDimensions(otherProps.camKalinligi, otherProps.kol2_aci);

      // Renk seçimini al ve tüm profillerde uygula
      const getProfileColor = (colorValue?: string): string => {
        if (!colorValue) return "#A1A1A1"; // Varsayılan gri
        
        // Renk değerini normalize et
        const normalizedColor = colorValue.toLowerCase().trim();
        
        
        // Cam balkon için renk eşleştirmeleri (data/product-tabs.json'dan)
        switch (normalizedColor) {
          // Cam balkon renk seçenekleri
          case "natural-eloksal":
            return "#C0C0C0"; // Gümüş rengi
          case "titan":
            return "#8B8B8B"; // Titan rengi
          case "vizon":
            return "#A89F91"; // Vizon rengi
          case "antrasit-gri":
            return "#4B4B4B"; // Antrasit gri
          case "siyah":
            return "#2F2F2F"; // Siyah
          case "altin-mese":
            return "#D1B48C"; // Altın meşe
            
          // Diğer ürünlerden gelen renkler (uyumluluk için)
          case "beyaz":
            return "#FFFFFF";
          case "kül_siyahı":
            return "#696969";
          case "gri":
          case "ral_7016":
            return "#4B4B4B";
          case "açık_gri":
          case "ral_7035":
            return "#7D7D7D";
          case "kahverengi":
            return "#7B4B3A";
          case "krem":
            return "#E6D8C9";
          case "altın_meşe":
            return "#D1B48C";
          case "fındık":
            return "#8B5B29";
          case "açık_bej":
            return "#F5F5DC";
          case "koyu_bej":
            return "#D2B48C";
          case "açık_bronz":
            return "#CD853F";
          case "ral_boyalı":
            return "#A1A1A1"; // Varsayılan RAL rengi
          default:
            // Eğer hex renk kodu ise direkt kullan
            if (colorValue.startsWith("#")) {
              return colorValue;
            }
            return "#A1A1A1"; // Varsayılan gri
        }
      };

      const profileColor = getProfileColor(otherProps.color);

      // Renkleri tema ve props'a göre tanımla
      const colors = {
        frame: profileColor,
        glass: otherProps.camRengi === "seffaf" ? "rgba(208, 226, 242, 0.8)" : 
               otherProps.camRengi === "fume" ? "rgba(47, 79, 79, 0.9)" :
               otherProps.camRengi === "bronz" ? "rgba(205, 133, 63, 0.9)" :
               otherProps.camRengi === "yesil" ? "rgba(34, 139, 34, 0.9)" :
               otherProps.camRengi === "mavi" ? "rgba(30, 144, 255, 0.9)" :
               "rgba(240, 248, 255, 0.7)",
        glassBorder: otherProps.camRengi === "seffaf" ? "#000000" : 
                    otherProps.camRengi === "fume" ? "#2f4f4f" :
                    otherProps.camRengi === "bronz" ? "#cd853f" :
                    otherProps.camRengi === "yesil" ? "#228b22" :
                    otherProps.camRengi === "mavi" ? "#1e90ff" :
                    "#b8c5d6",
        text: profileColor,
        background: profileColor,
        altRay: profileColor,
        profile: profileColor, // Yatay kasa profilleri
        verticalProfile: profileColor, // Düşey kasa profilleri
        rayProfile: profileColor, // Ray profilleri
        kanatProfile: profileColor, // Kanat profilleri
        fixedGlass: "#aee", // Sabit cam rengi
        exitGlass: "#eaa", // Çıkış camı rengi
        slidingGlass: "#eee", // Hareketli cam rengi
      };

      // Canvas'ı temizle ve şeffaf arka plan bırak
      ctx.clearRect(0, 0, canvas.width, canvas.height);


              // ========================================
              // ÖLÇEKLENDİRME VE TEMEL HESAPLAMALAR
              // ========================================

      // Güvenli ölçeklendirme - kesilme önleme
      const padding = 10; // Güvenli padding (kesilme önleme)
      const availableWidth = canvasWidth - (padding * 2);
      const availableHeight = canvasHeight - (padding * 2);

      // Tüm kol genişliklerini topla
      const actualKolSayisi = kolBilgileri.kolSayisi;
      let totalKolWidth = 0;
      for (let i = 1; i <= actualKolSayisi; i++) {
        let kolGenislik = 0;
        switch (i) {
          case 1: kolGenislik = kolBilgileri.kol1.genislik; break;
          case 2: kolGenislik = kolBilgileri.kol2.genislik; break;
          case 3: kolGenislik = kolBilgileri.kol3.genislik; break;
          case 4: kolGenislik = kolBilgileri.kol4.genislik; break;
          case 5: kolGenislik = kolBilgileri.kol5.genislik; break;
        }
        totalKolWidth += kolGenislik;
      }
      
      // Eğer toplam genişlik 0 ise, varsayılan değer kullan
      if (totalKolWidth === 0) {
        totalKolWidth = width;
      }

      // Güvenli ölçeklendirme - kesilme önleme
      const scaleX = availableWidth / totalKolWidth;
      const scaleY = availableHeight / height;
      
      // Her iki boyuta da sığacak şekilde ölçekle (kesilme önleme)
      let scale = Math.min(scaleX, scaleY);
      
      // Minimum ölçek kontrolü (çok küçük kalmasın)
      const minScale = 0.1;
      scale = Math.max(scale, minScale);

      const finalWidth = totalKolWidth * scale;
      const finalHeight = height * scale;
      const x = padding + (availableWidth - finalWidth) / 2;
      const y = padding + (availableHeight - finalHeight) / 2;

      
      // ========================================
      // KOL ÇİZİM DÖNGÜSÜ (Simple.js mantığı)
      // ========================================
      
      // Her kol için ayrı çizim yap
      let currentX = x;
      let toplamHareketliCamArasi = 0; // Toplam hareketli cam arası
      let toplamSabitHareketliCamArasi = 0; // Toplam sabit-hareketli cam arası

      
      // ========================================
      // DÖNÜŞ PARÇASI HESAPLAMALARI
      // ========================================
      
      // 2. kol ve sonrası için dönüş parçası hesaplamaları
      const turnPieces: Record<string, number> = {};
      
      if (actualKolSayisi >= 2) {
        const kol2Aci = kolBilgileri.kol2.aci;
        const A2 = calculateTurnPiece(kol2Aci);
        turnPieces.A2 = A2;
      }
      
      if (actualKolSayisi >= 3) {
        const kol3Aci = kolBilgileri.kol3.aci;
        const A3 = calculateTurnPiece(kol3Aci);
        turnPieces.A3 = A3;
      }
      
      if (actualKolSayisi >= 4) {
        const kol4Aci = kolBilgileri.kol4.aci;
        const A4 = calculateTurnPiece(kol4Aci);
        turnPieces.A4 = A4;
      }
      
      if (actualKolSayisi >= 5) {
        const kol5Aci = kolBilgileri.kol5.aci;
        const A5 = calculateTurnPiece(kol5Aci);
        turnPieces.A5 = A5;
      }
      
      
      // ========================================
      // KOL ÇİZİM DÖNGÜSÜ
      // ========================================
      
      for (let kolIndex = 1; kolIndex <= actualKolSayisi; kolIndex++) {
        // Kol bilgilerini al
        let kolGenislik = 0;
        let kolKanat = 1;
        let kolCikisSayisi = 0;
        let kolCikisYonu = "sag";
        let kolSolaKanat = 0;
        
        switch (kolIndex) {
          case 1:
            kolGenislik = kolBilgileri.kol1.genislik;
            kolKanat = kolBilgileri.kol1.kanat;
            kolCikisSayisi = kolBilgileri.kol1.cikis_sayisi;
            kolCikisYonu = kolBilgileri.kol1.cikis_yonu;
            kolSolaKanat = kolBilgileri.kol1.sola_kanat;
            break;
          case 2:
            kolGenislik = kolBilgileri.kol2.genislik;
            kolKanat = kolBilgileri.kol2.kanat;
            kolCikisSayisi = kolBilgileri.kol2.cikis_sayisi;
            kolCikisYonu = kolBilgileri.kol2.cikis_yonu;
            kolSolaKanat = kolBilgileri.kol2.sola_kanat;
            break;
          case 3:
            kolGenislik = kolBilgileri.kol3.genislik;
            kolKanat = kolBilgileri.kol3.kanat;
            kolCikisSayisi = kolBilgileri.kol3.cikis_sayisi;
            kolCikisYonu = kolBilgileri.kol3.cikis_yonu;
            kolSolaKanat = kolBilgileri.kol3.sola_kanat;
            break;
          case 4:
            kolGenislik = kolBilgileri.kol4.genislik;
            kolKanat = kolBilgileri.kol4.kanat;
            kolCikisSayisi = kolBilgileri.kol4.cikis_sayisi;
            kolCikisYonu = kolBilgileri.kol4.cikis_yonu;
            kolSolaKanat = kolBilgileri.kol4.sola_kanat;
            break;
          case 5:
            kolGenislik = kolBilgileri.kol5.genislik;
            kolKanat = kolBilgileri.kol5.kanat;
            kolCikisSayisi = kolBilgileri.kol5.cikis_sayisi;
            kolCikisYonu = kolBilgileri.kol5.cikis_yonu;
            kolSolaKanat = kolBilgileri.kol5.sola_kanat;
            break;
        }

        // Eğer kol genişliği 0 ise, bu kolu atla
        if (kolGenislik === 0) {
          continue;
        }
        
        // Kol genişliğini ölçekle
        const kolScaledWidth = (kolGenislik / totalKolWidth) * finalWidth;
        
        
        // ========================================
        // SIMPLE.JS MANTIĞI: PANEL DİZİSİ OLUŞTURMA
        // ========================================
        
        // Sabit cam bilgilerini al
        const sabitCamInfo = getSabitCamInfo(kolIndex);
        
        // Kendi kolun açısını al (sol profil için)
        let leftKolAci: number | undefined = undefined;
        switch (kolIndex) {
          case 1: 
            leftKolAci = undefined; // 1. kol için default değer kullan
            break;
          case 2: 
            leftKolAci = kolBilgileri.kol2.aci; 
            break;
          case 3: 
            leftKolAci = kolBilgileri.kol3.aci; 
            break;
          case 4: 
            leftKolAci = kolBilgileri.kol4.aci; 
            break;
          case 5: 
            leftKolAci = kolBilgileri.kol5.aci; 
            break;
        }
        
        // Sonraki kol açısını al (sağ profil için)
        let rightKolAci: number | undefined = undefined;
        if (kolIndex < actualKolSayisi) {
          switch (kolIndex + 1) {
            case 2: rightKolAci = kolBilgileri.kol2.aci; break;
            case 3: rightKolAci = kolBilgileri.kol3.aci; break;
            case 4: rightKolAci = kolBilgileri.kol4.aci; break;
            case 5: rightKolAci = kolBilgileri.kol5.aci; break;
          }
        }
        
        
        // Panel dizisini oluştur
        const panels = createPanels(
          kolGenislik,
          height,
          profileDimensions,
          kolIndex,
          actualKolSayisi,
          kolKanat,
          kolCikisSayisi,
          kolCikisYonu,
          sabitCamInfo.adet,
          sabitCamInfo.genislik,
          sabitCamInfo.yon,
          leftKolAci,
          rightKolAci
        );
        
        
        // Hareketli cam arası hesapla
        const hareketliCamArasi = calculateHareketliCamArasi(panels);
        toplamHareketliCamArasi += hareketliCamArasi;
        
        // Sabit-Hareketli cam arası hesapla
        const sabitHareketliCamArasi = calculateSabitHareketliCamArasi(panels);
        toplamSabitHareketliCamArasi += sabitHareketliCamArasi;
        
        // ========================================
        // SIMPLE.JS MANTIĞI: KASA PROFİLLERİ ÇİZİMİ
        // ========================================
        
        // Profil sabitleri
        const bottomTopProfile = 63.5; // Üst/alt kasa profili yüksekliği
        const wingRail = 32.5; // Kanat profili yüksekliği
        
        // Sol profil genişliğini dinamik olarak hesapla (kendi kolun açısından)
        // İlk kol için sol profil genişliği sabit 25mm
        const leftSideProfile = kolIndex === 1 ? 25 : (
          leftKolAci && leftKolAci !== 0
            ? 16 + calculateTurnPiece(leftKolAci) // 16mm + dönüş parçası
            : 25 // Normal profil genişliği
        );
        
        // Sağ profil genişliğini dinamik olarak hesapla (sonraki kolun açısından)
        // Sadece son kol için sağ profil genişliği sabit 25mm
        const rightSideProfile = kolIndex === actualKolSayisi ? 25 : (
          rightKolAci && rightKolAci !== 0
            ? 16 + calculateTurnPiece(rightKolAci) // 16mm + dönüş parçası
            : 25 // Normal profil genişliği
        );
        
        
        
        // Ölçeklendirme
        const scale = kolScaledWidth / kolGenislik;
        
        // Alt kasa profili
        ctx.fillStyle = colors.profile;
        ctx.fillRect(
          currentX, 
          y + finalHeight - bottomTopProfile * scale, 
          kolScaledWidth, 
          bottomTopProfile * scale
        );
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1;
        ctx.strokeRect(
          currentX, 
          y + finalHeight - bottomTopProfile * scale, 
          kolScaledWidth, 
          bottomTopProfile * scale
        );
        
        // Üst kasa profili
        ctx.fillStyle = colors.profile;
        ctx.fillRect(currentX, y, kolScaledWidth, bottomTopProfile * scale);
        ctx.strokeRect(currentX, y, kolScaledWidth, bottomTopProfile * scale);
        
        // Sol kasa profili
        ctx.fillStyle = colors.verticalProfile;
        ctx.fillRect(
          currentX, 
          y + bottomTopProfile * scale, 
          leftSideProfile * scale, 
          finalHeight - 2 * bottomTopProfile * scale
        );
        ctx.strokeRect(
          currentX, 
          y + bottomTopProfile * scale, 
          leftSideProfile * scale, 
          finalHeight - 2 * bottomTopProfile * scale
        );
        
        // Sağ kasa profili
                ctx.fillStyle = colors.verticalProfile;
        ctx.fillRect(
          currentX + kolScaledWidth - rightSideProfile * scale, 
          y + bottomTopProfile * scale, 
          rightSideProfile * scale, 
          finalHeight - 2 * bottomTopProfile * scale
        );
        ctx.strokeRect(
          currentX + kolScaledWidth - rightSideProfile * scale, 
          y + bottomTopProfile * scale, 
          rightSideProfile * scale, 
          finalHeight - 2 * bottomTopProfile * scale
        );
        
        // ========================================
        // SIMPLE.JS MANTIĞI: PANELLERİ ÇİZ
        // ========================================
        
        let panelX = currentX + leftSideProfile * scale;

        // İlk panel sağ çıkış ise (exit_right), solunda 49mm profil gerekir
        // Spacing mantığımız "öncesine" profil koyamadığı için burada ön-Spacing çiziyoruz
        {
          const exitProfile = 49;
          const firstPanel = panels[0];
          if (firstPanel && firstPanel.type === 'exit_right') {
            console.log(`🧩 İlk panel exit_right: soluna ${exitProfile}mm profil çiziliyor`);
            ctx.fillStyle = colors.verticalProfile;
            ctx.fillRect(
              panelX,
              y + bottomTopProfile * scale,
              exitProfile * scale,
              finalHeight - 2 * bottomTopProfile * scale
            );
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
            ctx.strokeRect(
              panelX,
              y + bottomTopProfile * scale,
              exitProfile * scale,
              finalHeight - 2 * bottomTopProfile * scale
            );
            panelX += exitProfile * scale;
          }
        }

        // Son panel sol çıkış ise (exit_left), sağında 49mm profil gerekir
        // Çizim akışında panel arası spacing ile eklenemediği için sonrasında çiziyoruz
        const lastPanel = panels[panels.length - 1];
        const shouldDrawEndExtra = lastPanel && lastPanel.type === 'exit_left';
        
        panels.forEach((panel, panelIndex) => {
          
          // Panel rengini belirle - tüm camlar aynı renkte
          const panelColor = colors.glass;
          
          // Alt kanat profili
              ctx.fillStyle = colors.kanatProfile;
          ctx.fillRect(
            panelX, 
            y + finalHeight - bottomTopProfile * scale - wingRail * scale, 
            panel.width * scale, 
            wingRail * scale
          );
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1;
          ctx.strokeRect(
            panelX, 
            y + finalHeight - bottomTopProfile * scale - wingRail * scale, 
            panel.width * scale, 
            wingRail * scale
          );
          
          // Cam gövdesi
          ctx.fillStyle = panelColor;
          ctx.fillRect(
            panelX, 
            y + bottomTopProfile * scale + wingRail * scale, 
            panel.width * scale, 
            panel.height * scale
          );
            ctx.strokeStyle = colors.glassBorder;
            ctx.lineWidth = 1;
          ctx.strokeRect(
            panelX, 
            y + bottomTopProfile * scale + wingRail * scale, 
            panel.width * scale, 
            panel.height * scale
          );
          
          // Üst kanat profili
          ctx.fillStyle = colors.kanatProfile;
          ctx.fillRect(
            panelX, 
            y + bottomTopProfile * scale, 
            panel.width * scale, 
            wingRail * scale
          );
          ctx.strokeRect(
            panelX, 
            y + bottomTopProfile * scale, 
            panel.width * scale, 
            wingRail * scale
          );
          
          // Cam boyutları (4 satır olarak)
          const centerX = panelX + (panel.width * scale) / 2;
          const centerY = y + bottomTopProfile * scale + wingRail * scale + (panel.height * scale) / 2;
          const realGlassWidth = panel.width.toFixed(1);
          const realGlassHeight = panel.height.toFixed(1);
          const camThickness = profileDimensions.glassThickness;
          
            ctx.font = "14px 'Noto Sans', 'Arial', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
          // 1. satır: Cam kalınlığı
          ctx.fillText(`${camThickness}mm`, centerX, centerY - 20);
          // 2. satır: Genişlik
          ctx.fillText(`${realGlassWidth}mm`, centerX, centerY);
          // 3. satır: Çarpım işareti
          ctx.fillText(`×`, centerX, centerY + 15);
          // 4. satır: Yükseklik
          ctx.fillText(`${realGlassHeight}mm`, centerX, centerY + 30);
          
          // Çıkış camı işareti
          if (panel.type.includes('exit')) {
              ctx.strokeStyle = colors.text;
              ctx.lineWidth = 2;
              ctx.setLineDash([5, 3]); // Kesikli çizgi efekti
              
                const offset = 5; // Kenarlardan 5px içeride başla
            const panelStartX = panelX;
            const panelStartY = y + bottomTopProfile * scale + wingRail * scale;
            const panelWidth = panel.width * scale;
            const panelHeight = panel.height * scale;
            
            if (panel.type === 'exit_left') {
                // Sol çıkış - sol üst ve sol alttan sağ ortaya doğru üçgen
              const leftTopX = panelStartX + offset;
              const leftTopY = panelStartY + offset;
              const leftBottomX = panelStartX + offset;
              const leftBottomY = panelStartY + panelHeight - offset;
              const rightCenterX = panelStartX + panelWidth - offset;
              const rightCenterY = panelStartY + panelHeight / 2;
                
                ctx.beginPath();
                ctx.moveTo(leftTopX, leftTopY);
                ctx.lineTo(rightCenterX, rightCenterY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(leftBottomX, leftBottomY);
                ctx.lineTo(rightCenterX, rightCenterY);
                ctx.stroke();
            } else if (panel.type === 'exit_right') {
                // Sağ çıkış - sağ üst ve sağ alttan sol ortaya doğru üçgen
              const rightTopX = panelStartX + panelWidth - offset;
              const rightTopY = panelStartY + offset;
              const rightBottomX = panelStartX + panelWidth - offset;
              const rightBottomY = panelStartY + panelHeight - offset;
              const leftCenterX = panelStartX + offset;
              const leftCenterY = panelStartY + panelHeight / 2;
                
                ctx.beginPath();
                ctx.moveTo(rightTopX, rightTopY);
                ctx.lineTo(leftCenterX, leftCenterY);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(rightBottomX, rightBottomY);
                ctx.lineTo(leftCenterX, leftCenterY);
                ctx.stroke();
              }
              
              ctx.setLineDash([]); // Kesikli çizgi efektini kapat
            }
            
          // Sabit cam işareti
          if (panel.type.includes('fixed')) {
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            
            const startX = panelX + 5;
            const startY = y + bottomTopProfile * scale + wingRail * scale + 5;
            const endX = panelX + panel.width * scale - 5;
            const endY = y + bottomTopProfile * scale + wingRail * scale + panel.height * scale - 5;
            
            // Çapraz çizgiler
                  ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
                  ctx.stroke();
                  
                  ctx.beginPath();
            ctx.moveTo(endX, startY);
            ctx.lineTo(startX, endY);
                  ctx.stroke();
            
            ctx.setLineDash([]);
          }
          
          // Ok işaretleri algoritması (sadece hareketli camlar için)
          if (panel.type === 'sliding') {
            // Çıkış camı mı kontrol et
            const isExitGlass = (kolCikisSayisi >= 1) && 
              ((kolCikisYonu === "sag" && panelIndex === panels.length - 1) || // En sağdaki cam
               (kolCikisYonu === "sol" && panelIndex === 0) || // En soldaki cam
               (kolCikisYonu === "sagsol" && (panelIndex === 0 || panelIndex === panels.length - 1))); // Hem sol hem sağ cam
            
            // Çıkış camı değilse ok çiz
            if (!isExitGlass) {
              const arrowX = panelX + (panel.width * scale) / 2; // Camın tam ortası
              const arrowY = y + bottomTopProfile * scale + wingRail * scale + (panel.height * scale) * 0.15; // Camın üst %15'i
              
              // Çıkış yönüne göre ok yönü belirle
              if ((kolCikisYonu === "sol" || kolCikisYonu === "sagsol") && kolSolaKanat > 0) {
                // Sol/sagsol çıkış + sola kanat > 0: karmaşık mantık
                const exitCount = kolCikisSayisi;
                const fixedCount = sabitCamInfo.adet;
                // Hareketli cam sayısı = toplam kanat - sabit - çıkış (zaten exit düşülüyor)
                const totalSlidingCount = kolKanat - fixedCount - exitCount;
                // Sola gidecek cam adedi, kullanıcı isteği ile sınırlı
                const availableGlassCount = Math.min(totalSlidingCount, kolSolaKanat);
              
                // Hareketli camların index'ini bul (sabit camları saymadan)
                let slidingIndex = 0;
                for (let i = 0; i < panelIndex; i++) {
                  if (panels[i].type === 'sliding') {
                    slidingIndex++;
                  }
                }
                
                if (slidingIndex < availableGlassCount) {
                    // Sola doğru ok
                    drawArrow(ctx, arrowX, arrowY, "left", colors.text);
            } else {
                    // Sağa doğru ok
                    drawArrow(ctx, arrowX, arrowY, "right", colors.text);
              }
            } else if (kolCikisYonu === "sag" || (kolCikisYonu === "sagsol" && kolSolaKanat === 0)) {
                // Sağ çıkış veya sagsol + sola kanat 0: sağa ok
                drawArrow(ctx, arrowX, arrowY, "right", colors.text);
            } else if (kolCikisYonu === "sol" && kolSolaKanat === 0) {
                // Sol çıkış + sola kanat 0: sağa ok
                drawArrow(ctx, arrowX, arrowY, "right", colors.text);
            } else {
                // Varsayılan: sağa ok
                drawArrow(ctx, arrowX, arrowY, "right", colors.text);
              }
            }
          }
            
          // Sonraki panel için pozisyonu güncelle
          panelX += panel.width * scale;
              
          // Panel arası profil (spacing > 0 ise çiz)
          const spacingWidth = panel.spacing ?? 0;
          
          
          // Spacing 0'dan büyükse profil çiz (son panel olsa bile)
          if (spacingWidth > 0) {
              ctx.fillStyle = colors.verticalProfile;
            ctx.fillRect(
              panelX, 
              y + bottomTopProfile * scale, 
              spacingWidth * scale, 
              finalHeight - 2 * bottomTopProfile * scale
            );
              ctx.strokeStyle = "#000000";
              ctx.lineWidth = 1;
            ctx.strokeRect(
              panelX, 
              y + bottomTopProfile * scale, 
              spacingWidth * scale, 
              finalHeight - 2 * bottomTopProfile * scale
            );
          }
          
          panelX += spacingWidth * scale;
        });
        
        // Bitiş son-Spacing'ini çiz (sağ düşey kasa profili öncesi, içeride)
        if (shouldDrawEndExtra) {
          const exitProfile = 49;
          console.log(`🧩 Son panel exit_left: sağına ${exitProfile}mm profil çiziliyor`);
          ctx.fillStyle = colors.verticalProfile;
          ctx.fillRect(
            currentX + kolScaledWidth - rightSideProfile * scale - exitProfile * scale,
            y + bottomTopProfile * scale,
            exitProfile * scale,
            finalHeight - 2 * bottomTopProfile * scale
          );
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            currentX + kolScaledWidth - rightSideProfile * scale - exitProfile * scale,
            y + bottomTopProfile * scale,
            exitProfile * scale,
            finalHeight - 2 * bottomTopProfile * scale
          );
        }
        
        // Kol arası boşluk ekle (son kol değilse)
        if (kolIndex < actualKolSayisi) {
          const gapWidth = 4; // 4 piksel boşluk
          ctx.fillStyle = colors.background;
          ctx.fillRect(currentX + kolScaledWidth, y, gapWidth, finalHeight);

          // İki kolun birleşim yerindeki açıyı üstte göster (pencere bittikten sonra)
          if (typeof rightKolAci === "number" && !isNaN(rightKolAci) && rightKolAci > 0) {
            const junctionX = currentX + kolScaledWidth; // birleşim noktası
            const label = `${Math.round(rightKolAci * 10) / 10}°`;
            const labelX = junctionX; // tam birleşim üzerinde
            // Üst kasa profili bittikten sonra, üstte boşlukta göster (görünür alanda)
            const labelY = y - 8; // Üst kasa profilinden 8px yukarıda (görünür alanda)

            ctx.font = "bold 16px 'Noto Sans', 'Arial', sans-serif";
            ctx.fillStyle = "#000000";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(label, labelX, labelY);
          }
        }
        
        // Sonraki kol için pozisyonu güncelle
        currentX += kolScaledWidth;
                
              }

              
              // Toplam hareketli cam arası hesaplamasını callback ile gönder (sadece değer değiştiğinde)
              if (onHareketliCamArasiHesapla && lastHareketliCamArasi !== toplamHareketliCamArasi) {
                setLastHareketliCamArasi(toplamHareketliCamArasi);
                onHareketliCamArasiHesapla(toplamHareketliCamArasi);
              }
              
              // Toplam sabit-hareketli cam arası hesaplamasını callback ile gönder
              if (onSabitHareketliCamArasiHesapla && lastSabitHareketliCamArasi !== toplamSabitHareketliCamArasi) {
                setLastSabitHareketliCamArasi(toplamSabitHareketliCamArasi);
                onSabitHareketliCamArasiHesapla(toplamSabitHareketliCamArasi);
              }
    },
    [otherProps, kolBilgileri, getSabitCamInfo, onHareketliCamArasiHesapla, onSabitHareketliCamArasiHesapla, lastHareketliCamArasi, lastSabitHareketliCamArasi]
  );

  // Canvas çizim fonksiyonu
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current) {
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    
    drawGlassBalcony(canvas, width, height, canvasWidth, canvasHeight);

    // Çizim bittiğinde global bellek'e yüksek kaliteli dataURL yaz (kalıcı kayıt yok)
    try {
      // Yüksek kalite için PNG formatında kaydet
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      (window as unknown as Record<string, unknown>)[
        "__camBalkonCizimDataUrl"
      ] = dataUrl;
    } catch {
      // ignore
    }
  }, [drawGlassBalcony, width, height]);

  // Canvas boyutlarını güncelle
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Yüksek çözünürlük için devicePixelRatio kullan
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Canvas'ın gerçek boyutunu ayarla (yüksek çözünürlük)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // CSS boyutunu ayarla (görüntü boyutu)
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Context'i scale et
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    
    // Çizimi başlat
    drawCanvas();
  }, [drawCanvas, width, height, kolBilgileri, otherProps]);

  // Kol bilgileri veya diğer props değiştiğinde çizimi yenile
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas, kolBilgileri, otherProps]);

  // Ekran boyutu değiştiğinde çizimi yenile (tablet modu vs)
  useEffect(() => {
    const handleResize = () => {
      // Kısa bir gecikme ile yeniden çiz (DOM güncellenmesini bekle)
      setTimeout(() => {
        drawCanvas();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // ResizeObserver ile container boyut değişikliklerini takip et
    let resizeObserver: ResizeObserver | null = null;
    if (canvasRef.current) {
      resizeObserver = new ResizeObserver(() => {
        // Container boyutu değiştiğinde çizimi yenile
        setTimeout(() => {
          drawCanvas();
        }, 50);
      });
      
      // Canvas container'ını gözlemle
      const container = canvasRef.current.parentElement;
      if (container) {
        resizeObserver.observe(container);
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [drawCanvas]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
          className="w-full h-full bg-white"
        style={{ width: "100%", height: "100%" }}
          data-cam-balkon-canvas="true"
      />
      </div>
    </div>
  );
}

export const GlassBalconyPreview = memo(GlassBalconyPreviewComponent);

