import { 
  getProfileDimensions, 
  createPanels,
  calculateTurnPiece,
  type ProfileDimensions
} from "./cam-balkon-calculations";

// Cam balkon malzeme listesi tipi
export interface CamBalkonMalzeme {
  kategori: string;
  stokKodu: string;
  aciklama: string;
  olcu: string;
  miktar: number;
  birim: string;
  pozNo?: string;
}


// Kol bilgisi tipi
export interface KolBilgisi {
  genislik: number;
  kanat: number;
  cikis_sayisi: number;
  cikis_yonu: string;
  sola_kanat: number;
  sabitCamAdedi: number;
  sabitCamGenisligi: number;
  sabitCamYonu: string;
  aci?: number;
}



// Aluminyum malzeme tipi
export interface AluminyumMalzeme {
  urunKodu: string;
  urunAdi: string;
  adet: number;
  olcu: string;
}

// Ray profili hesaplama fonksiyonu
// NOT: Ray profilleri GRUPLANMAZ - her kol için ayrı satır olarak gösterilir (soldan sağa)
export function calculateRayProfili(
  kolBilgileri: KolBilgisi[]
): CamBalkonMalzeme[] {
  const malzemeler: CamBalkonMalzeme[] = [];
  
  console.log('\n🔍 ========== RAY PROFİLİ HESAPLAMA ==========');
  
  // Her kol için kol genişliği kadar Ray Profili-Contalı
  // DİKKAT: Her kol için AYRI satır - gruplanmaz
  kolBilgileri.forEach((kol, index) => {
    let rayProfilUzunlugu = kol.genislik;
    
    console.log(`\n🔍 Kol ${index + 1} Ray Profili Hesaplama:`);
    console.log(`  - Kol genişliği: ${kol.genislik.toFixed(1)}mm`);
    
    // Eğer bu kolda 180°'den büyük açı varsa, ray profiline ekleme yap
    if (kol.aci && kol.aci > 180) {
      // Geniş açı için ekleme hesaplama: 2 * 20 * tan(90 - (açı/2))
      const genisAciEklemesi = 2 * calculateTurnPiece(kol.aci);
      rayProfilUzunlugu += genisAciEklemesi;
      
      console.log(`  - Geniş açı tespit edildi: ${kol.aci}°`);
      console.log(`  - Açı eklemesi: ${genisAciEklemesi.toFixed(1)}mm`);
    }
    
    // Eğer bir sonraki kolda 180°'den büyük açı varsa, bu kolun ray profiline de ekleme yap
    // (çünkü geniş açı iki kolu da etkiler)
    if (index < kolBilgileri.length - 1) {
      const sonrakiKol = kolBilgileri[index + 1];
      if (sonrakiKol.aci && sonrakiKol.aci > 180) {
        // Bir sonraki kolun geniş açısı bu kolu da etkiliyor
        const sonrakiKolGenisAciEklemesi = 2 * calculateTurnPiece(sonrakiKol.aci);
        rayProfilUzunlugu += sonrakiKolGenisAciEklemesi;
        
        console.log(`  - Sonraki kol ${index + 2}'nin geniş açısından etkilendi: ${sonrakiKol.aci}°`);
        console.log(`  - Ek uzunluk: ${sonrakiKolGenisAciEklemesi.toFixed(1)}mm`);
      }
    }
    
    // Her kol için 2 adet (alt + üst), toplam metreye çevir
    const rayProfilMetresi = (rayProfilUzunlugu * 2) / 1000;
    
    console.log(`  - Final uzunluk: ${rayProfilUzunlugu.toFixed(1)}mm × 2 = ${rayProfilMetresi.toFixed(3)}m`);
    
    // Her kol için ayrı satır olarak ekle
    malzemeler.push({
      kategori: 'Aluminyum Malzemeler',
      stokKodu: "357014_4447_0",
      aciklama: "RAY PROFILI-CONTALI",
      olcu: rayProfilUzunlugu.toFixed(1), // Ölçüyü mm olarak göster
      miktar: rayProfilMetresi, // Miktar metre olarak
      birim: 'metre'
    });
  });
  
  console.log(`\n🔍 Toplam Ray Profili Satırı: ${malzemeler.length}`);
  
  return malzemeler;
}

// Yan profil tırnaklı hesaplama fonksiyonu
export function calculateYanProfilTirnakli(
  kolBilgileri: KolBilgisi[],
  totalHeight: number
): AluminyumMalzeme[] {
  const malzemeler: AluminyumMalzeme[] = [];
  
  // İlk ve son düşey kasa profilleri için her halükarda 2 adet
  const olcu = (totalHeight - 127).toFixed(1);
  
  malzemeler.push({
    urunKodu: "357012_4447_0",
    urunAdi: "YAN PROFIL TIRNAKLI",
    adet: 2, // Sol ve sağ için 1'er adet = 2 adet
    olcu: olcu
  });
  
  return malzemeler;
}

