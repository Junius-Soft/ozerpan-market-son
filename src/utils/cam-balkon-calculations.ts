// Profil boyutları interface'i
export interface ProfileDimensions {
  leftVerticalProfileWidth: number; // Sol düşey kasa profili genişliği (25mm)
  rightVerticalProfileWidth: number; // Sağ düşey kasa profili genişliği (25mm)
  glassSpacing: number; // Cam arası boşluk (19mm)
  horizontalProfileWidth: number; // Yatay kasa profili genişliği (192mm)
  glassThickness: number; // Cam kalınlığı (24mm, 28mm, 32mm, 40mm)
}

// Panel tipi tanımları
export interface Panel {
  type: 'fixed_left' | 'fixed_right' | 'exit_left' | 'exit_right' | 'sliding';
  width: number;
  height: number;
  spacing?: number; // Panel sonrası profil genişliği (değişken: 19mm/49mm/98mm)
}

// Dönüş parçası hesaplama fonksiyonu
// Preview'daki gelişmiş versiyonu kullanıyoruz (daha fazla validasyon)
export function calculateTurnPiece(angle: number): number {
  // A = 20 * tan(90 - (Açı/2))
  
  // Açı değerini kontrol et - çok büyükse veya geçersizse varsayılan değer kullan
  if (!angle || isNaN(angle) || angle < 0 || angle > 360 || angle > 1000) {
    angle = 90;
  }
  
  const anglePositive = angle > 180 ? 360 - angle : angle;

  const angleInRadians = (anglePositive * Math.PI) / 180; // Dereceyi radyana çevir
  const turnPiece = 20 * Math.tan(Math.PI / 2 - angleInRadians / 2);
  
  // Negatif değeri pozitif yap - mutlak değer al
  const result = Math.abs(Math.round(turnPiece * 100) / 100);
  
  return result; // Her zaman pozitif değer döndür
}

// Cam kalınlığına göre profil boyutları
export function getProfileDimensions(camKalinligi?: string, kolAci?: number): ProfileDimensions {
  // Cam kalınlığını temizle ve normalize et
  const normalizedThickness = camKalinligi?.toString().trim();
  
  // Sağ profil genişliğini dinamik olarak hesapla
  const calculateRightProfileWidth = (baseWidth: number): number => {
    if (kolAci && kolAci !== 0) {
      // Doğru formül: 20 * tan(90 - açı/2) + 16
      const turnPiece = calculateTurnPiece(kolAci);
      return 16 + turnPiece; // 16mm + dönüş parçası
    }
    return baseWidth; // Açı yoksa normal genişlik
  };
  
  switch (normalizedThickness) {
    case "8":
    case "8mm":
      return {
        leftVerticalProfileWidth: 24,
        rightVerticalProfileWidth: calculateRightProfileWidth(24),
        glassSpacing: 9,
        horizontalProfileWidth: 192,
        glassThickness: 8
      };
    case "24":
    case "24mm":
      return {
        leftVerticalProfileWidth: 25,
        rightVerticalProfileWidth: calculateRightProfileWidth(25),
        glassSpacing: 19,
        horizontalProfileWidth: 192,
        glassThickness: 24
      };
    case "28":
    case "28mm":
      return {
        leftVerticalProfileWidth: 28,
        rightVerticalProfileWidth: calculateRightProfileWidth(28),
        glassSpacing: 22,
        horizontalProfileWidth: 192,
        glassThickness: 28
      };
    case "32":
    case "32mm":
      return {
        leftVerticalProfileWidth: 32,
        rightVerticalProfileWidth: calculateRightProfileWidth(32),
        glassSpacing: 25,
        horizontalProfileWidth: 192,
        glassThickness: 32
      };
    case "40":
    case "40mm":
      return {
        leftVerticalProfileWidth: 40,
        rightVerticalProfileWidth: calculateRightProfileWidth(40),
        glassSpacing: 30,
        horizontalProfileWidth: 192,
        glassThickness: 40
      };
    default:
      return {
        leftVerticalProfileWidth: 25,
        rightVerticalProfileWidth: calculateRightProfileWidth(25),
        glassSpacing: 19,
        horizontalProfileWidth: 192,
        glassThickness: 24
      };
  }
}

