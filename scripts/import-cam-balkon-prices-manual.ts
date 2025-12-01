const fs = require('fs');
const path = require('path');

// Renk Kodları (src/utils/cam-balkon-malzeme-listesi.ts ve genel yapıdan çıkarılan)
const COLORS = {
  'eloksal': { suffix: '4447', name: 'Eloksal' },
  'bronz': { suffix: '4440', name: 'Bronz' },
  'antrasit': { suffix: '4441', name: 'Antrasit' },
  'ral': { suffix: '7072', name: 'RAL' }
};

// Görselden ve koddan çıkarılan ürün listesi
// Fiyatlar görseldeki 'Satış Fiyatı' sütunundan alındı
const PRODUCTS = [
  // Profiller
  { baseCode: '357014', name: 'VELA 24 MM - RAY PRF-CONTALI', type: 'cam_balkon_profiller', prices: { eloksal: 872.73, bronz: 872.73, antrasit: 902.39, ral: 908.51 } },
  { baseCode: '357012', name: 'VELA 24 MM - YAN PRF TIRNAKLI', type: 'cam_balkon_profiller', prices: { eloksal: 238.03, bronz: 238.03, antrasit: 246.12, ral: 247.78 } },
  { baseCode: '357001', name: 'VELA 24 MM - KANAT PRF-24', type: 'cam_balkon_profiller', prices: { eloksal: 497.46, bronz: 497.46, antrasit: 514.37, ral: 517.87 } },
  { baseCode: '357003', name: 'VELA 24 MM - ARA KANAT KPK PR-24', type: 'cam_balkon_profiller', prices: { eloksal: 127.41, bronz: 127.41, antrasit: 131.75, ral: 132.65 } },
  { baseCode: '357004', name: 'VELA 24 MM - İÇ İÇE PR DIS-24', type: 'cam_balkon_profiller', prices: { eloksal: 194.00, bronz: 194.00, antrasit: 200.60, ral: 201.98 }, specialSuffix: '_DIS' },
  { baseCode: '357005', name: 'VELA 24 MM - İÇ İÇE PR İÇ-24', type: 'cam_balkon_profiller', prices: { eloksal: 158.11, bronz: 158.11, antrasit: 163.50, ral: 164.59 }, specialSuffix: '_IC' }, // Kodda IC/DIS ayrımı var ama base code farklı olabilir mi? Görselde 357005
  // Kodda iç içe profil için 356646 kodu kullanılmış (DIS/IC). Ancak görselde 357004 ve 357005 var.
  // Kod ile excel arasındaki uyuşmazlık: Kodda 356646 kullanılıyor, Excel'de 357004/357005.
  // Bu durumda kod tarafını güncellemek gerekecek veya veriyi kodun beklediği formata uydurmak gerekecek.
  // Kodda: 356646_4447_0_DIS ve 356646_4447_0_IC
  // Biz Excel'deki fiyatı alıp kodun beklediği ID ile kaydedelim.
  { codeOverride: '356646', name: 'IÇ İÇE PROFIL ( DIS )', type: 'cam_balkon_profiller', prices: { eloksal: 194.00, bronz: 194.00, antrasit: 200.60, ral: 201.98 }, specialSuffix: '_DIS' },
  { codeOverride: '356646', name: 'IÇ İÇE PROFIL ( IÇ )', type: 'cam_balkon_profiller', prices: { eloksal: 158.11, bronz: 158.11, antrasit: 163.50, ral: 164.59 }, specialSuffix: '_IC' },
  
  { baseCode: '357007', name: 'VELA 24 MM - KÖŞE DÖNÜŞ PASİF-24', type: 'cam_balkon_profiller', prices: { eloksal: 128.58, bronz: 128.58, antrasit: 132.94, ral: 133.86 } },
  // Kodda Köşe Dönüş Pasif için 356650 kullanılmış.
  { codeOverride: '356650', name: 'KÖSE DÖNÜS PASIF PRO', type: 'cam_balkon_profiller', prices: { eloksal: 128.58, bronz: 128.58, antrasit: 132.94, ral: 133.86 } },

  { baseCode: '357008', name: 'VELA 24 MM - KÖŞE DÖNÜŞ ADAPTÖR', type: 'cam_balkon_profiller', prices: { eloksal: 108.30, bronz: 108.30, antrasit: 112.00, ral: 112.74 } },
  
  { baseCode: '357019', name: 'VELA 24 MM - KASA UZATMA PR-83', type: 'cam_balkon_profiller', prices: { eloksal: 572.16, bronz: 572.16, antrasit: 591.61, ral: 595.63 } },
  
  { baseCode: '357006', name: 'VELA 24 MM - KÖŞE DÖNÜŞ PR-24', type: 'cam_balkon_profiller', prices: { eloksal: 205.02, bronz: 205.02, antrasit: 211.98, ral: 213.44 } },
  // Kodda Aktif Profil 356649
  { codeOverride: '356649', name: 'KÖSE DÖNÜS AKTIF PRO', type: 'cam_balkon_profiller', prices: { eloksal: 205.02, bronz: 205.02, antrasit: 211.98, ral: 213.44 } },

  // Ara Kanat Kapak Profil (Kodda 356645)
  // Excel listesinde Ara Kanat Kapak 357003.
  // Kodda 356645 kullanılmış. Eşleştiriyoruz.
  { codeOverride: '356645', name: 'ARA KANAT KAPAK PROF', type: 'cam_balkon_profiller', prices: { eloksal: 127.41, bronz: 127.41, antrasit: 131.75, ral: 132.65 } },

  // Kilit PR-24 (Kodda 356628) - Excel'de yok, tahminen İç İçe ile benzer fiyatta olabilir veya başka bir kod.
  // Şimdilik varsayılan bir fiyat verelim (İç içe profil ortalaması)
  { codeOverride: '356628', name: 'KILIT PR-24', type: 'cam_balkon_profiller', prices: { eloksal: 150.00, bronz: 150.00, antrasit: 160.00, ral: 165.00 } },

  // Köşe Dönüş Boru (Kodda 356739) - Excel'de yok
  { codeOverride: '356739', name: 'KOSE DONUS BORU', type: 'cam_balkon_profiller', prices: { eloksal: 100.00, bronz: 100.00, antrasit: 110.00, ral: 115.00 } },

  // Aksesuarlar (Renk bağımsız veya standart gri/siyah)
  { baseCode: '356985_256', name: 'MENTEŞE-KANAT TUTUCU', type: 'cam_balkon_aksesuar', price: 241.95 },
  // Kodda Menteşeli Kanat Takımı 356819
  { codeOverride: '356819_429', name: 'MENTEŞELİ KANAT TAKIMI', type: 'cam_balkon_aksesuar', price: 241.95 },

  { baseCode: '356902_0', name: 'ECO BELLA İSP.KİT', type: 'cam_balkon_aksesuar', price: 1482.78 },
  { baseCode: '356855_0', name: 'TEKERLEK SETİ', type: 'cam_balkon_aksesuar', price: 59.56 }, // Turuncu 64
  { baseCode: '356987_0', name: 'İSPANYOLET PİM SETİ', type: 'cam_balkon_aksesuar', price: 105.80 },
  { baseCode: '356861_0', name: 'BAKLA-1', type: 'cam_balkon_aksesuar', price: 31.80 }, // Bakla-1
  // Kodda Bakla-5 (356865)
  { codeOverride: '356865_0', name: 'BAKLA-5', type: 'cam_balkon_aksesuar', price: 138.39 }, // Excelde Bakla-5 138.39

  { baseCode: '356860_429', name: 'KÖŞE TAKOZU', type: 'cam_balkon_aksesuar', price: 38.19 },
  { baseCode: '356979_0', name: 'TAPA', type: 'cam_balkon_aksesuar', price: 11.48 },
  
  // Fırça Contalar
  { baseCode: '19735_256', name: 'FIRÇA CONTA-4.8*8', type: 'cam_balkon_aksesuar', price: 13.12 },
  { baseCode: '19737_256', name: 'FIRÇA CONTA-4.8*10', type: 'cam_balkon_aksesuar', price: 13.48 },
  // Kodda 4.8*550 için 12963 kodu var
  { codeOverride: '12963_256', name: 'FIRÇA CONTA-4.8*550', type: 'cam_balkon_aksesuar', price: 15.00 }, // Tahmini

  // Zamak Köşe Dönüş (356922)
  { codeOverride: '356922_0', name: 'ZAMAK KOSE DONUS', type: 'cam_balkon_aksesuar', price: 50.00 }, // Tahmini
];