// Kilit PR-24 hesaplama fonksiyonu
export function calculateKilitPR24(
  kolBilgileri: KolBilgisi[],
  totalHeight: number
): AluminyumMalzeme[] {
  const malzemeler: AluminyumMalzeme[] = [];
  
  // Toplam çıkış camı sayısını hesapla
  const toplamCikisSayisi = kolBilgileri.reduce((sum, kol) => sum + kol.cikis_sayisi, 0);
  
  if (toplamCikisSayisi > 0) {
    const olcu = (totalHeight - 138).toFixed(1);
    
    malzemeler.push({
      urunKodu: "356628_4447_0",
      urunAdi: "KILIT PR-24",
      adet: toplamCikisSayisi, // Çıkış camı adedince
      olcu: olcu
    });
  }
  
  return malzemeler;
}

// İç içe profil hesaplama fonksiyonu
export function calculateIcIceProfil(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  profileDimensions: ProfileDimensions,
  toplamHareketliCamArasi?: number
): AluminyumMalzeme[] {
  const malzemeler: AluminyumMalzeme[] = [];
  
  console.log('🔍 calculateIcIceProfil - kolBilgileri:', kolBilgileri);
  
  // Toplam hareketli cam arası sayısını hesapla
  let hesaplananToplamHareketliCamArasi = 0;
  
  if (toplamHareketliCamArasi !== undefined) {
    // Eğer preview'dan gelen değer varsa, onu kullan
    hesaplananToplamHareketliCamArasi = toplamHareketliCamArasi;
    console.log('🔍 Preview\'dan gelen hareketli cam arası:', toplamHareketliCamArasi);
  } else {
    // Eğer preview'dan gelen değer yoksa, eski yöntemle hesapla
    kolBilgileri.forEach((kol, index) => {
      const kolIndex = index + 1;
      
      // Panel dizisini oluştur
      const panels = createPanels(
        kol.genislik,
        totalHeight,
        profileDimensions,
        kolIndex,
        kolBilgileri.length,
        kol.kanat,
        kol.cikis_sayisi,
        kol.cikis_yonu,
        kol.sabitCamAdedi,
        kol.sabitCamGenisligi,
        kol.sabitCamYonu,
        kol.aci,
        kolBilgileri[index + 1]?.aci
      );
      
      // Hareketli camları grupla (sliding paneller)
      const slidingPanels = panels.filter(p => p.type === 'sliding');
      
      console.log(`🔍 Kol ${kolIndex} - slidingPanels:`, slidingPanels.length);
      console.log(`🔍 Kol ${kolIndex} - kol bilgileri:`, {
        kanat: kol.kanat,
        cikis_sayisi: kol.cikis_sayisi,
        sabitCamAdedi: kol.sabitCamAdedi
      });
      console.log(`🔍 Kol ${kolIndex} - panel dizisi:`, panels.map(p => p.type));
      
      if (slidingPanels.length > 1) {
        // Hareketli cam arası sayısı = hareketli cam sayısı - 1
        const kolHareketliCamArasi = slidingPanels.length - 1;
        hesaplananToplamHareketliCamArasi += kolHareketliCamArasi;
        console.log(`🔍 Kol ${kolIndex} - hareketli cam arası ekleniyor:`, kolHareketliCamArasi);
      }
    });
  }
  
  if (hesaplananToplamHareketliCamArasi > 0) {
    const olcu = (totalHeight - 138).toFixed(1);
    console.log('Hareketli cam arası hesaplama:', hesaplananToplamHareketliCamArasi);
    
    // DIS profil
    malzemeler.push({
      urunKodu: "356646_4447_0_DIS",
      urunAdi: "IÇ IÇE PROFIL ( DIS )",
      adet: hesaplananToplamHareketliCamArasi,
      olcu: olcu
    });
    
    // IÇ profil
    malzemeler.push({
      urunKodu: "356646_4447_0_IC",
      urunAdi: "IÇ IÇE PROFIL ( IÇ )",
      adet: hesaplananToplamHareketliCamArasi,
      olcu: olcu
    });
  }
  
  return malzemeler;
}

// Açı sayısını hesaplama fonksiyonu
function calculateAciSayisi(kolBilgileri: KolBilgisi[]): number {
  let aciSayisi = 0;
  
  // Her kol için açı kontrolü (kol2'den kol5'e kadar)
  for (let i = 1; i < kolBilgileri.length; i++) {
    const kol = kolBilgileri[i];
    if (kol.aci && kol.aci > 0) {
      aciSayisi++;
    }
  }
  
  console.log('🔍 calculateAciSayisi:', { kolSayisi: kolBilgileri.length, aciSayisi });
  
  return aciSayisi;
}