// Panel dizisi oluşturma fonksiyonu (simple.js mantığı)
// Spacing mantığı:
// - Son cam: spacing = 0 (kol arası çift profil önleme)
// - Çıkış camı + Hareketli/Sabit cam: spacing = 19mm (betweenProfile)
// - Sadece çıkış camı: spacing = 49mm (exitProfile) - sol çıkış için
// - Çıkış camı + Sabit cam: spacing = 19mm (betweenProfile)
export function createPanels(
  totalWidth: number,
  totalHeight: number,
  profileDimensions: ProfileDimensions,
  kolIndex: number,
  actualKolSayisi: number,
  kolKanat: number,
  kolCikisSayisi: number,
  kolCikisYonu: string,
  sabitCamAdet: number,
  sabitCamGenislik: number,
  sabitCamYonu: string,
  leftKolAci?: number,
  rightKolAci?: number
): Panel[] {
  // Profil sabitleri
  const bottomTopProfile = 63.5; // Üst/alt kasa profili yüksekliği
  const wingRail = 32.5; // Kanat profili yüksekliği

  // Sol/sağ kasa profilleri (dinamik)
  const leftSideProfile = kolIndex === 1 ? 25 : (
    leftKolAci && leftKolAci !== 0
      ? 16 + calculateTurnPiece(leftKolAci)
      : 25
  );

  const rightSideProfile = kolIndex === actualKolSayisi ? 25 : (
    rightKolAci && rightKolAci !== 0
      ? 16 + calculateTurnPiece(rightKolAci)
      : 25
  );

  const betweenProfile = profileDimensions.glassSpacing; // 19mm (değişken)
  const exitProfile = 49; // 49mm (değişken olarak tutuluyor)

  // Yükseklik
  const camNetHeight = totalHeight - (bottomTopProfile * 2) - (wingRail * 2);

  // Sayılar
  const exitCount = kolCikisSayisi;
  const fixedCount = sabitCamAdet;
  const slidingCount = Math.max(0, kolKanat - fixedCount - exitCount);

  // Sabit cam toplam genişlik
  const fixedTotal = fixedCount * sabitCamGenislik;

  // Sıra dizisi: sol sabitler -> sol çıkış -> hareketli -> sağ çıkış -> sağ sabitler
  const seq: Array<Pick<Panel, 'type'> & { spacing?: number }> = [];

  if (fixedCount > 0 && sabitCamYonu === 'sol') {
    for (let i = 0; i < fixedCount; i++) seq.push({ type: 'fixed_left' });
  }
  if (exitCount > 0 && (kolCikisYonu === 'sol' || kolCikisYonu === 'sagsol')) {
    seq.push({ type: 'exit_left' });
  }
  for (let i = 0; i < slidingCount; i++) seq.push({ type: 'sliding' });
  if (exitCount > 0 && (kolCikisYonu === 'sag' || kolCikisYonu === 'sagsol')) {
    seq.push({ type: 'exit_right' });
  }
  if (fixedCount > 0 && sabitCamYonu === 'sag') {
    for (let i = 0; i < fixedCount; i++) seq.push({ type: 'fixed_right' });
  }

  // Spacing hesapları (panel sonrası boşluk) — kurallar uygulaması
  for (let i = 0; i < seq.length - 1; i++) {
    const curr = seq[i].type;
    const next = seq[i + 1].type;

    // Varsayılan 0, kurala göre atanacak
    let s = 0;

    // 2) Sol çıkış camı: her durumda sağına 49mm; eğer yanında sağ çıkış varsa 2×49mm
    if (curr === 'exit_left') {
      s = exitProfile;
      if (next === 'exit_right') s = exitProfile * 2; // 6) iki çıkış yan yana → 2×49mm
    }
    // 4) Sağ hareketli camın soluna 49mm — pre-spacing, bir önceki panelin spacing'i 49 olmalı
    else if (next === 'exit_right') {
      // exit_right'tan önce 49mm
      s = exitProfile;
    }
    // 1) Sol sabit cam: ardından sağ çıkış gelmiyorsa 19mm, geliyorsa 49mm (pre spacing)
    else if (curr === 'fixed_left') {
      s = betweenProfile;
    }
    // 3) Hareketli cam: kendisi son değilse sağına 19mm
    else if (curr === 'sliding') {
      s = betweenProfile;
    }
    // 5) Sağ sabit camlar arası veya başka kombinasyonlarda araya 19mm
    else {
      s = betweenProfile;
    }

    // Son panel hariç, spacing uygula
    seq[i].spacing = s;
  }
  // Son panelin spacing'i 0 olmalı
  if (seq.length > 0) seq[seq.length - 1].spacing = 0;

  // Başlangıç ön-Spacing: İlk panel exit_right ise solda 49mm profil gerekir
  const startExtraSpacing = (seq.length > 0 && seq[0].type === 'exit_right') ? exitProfile : 0;
  // Bitiş son-Spacing: Son panel exit_left ise sağda 49mm profil gerekir
  const endExtraSpacing = (seq.length > 0 && seq[seq.length - 1].type === 'exit_left') ? exitProfile : 0;

  // Toplam spacing mm (panel araları + başlangıç/bitiş ek profilleri)
  const totalSpacing = startExtraSpacing + endExtraSpacing + seq.reduce((acc, p) => acc + (p.spacing || 0), 0);

  // Sliding benzeri panel sayısı (hareketli + çıkışlar)
  const slidingLikeCount = seq.filter(p => p.type === 'sliding' || p.type === 'exit_left' || p.type === 'exit_right').length;

  // Kullanılabilir genişlik
  const usableWidth = totalWidth - leftSideProfile - rightSideProfile - totalSpacing - fixedTotal;
  const slidingWidth = slidingLikeCount > 0 ? (usableWidth / slidingLikeCount) : 0;

  // Panel nesneleri oluştur
  const panels: Panel[] = seq.map((p) => {
    const w = (p.type === 'fixed_left' || p.type === 'fixed_right') ? sabitCamGenislik : slidingWidth;
    return {
      type: p.type,
      width: w,
      height: camNetHeight,
      spacing: p.spacing || 0,
    };
  });

  // Debug
  // console.log(`🔍 GERÇEK HESAPLAMA (Kol ${kolIndex}):`);
  // console.log(`- leftSideProfile: ${leftSideProfile}mm`);
  // console.log(`- rightSideProfile: ${rightSideProfile}mm`);
  // console.log(`- startExtraSpacing: ${startExtraSpacing}mm`);
  // console.log(`- endExtraSpacing: ${endExtraSpacing}mm`);
  // console.log(`- totalSpacing: ${totalSpacing}mm`);
  // console.log(`- slidingLikeCount: ${slidingLikeCount}`);
  // console.log(`- slidingWidth: ${slidingWidth}mm`);

  return panels;
}