function generateStockCode(baseCode: any, colorSuffix: any, specialSuffix = '') {
  // Eğer baseCode zaten full ise (aksesuar gibi)
  if (baseCode && baseCode.includes('_')) {
    return `${baseCode}${specialSuffix}`;
  }
  // Profil ise: Kod_Renk_0 şeklinde
  // Ancak kodda bazen renk kodu sona gelmiyor, ortada oluyor.
  // Örnek: 357014_4447_0
  return `${baseCode}_${colorSuffix}_0${specialSuffix}`;
}

function run() {
  const pricesPath = path.join(__dirname, '../data/product-prices.json');
  const existingData = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  
  const newProducts: any[] = [];

  PRODUCTS.forEach((p: any) => {
    if (p.type === 'cam_balkon_profiller' && p.prices) {
      // Her renk için varyasyon oluştur
      Object.entries(COLORS).forEach(([colorKey, colorInfo]) => {
        const price = (p.prices as any)[colorKey];
        const codeBase = p.codeOverride || p.baseCode;
        const stockCode = generateStockCode(codeBase, colorInfo.suffix, p.specialSuffix);
        
        newProducts.push({
          stock_code: stockCode,
          description: `${p.name} ${colorInfo.name.toUpperCase()}`,
          type: p.type,
          color: colorKey,
          unit: 'Metre',
          price: String(price),
          currency: 'TRY'
        });
      });
    } else {
      // Aksesuar veya tek fiyatlı ürün
      const codeBase = p.codeOverride || p.baseCode;
      // Aksesuarların kodu genelde sabittir, sonuna _0 ekleyelim eğer yoksa ve kod istiyorsa
      let stockCode = codeBase;
      if (stockCode && !stockCode.includes('_') && !p.codeOverride) {
         stockCode = `${codeBase}_0_0`; // Basit mantık
      } else if (p.codeOverride) {
         stockCode = `${p.codeOverride}_0`; // Override varsa sonuna _0
      }
      // Düzeltme: Aksesuarların formatı kodda 356855_0_0 şeklinde (Tekerlek Seti)
      // Excelde 356855_64 vs var.
      // Biz kodun beklediği formata sadık kalalım.
      
      newProducts.push({
        stock_code: stockCode,
        description: p.name,
        type: p.type,
        color: 'standart',
        unit: 'Adet',
        price: String(p.price),
        currency: 'TRY'
      });
    }
  });

  // Mevcut veriyi güncelle
  existingData.product_prices['cam_balkon'] = newProducts;

  fs.writeFileSync(pricesPath, JSON.stringify(existingData, null, 2));
  console.log(`✅ ${newProducts.length} cam balkon ürünü eklendi/güncellendi.`);
}

run();