// Köşe dönüş malzemeleri hesaplama fonksiyonu
export function calculateKoseDonusMalzemeleri(
  kolBilgileri: KolBilgisi[],
  totalHeight: number
): AluminyumMalzeme[] {
  const malzemeler: AluminyumMalzeme[] = [];
  
  const aciSayisi = calculateAciSayisi(kolBilgileri);
  
  if (aciSayisi > 0) {
    const olcu = (totalHeight - 138).toFixed(1);
    
    // 1. KÖSE DÖNÜS PASIF PRO
    malzemeler.push({
      urunKodu: "356650_4447_0",
      urunAdi: "KÖSE DÖNÜS PASIF PRO",
      adet: aciSayisi,
      olcu: olcu
    });
    
    // 2. KÖSE DÖNÜS AKTIF PRO
    malzemeler.push({
      urunKodu: "356649_4447_0",
      urunAdi: "KÖSE DÖNÜS AKTIF PRO",
      adet: aciSayisi,
      olcu: olcu
    });
    
    // 3. KOSE DONUS BORU
    malzemeler.push({
      urunKodu: "356739_4447_0",
      urunAdi: "KOSE DONUS BORU",
      adet: aciSayisi,
      olcu: olcu
    });
    
    console.log('🔍 calculateKoseDonusMalzemeleri:', {
      aciSayisi,
      olcu,
      malzemeSayisi: malzemeler.length
    });
  }
  
  return malzemeler;
}

// Ara kanat kapak profil hesaplama fonksiyonu
export function calculateAraKanatKapakProfil(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  toplamSabitHareketliCamArasi?: number
): AluminyumMalzeme[] {
  const malzemeler: AluminyumMalzeme[] = [];
  
  // Yan Profil Tırnaklı adedi (her zaman 2)
  const yanProfilTirnakliAdedi = 2;
  
  // Kilit PR-24 adedi (çıkış camı sayısı)
  const kilitPR24Adedi = kolBilgileri.reduce((sum, kol) => sum + kol.cikis_sayisi, 0);
  
  // Sabit-Hareketli cam arası adedi
  const sabitHareketliCamArasiAdedi = toplamSabitHareketliCamArasi || 0;
  
  // Toplam adet
  const toplamAdet = yanProfilTirnakliAdedi + kilitPR24Adedi + sabitHareketliCamArasiAdedi;
  
  console.log('🔍 calculateAraKanatKapakProfil:', {
    yanProfilTirnakliAdedi,
    kilitPR24Adedi,
    sabitHareketliCamArasiAdedi,
    toplamAdet
  });
  
  if (toplamAdet > 0) {
    const olcu = (totalHeight - 138).toFixed(1); // Yükseklik - 138mm
    
    malzemeler.push({
      urunKodu: "356645_7072_0",
      urunAdi: "ARA KANAT KAPAK PROF",
      adet: toplamAdet,
      olcu: olcu
    });
  }
  
  return malzemeler;
}

// Kanat profili hesaplama fonksiyonu
// NOT: Kanat profilleri GRUPLANMAZ - her cam için ayrı satır olarak gösterilir
export function calculateKanatProfili(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  profileDimensions: ProfileDimensions
): CamBalkonMalzeme[] {
  const malzemeler: CamBalkonMalzeme[] = [];
  
  console.log('🔍 calculateKanatProfili - kolBilgileri:', kolBilgileri);
  console.log('🔍 calculateKanatProfili - totalHeight:', totalHeight);
  console.log('🔍 calculateKanatProfili - profileDimensions:', profileDimensions);
  
  // Her kol için panelleri oluştur ve kanat profillerini hesapla
  kolBilgileri.forEach((kol, index) => {
    const kolIndex = index + 1;
    
    console.log(`\n🔍 ========== KOL ${kolIndex} KANAT PROFİLİ HESAPLAMA ==========`);
    console.log(`🔍 Kol ${kolIndex} bilgileri:`, {
      genislik: kol.genislik,
      kanat: kol.kanat,
      cikis_sayisi: kol.cikis_sayisi,
      cikis_yonu: kol.cikis_yonu,
      sabitCamAdedi: kol.sabitCamAdedi,
      sabitCamGenisligi: kol.sabitCamGenisligi,
      sabitCamYonu: kol.sabitCamYonu,
      aci: kol.aci
    });
    
    // Panel dizisini oluştur
    const panels = createPanels(
      kol.genislik,
      totalHeight,
      profileDimensions,
      kolIndex,
      kolBilgileri.length,
      kol.kanat,
      kol.cikis_sayisi,
      kol.cikis_yonu,
      kol.sabitCamAdedi,
      kol.sabitCamGenisligi,
      kol.sabitCamYonu,
      kol.aci,
      kolBilgileri[index + 1]?.aci
    );
    
    console.log(`🔍 Kol ${kolIndex} - Oluşturulan paneller:`, panels.length);
    panels.forEach((p, idx) => {
      console.log(`  Panel ${idx + 1}: ${p.type} - ${p.width.toFixed(1)}mm (spacing: ${p.spacing}mm)`);
    });
    
    // Her panel (cam) için kanat profili ekle (üst ve alt toplamı metre olarak)
    // DİKKAT: Her cam için AYRI satır - gruplanmaz
    panels.forEach((panel, panelIndex) => {
      const kanatProfilGenisligi = panel.width - 18;
      // Her cam için 2 adet profil (üst + alt), toplam metreye çevir
      const kanatProfilMetresi = (kanatProfilGenisligi * 2) / 1000;
      
      console.log(`🔍 Kol ${kolIndex} - Panel ${panelIndex + 1} kanat profili:`, {
        type: panel.type,
        camGenisligi: panel.width.toFixed(1),
        kanatProfilGenisligi: kanatProfilGenisligi.toFixed(1),
        kanatProfilMetresi: kanatProfilMetresi.toFixed(3),
        hesaplama: `(${panel.width.toFixed(1)} - 18) × 2 ÷ 1000 = ${kanatProfilMetresi.toFixed(3)}m`
      });
      
      malzemeler.push({
        kategori: 'Aluminyum Malzemeler',
        stokKodu: "357001_4447_0",
        aciklama: "KANAT PROFILI-24",
        olcu: kanatProfilGenisligi.toFixed(1), // Ölçüyü mm olarak göster
        miktar: kanatProfilMetresi, // Miktar metre olarak
        birim: 'metre'
      });
    });
  });
  
  console.log('\n🔍 ========== TOPLAM KANAT PROFİLİ ==========');
  console.log('🔍 calculateKanatProfili - toplam malzeme sayısı:', malzemeler.length);
  malzemeler.forEach((m, idx) => {
    console.log(`  ${idx + 1}. ${m.stokKodu} - ${m.olcu}mm × ${m.miktar} adet`);
  });
  
  return malzemeler;
}