// Hareketli cam arası hesaplama fonksiyonu
export function calculateHareketliCamArasi(panels: Panel[]): number {
  // Sadece sliding panelleri al
  const slidingPanels = panels.filter(panel => panel.type === 'sliding');
  
  // Hareketli cam arası = hareketli cam sayısı - 1
  // Örnek: 4 hareketli cam → 3 arası
  const hareketliCamArasi = Math.max(0, slidingPanels.length - 1);
  
  // console.log(`🔍 Panel dizisi:`, panels.map(p => p.type));
  // console.log(`🔍 Sliding paneller: ${slidingPanels.length}, Hareketli cam arası: ${hareketliCamArasi}`);
  
  return hareketliCamArasi;
}

// Sabit cam - Hareketli cam arası hesaplama fonksiyonu
// SADECE: Sabit cam (fixed) ↔ Hareketli cam (sliding) komşuluğunu sayar
// NOT: Çıkış camları (exit) sayılmaz!
export function calculateSabitHareketliCamArasi(panels: Panel[]): number {
  let count = 0;
  
  // console.log(`🔍 calculateSabitHareketliCamArasi başladı, panel sayısı: ${panels.length}`);
  // console.log(`🔍 Panel tipleri:`, panels.map((p, i) => `${i}: ${p.type}`));
  
  for (let i = 0; i < panels.length - 1; i++) {
    const current = panels[i].type;
    const next = panels[i + 1].type;
    
    // Sabit cam kontrolleri
    const isCurrentFixed = (current === 'fixed_left' || current === 'fixed_right');
    const isNextFixed = (next === 'fixed_left' || next === 'fixed_right');
    
    // console.log(`🔍 Panel ${i} → ${i+1}: ${current} → ${next}, isCurrentFixed: ${isCurrentFixed}, isNextFixed: ${isNextFixed}`);
    
    // SADECE: Sabit ↔ Sliding (her iki yön)
    // Çıkış camları (exit) sayılmaz!
    if ((isCurrentFixed && next === 'sliding') || (current === 'sliding' && isNextFixed)) {
      count++;
      // console.log(`✅ SAYILDI! Sabit-Hareketli arası bulundu: Panel ${i} (${current}) ↔ Panel ${i+1} (${next})`);
    }
  }
  
  // console.log(`🔍 Toplam Sabit-Hareketli cam arası: ${count}`);
  
  return count;
}