// Aynı ölçüde olanları gruplama fonksiyonu
export function groupAluminyumMalzemeler(malzemeler: AluminyumMalzeme[]): AluminyumMalzeme[] {
  const grouped = new Map<string, AluminyumMalzeme>();
  
  malzemeler.forEach(malzeme => {
    const key = `${malzeme.urunKodu}-${malzeme.olcu}`;
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.adet += malzeme.adet;
    } else {
      grouped.set(key, { ...malzeme });
    }
  });
  
  return Array.from(grouped.values()).sort((a, b) => a.olcu.localeCompare(b.olcu));
}

// Fırça conta hesaplama fonksiyonu (Yatay profiller için - 4.8*10)
export function calculateFircaConta(
  kolBilgileri: KolBilgisi[]
): CamBalkonMalzeme[] {
  const malzemeler: CamBalkonMalzeme[] = [];
  
  // Tüm ray profili uzunluklarını hesapla (calculateRayProfili mantığıyla aynı)
  let toplamRayProfilUzunlugu = 0;
  
  kolBilgileri.forEach((kol, index) => {
    let rayProfilUzunlugu = kol.genislik;
    
    // Eğer bu kolda 180°'den büyük açı varsa, ray profiline ekleme yap
    if (kol.aci && kol.aci > 180) {
      const genisAciEklemesi = 2 * calculateTurnPiece(kol.aci);
      rayProfilUzunlugu += genisAciEklemesi;
    }
    
    // Eğer bir sonraki kolda 180°'den büyük açı varsa, bu kolun ray profiline de ekleme yap
    if (index < kolBilgileri.length - 1) {
      const sonrakiKol = kolBilgileri[index + 1];
      if (sonrakiKol.aci && sonrakiKol.aci > 180) {
        const sonrakiKolGenisAciEklemesi = 2 * calculateTurnPiece(sonrakiKol.aci);
        rayProfilUzunlugu += sonrakiKolGenisAciEklemesi;
      }
    }
    
    toplamRayProfilUzunlugu += rayProfilUzunlugu;
  });
  
  // Toplam ray profili uzunluğu * 2 * 4 ve metreye çevir
  const fircaContaUzunlugu = (toplamRayProfilUzunlugu * 2 * 4) / 1000; // mm -> m
  
  console.log('🔍 calculateFircaConta (4.8*10):', {
    toplamRayProfilUzunlugu: toplamRayProfilUzunlugu.toFixed(1),
    fircaContaUzunlugu: fircaContaUzunlugu.toFixed(2),
    hesaplama: `(${toplamRayProfilUzunlugu.toFixed(1)}mm × 2 × 4) ÷ 1000 = ${fircaContaUzunlugu.toFixed(2)}m`
  });
  
  if (fircaContaUzunlugu > 0) {
    malzemeler.push({
      kategori: 'Aluminyum Malzemeler',
      stokKodu: "19737_256_0",
      aciklama: "FIRÇA CONTA-4.8*10",
      olcu: '',
      miktar: parseFloat(fircaContaUzunlugu.toFixed(2)),
      birim: 'm'
    });
  }
  
  return malzemeler;
}

// Fırça conta hesaplama fonksiyonu (Dikey profiller için - 4.8*550)
export function calculateFircaConta550(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  toplamSabitHareketliCamArasi?: number
): CamBalkonMalzeme[] {
  const malzemeler: CamBalkonMalzeme[] = [];
  
  let toplamUzunluk = 0;
  
  // 1. ARA KANAT KAPAK PROF - toplam yükseklik × adet
  const yanProfilTirnakliAdedi = 2;
  const kilitPR24Adedi = kolBilgileri.reduce((sum, kol) => sum + kol.cikis_sayisi, 0);
  const sabitHareketliCamArasiAdedi = toplamSabitHareketliCamArasi || 0;
  const araKanatKapakAdedi = yanProfilTirnakliAdedi + kilitPR24Adedi + sabitHareketliCamArasiAdedi;
  const araKanatKapakUzunluk = (totalHeight - 138) * araKanatKapakAdedi;
  toplamUzunluk += araKanatKapakUzunluk;
  
  console.log('🔍 ARA KANAT KAPAK PROF:', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: araKanatKapakAdedi,
    uzunluk: araKanatKapakUzunluk.toFixed(1)
  });
  
  // 2. KILIT PR-24 - toplam uzunlukları × 1
  const kilitPR24Uzunluk = (totalHeight - 138) * kilitPR24Adedi;
  toplamUzunluk += kilitPR24Uzunluk;
  
  console.log('🔍 KILIT PR-24:', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: kilitPR24Adedi,
    uzunluk: kilitPR24Uzunluk.toFixed(1)
  });
  
  // 3. İÇ İÇE PROFIL (DIS) - toplam uzunlukları × 2
  // 4. İÇ İÇE PROFIL (İÇ) - toplam uzunlukları × 2
  const profileDimensions = getProfileDimensions('24mm'); // Varsayılan cam kalınlığı
  const icIceProfilResult = calculateIcIceProfil(kolBilgileri, totalHeight, profileDimensions);
  
  // İç içe profil sayısını bul (DIS ve IÇ aynı adette)
  const icIceProfilDis = icIceProfilResult.find(m => m.urunAdi.includes('DIS'));
  const icIceProfilAdet = icIceProfilDis ? icIceProfilDis.adet : 0;
  const icIceProfilUzunluk = (totalHeight - 138) * icIceProfilAdet * 2; // DIS × 2
  toplamUzunluk += icIceProfilUzunluk;
  
  const icIceProfilIcUzunluk = (totalHeight - 138) * icIceProfilAdet * 2; // IÇ × 2
  toplamUzunluk += icIceProfilIcUzunluk;
  
  console.log('🔍 İÇ İÇE PROFIL (DIS):', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: icIceProfilAdet,
    carpan: 2,
    uzunluk: icIceProfilUzunluk.toFixed(1)
  });
  
  console.log('🔍 İÇ İÇE PROFIL (İÇ):', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: icIceProfilAdet,
    carpan: 2,
    uzunluk: icIceProfilIcUzunluk.toFixed(1)
  });
  
  // 5. KÖŞE DÖNÜŞ PASIF PRO - toplam uzunlukları × 1
  // 6. KÖŞE DÖNÜŞ AKTİF PRO - toplam uzunlukları × 1
  const aciSayisi = kolBilgileri.filter(kol => kol.aci && kol.aci > 0).length;
  const koseDonusPasifUzunluk = (totalHeight - 138) * aciSayisi;
  toplamUzunluk += koseDonusPasifUzunluk;
  
  const koseDonusAktifUzunluk = (totalHeight - 138) * aciSayisi;
  toplamUzunluk += koseDonusAktifUzunluk;
  
  console.log('🔍 KÖŞE DÖNÜŞ PASIF PRO:', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: aciSayisi,
    uzunluk: koseDonusPasifUzunluk.toFixed(1)
  });
  
  console.log('🔍 KÖŞE DÖNÜŞ AKTİF PRO:', {
    yukseklik: (totalHeight - 138).toFixed(1),
    adet: aciSayisi,
    uzunluk: koseDonusAktifUzunluk.toFixed(1)
  });
  
  // Metreye çevir
  const fircaConta550Uzunlugu = toplamUzunluk / 1000; // mm -> m
  
  console.log('🔍 calculateFircaConta550 (4.8*550):', {
    toplamUzunluk: toplamUzunluk.toFixed(1),
    fircaConta550Uzunlugu: fircaConta550Uzunlugu.toFixed(2),
    hesaplama: `${toplamUzunluk.toFixed(1)}mm ÷ 1000 = ${fircaConta550Uzunlugu.toFixed(2)}m`
  });
  
  if (fircaConta550Uzunlugu > 0) {
    malzemeler.push({
      kategori: 'Aluminyum Malzemeler',
      stokKodu: "12963_256_0",
      aciklama: "FIRÇA CONTA-4.8*550",
      olcu: '',
      miktar: parseFloat(fircaConta550Uzunlugu.toFixed(2)),
      birim: 'm'
    });
  }
  
  return malzemeler;
}

// Aksesuar malzemeleri hesaplama fonksiyonu
export function calculateAksesuarMalzemeleri(
  kolBilgileri: KolBilgisi[],
  yanProfilTirnakliAdedi: number = 2
): CamBalkonMalzeme[] {
  const malzemeler: CamBalkonMalzeme[] = [];
  
  // Toplam çıkış camı sayısını hesapla (açılır kanatlar)
  const toplamCikisSayisi = kolBilgileri.reduce((sum, kol) => sum + kol.cikis_sayisi, 0);
  
  // Hareketli cam sayısını hesapla (toplam kanat - sabit cam - çıkış camı)
  // NOT: Açılır kanatlar (çıkış camı) tekerlek gerektirmez, bu yüzden çıkarılıyor
  const toplamHareketliCam = kolBilgileri.reduce((sum, kol) => {
    // Sadece gerçek sürme (sliding) camları say - açılır kanatlar (cikis_sayisi) hariç
    const hareketliCamSayisi = Math.max(0, kol.kanat - kol.sabitCamAdedi - kol.cikis_sayisi);
    return sum + hareketliCamSayisi;
  }, 0);
  
  // 0'dan büyük açı sayısını hesapla
  const aciSayisi = kolBilgileri.filter(kol => kol.aci && kol.aci > 0).length;
  
  console.log('🔍 calculateAksesuarMalzemeleri:', {
    toplamCikisSayisi,
    toplamHareketliCam,
    aciSayisi,
    yanProfilTirnakliAdedi
  });
  
  // 1. KÖŞE TAKOZU - YAN PROFIL TIRNAKLI adedi / 2
  if (yanProfilTirnakliAdedi > 0) {
    const koseTakozuAdedi = Math.ceil(yanProfilTirnakliAdedi / 2);
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356860_429", // product-prices.json'daki stok kodu
      aciklama: "KÖŞE TAKOZU",
      olcu: '',
      miktar: koseTakozuAdedi,
      birim: 'adet'
    });
  }
  
  // 2. TEKERLEK SETİ - sadece sürme (sliding) hareketli cam adedi * 4
  // NOT: Açılır kanatlar (çıkış camı) tekerlek gerektirmez, sadece sürme camlar için tekerlek gerekir
  // Müşteri isteğine göre: Her sürme hareketli cam için 4 adet tekerlek seti
  if (toplamHareketliCam > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356855_0", // product-prices.json'daki stok kodu
      aciklama: "TEKERLEK SETİ",
      olcu: '',
      miktar: toplamHareketliCam * 4,
      birim: 'adet'
    });
  }
  
  // 3. BAKLA-5 - çıkış camı adedince
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356865_0_0",
      aciklama: "BAKLA-5",
      olcu: '',
      miktar: toplamCikisSayisi,
      birim: 'adet'
    });
  }
  
  // 4. MENTEŞELİ KANAT TAKIMI - çıkış camı sayısı kadar
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356819_429_0",
      aciklama: "MENTEŞELİ KANAT TAKIMI",
      olcu: '',
      miktar: toplamCikisSayisi,
      birim: 'adet'
    });
  }
  
  // 5. MENTEŞE-KANAT TUTUCU - çıkış camı sayısı kadar
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356985_256",
      aciklama: "MENTEŞE-KANAT TUTUCU",
      olcu: '',
      miktar: toplamCikisSayisi,
      birim: 'adet'
    });
  }
  
  // 6. ECO BELLA ISP.KIT - çıkış camı adedince * 1
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356902_0", // product-prices.json'daki stok kodu
      aciklama: "ECO BELLA ISP.KIT",
      olcu: '',
      miktar: toplamCikisSayisi,
      birim: 'adet'
    });
  }
  
  // 7. İSPANYOLET PİM SETİ - çıkış camı adedince * 1
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356987_0", // product-prices.json'daki stok kodu
      aciklama: "İSPANYOLET PİM SETİ",
      olcu: '',
      miktar: toplamCikisSayisi,
      birim: 'adet'
    });
  }
  
  // 8. TAPA - çıkış camı adedince * 3
  if (toplamCikisSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356979_0", // product-prices.json'daki stok kodu
      aciklama: "TAPA",
      olcu: '',
      miktar: toplamCikisSayisi * 3,
      birim: 'adet'
    });
  }
  
  // 9. ZAMAK KOSE DONUS - 0'dan büyük açı adedi kadar
  if (aciSayisi > 0) {
    malzemeler.push({
      kategori: 'Aksesuar',
      stokKodu: "356922_0_0",
      aciklama: "ZAMAK KOSE DONUS",
      olcu: '',
      miktar: aciSayisi,
      birim: 'adet'
    });
  }
  
  console.log('🔍 calculateAksesuarMalzemeleri - sonuç:', malzemeler.length, 'malzeme');
  
  return malzemeler;
}

// Ana malzeme listesi hesaplama fonksiyonu
export function calculateCamBalkonMalzemeListesi(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  camKalinligi: string,
  camRengi: string,
  renk: string,
  pozNo: string,
  toplamHareketliCamArasi?: number,
  toplamSabitHareketliCamArasi?: number
): CamBalkonMalzeme[] {
  const allMaterials: CamBalkonMalzeme[] = [];
  
  // Aluminyum malzemeleri hesapla
  const profileDimensions = getProfileDimensions(camKalinligi);
  const rayProfili = calculateRayProfili(kolBilgileri);
  const yanProfilTirnakli = calculateYanProfilTirnakli(kolBilgileri, totalHeight);
  const kilitPR24 = calculateKilitPR24(kolBilgileri, totalHeight);
  const icIceProfil = calculateIcIceProfil(kolBilgileri, totalHeight, profileDimensions, toplamHareketliCamArasi);
  const araKanatKapakProfil = calculateAraKanatKapakProfil(kolBilgileri, totalHeight, toplamSabitHareketliCamArasi);
  const koseDonusMalzemeleri = calculateKoseDonusMalzemeleri(kolBilgileri, totalHeight);
  
  // 1. RAY PROFİLLERİNİ ÖNCE EKLE (GRUPLANMADAN - soldan sağa her kol için ayrı satır)
  rayProfili.forEach(malzeme => {
    allMaterials.push({
      ...malzeme,
      pozNo
    });
  });
  
  // 2. DİĞER ALUMINYUM MALZEMELERİ GRUPLA VE EKLE
  // (yan profil, kilit, iç içe profil, ara kanat kapak profil, köşe dönüş)
  const tumAluminyumMalzemeler = [...yanProfilTirnakli, ...kilitPR24, ...icIceProfil, ...araKanatKapakProfil, ...koseDonusMalzemeleri];
  const groupedAluminyum = groupAluminyumMalzemeler(tumAluminyumMalzemeler);
  
  // Aluminyum malzemelerini CamBalkonMalzeme formatına çevir
  // DİKKAT: Düşey profiller metre bazında satılır
  // Miktar = (ölçü × adet) ÷ 1000 (mm'den metreye)
  groupedAluminyum.forEach(malzeme => {
    const olcuMM = parseFloat(malzeme.olcu) || 0;
    const toplamMetreye = (olcuMM * malzeme.adet) / 1000;
    
    allMaterials.push({
      kategori: 'Aluminyum Malzemeler',
      stokKodu: malzeme.urunKodu,
      aciklama: malzeme.urunAdi,
      olcu: malzeme.olcu, // Ölçüyü mm olarak göster
      miktar: toplamMetreye, // Miktar metre olarak
      birim: 'metre',
      pozNo
    });
  });
  
  // 3. KANAT PROFİLLERİNİ EKLE (GRUPLANMADAN - her cam için ayrı satır)
  const kanatProfilleri = calculateKanatProfili(kolBilgileri, totalHeight, profileDimensions);
  kanatProfilleri.forEach(malzeme => {
    allMaterials.push({
      ...malzeme,
      pozNo
    });
  });
  
  // 4. AKSESUAR MALZEMELERİNİ EKLE
  const aksesuarMalzemeleri = calculateAksesuarMalzemeleri(kolBilgileri, 2); // Yan profil tırnaklı adedi = 2
  aksesuarMalzemeleri.forEach(malzeme => {
    allMaterials.push({
      ...malzeme,
      pozNo
    });
  });
  
  // 5. FIRÇA CONTA EKLE (4.8*10 - Yatay profiller için)
  const fircaConta = calculateFircaConta(kolBilgileri);
  fircaConta.forEach(malzeme => {
    allMaterials.push({
      ...malzeme,
      pozNo
    });
  });
  
  // 6. FIRÇA CONTA EKLE (4.8*550 - Dikey profiller için)
  const fircaConta550 = calculateFircaConta550(kolBilgileri, totalHeight, toplamSabitHareketliCamArasi);
  fircaConta550.forEach(malzeme => {
    allMaterials.push({
      ...malzeme,
      pozNo
    });
  });
  
  return allMaterials;
}

// Cam listesi tipi
export interface CamBilgisi {
  adet: number;
  genislik: number; // mm
  yukseklik: number; // mm
  kalinlik: number; // mm
  m2: number;
}

export interface CamListesiSonuc {
  camRengi: string;
  camlar: CamBilgisi[];
  toplamCamM2: number;
}

// Cam listesi hesaplama fonksiyonu
// NOT: Camlar kendi kolu içinde gruplanır, kollar arası gruplama yapılmaz
export function calculateCamListesi(
  kolBilgileri: KolBilgisi[],
  totalHeight: number,
  camKalinligi: string,
  camRengi: string
): CamListesiSonuc {
  const profileDimensions = getProfileDimensions(camKalinligi);
  const tumCamlar: CamBilgisi[] = [];
  
  console.log('\n🔍 ========== CAM LİSTESİ HESAPLAMA ==========');
  
  // Her kol için panelleri oluştur
  kolBilgileri.forEach((kol, index) => {
    const kolIndex = index + 1;
    const kolCamlari: CamBilgisi[] = [];
    
    console.log(`\n🔍 Kol ${kolIndex} cam hesaplama:`);
    
    // Sonraki kol açısını al
    let rightKolAci: number | undefined = undefined;
    if (kolIndex < kolBilgileri.length) {
      const sonrakiKol = kolBilgileri[index + 1];
      rightKolAci = sonrakiKol?.aci;
    }
    
    // Panel dizisini oluştur
    const panels = createPanels(
      kol.genislik,
      totalHeight,
      profileDimensions,
      kolIndex,
      kolBilgileri.length,
      kol.kanat,
      kol.cikis_sayisi,
      kol.cikis_yonu,
      kol.sabitCamAdedi,
      kol.sabitCamGenisligi,
      kol.sabitCamYonu,
      kol.aci,
      rightKolAci
    );
    
    // Her panel = 1 cam (SADECE BU KOL İÇİNDE GRUPLA)
    panels.forEach((panel) => {
      const camGenislik = panel.width;
      const camYukseklik = panel.height;
      const camKalinlik = profileDimensions.glassThickness;
      
      // m² hesapla
      const m2 = (camGenislik * camYukseklik) / 1000000;
      
      console.log(`  Cam: ${camGenislik.toFixed(1)} × ${camYukseklik.toFixed(1)} × ${camKalinlik}mm = ${m2.toFixed(4)}m²`);
      
      // Aynı boyutta cam var mı kontrol et (SADECE BU KOL İÇİNDE)
      const existingCam = kolCamlari.find(
        c => 
          Math.abs(c.genislik - camGenislik) < 0.1 && 
          Math.abs(c.yukseklik - camYukseklik) < 0.1 &&
          c.kalinlik === camKalinlik
      );
      
      if (existingCam) {
        // Aynı boyutta cam varsa adet artır
        existingCam.adet++;
        existingCam.m2 = (existingCam.genislik * existingCam.yukseklik * existingCam.adet) / 1000000;
      } else {
        // Yeni cam ekle
        kolCamlari.push({
          adet: 1,
          genislik: camGenislik,
          yukseklik: camYukseklik,
          kalinlik: camKalinlik,
          m2: m2
        });
      }
    });
    
    // Bu kolun camlarını ana listeye ekle (genişliğe göre sıralı)
    kolCamlari.sort((a, b) => a.genislik - b.genislik);
    tumCamlar.push(...kolCamlari);
    
    console.log(`  Kol ${kolIndex} - ${kolCamlari.length} farklı boyut, ${panels.length} toplam cam`);
  });
  
  // Toplam cam m² hesapla
  const toplamCamM2 = tumCamlar.reduce((sum, cam) => sum + cam.m2, 0);
  
  console.log('\n🔍 ========== CAM LİSTESİ SONUÇ ==========');
  console.log(`Cam Rengi: ${camRengi}`);
  console.log(`Toplam Satır: ${tumCamlar.length}`);
  console.log(`Toplam m²: ${toplamCamM2.toFixed(2)} m²`);
  
  return {
    camRengi: camRengi || 'Şeffaf',
    camlar: tumCamlar, // Sıralama kol bazında yapıldı
    toplamCamM2
  };
}

// Malzeme listesini gruplama ve toplama
// NOT: RAY PROFILI-CONTALI ve KANAT PROFILI-24 GRUPLANMAZ!
export function groupMalzemeListesi(materials: CamBalkonMalzeme[]): CamBalkonMalzeme[] {
  const grouped = new Map<string, CamBalkonMalzeme>();
  const ungroupedMaterials: CamBalkonMalzeme[] = []; // Gruplanmayacak malzemeler
  
  // Gruplanmayacak stok kodları
  const UNGROUP_CODES = [
    "357014_4447_0", // RAY PROFILI-CONTALI
    "357001_4447_0"  // KANAT PROFILI-24
  ];

  materials.forEach(material => {
    // Eğer gruplanmayacak malzemelerden biriyse, direkt ekle
    if (UNGROUP_CODES.includes(material.stokKodu)) {
      ungroupedMaterials.push({ ...material });
      return;
    }
    
    // Diğer malzemeleri grupla
    const key = `${material.stokKodu}-${material.olcu}`;
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.miktar += material.miktar;
    } else {
      grouped.set(key, { ...material });
    }
  });

  // Gruplanmamış malzemeleri ve gruplu malzemeleri birleştir
  // RAY PROFILI ve KANAT PROFILI sırasını koru
  const groupedArray = Array.from(grouped.values());
  
  return [...ungroupedMaterials, ...groupedArray].sort((a, b) => {
    // Önce kategori, sonra stok kodu
    if (a.kategori !== b.kategori) {
      return a.kategori.localeCompare(b.kategori);
    }
    return a.stokKodu.localeCompare(b.stokKodu);
  });
}

