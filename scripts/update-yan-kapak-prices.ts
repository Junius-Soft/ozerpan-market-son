import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const excelFilePath = path.join(__dirname, "../data/prices.xlsx");
const pricesJsonPath = path.join(__dirname, "../data/product-prices.json");
const accessoriesJsonPath = path.join(__dirname, "../data/accessories.json");

// Fiyatı 2 ondalık basamağa yuvarla
function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

// YAN KAPAK fiyatlarını güncelle
function updateYanKapakPrices() {
  try {
    console.log("Excel dosyası okunuyor...");
    
    if (!fs.existsSync(excelFilePath)) {
      console.error(`❌ Excel dosyası bulunamadı: ${excelFilePath}`);
      process.exit(1);
    }

    // Excel dosyasını oku
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = XLSX.utils.sheet_to_json(worksheet);
    
    if (excelData.length === 0) {
      console.error("❌ Excel dosyası boş!");
      process.exit(1);
    }

    console.log(`✅ Excel dosyası okundu. ${excelData.length} satır bulundu.`);
    console.log(`📋 Kolonlar: ${Object.keys(excelData[0]).join(", ")}`);

    // YAN KAPAK ile ilgili satırları filtrele
    const yanKapakRows = excelData.filter((row: any) => {
      const aciklama = String(row["Açıklama"] || "").toUpperCase();
      return aciklama.includes("YAN KAPAK");
    });

    console.log(`\n📦 ${yanKapakRows.length} YAN KAPAK ürünü bulundu.\n`);

    if (yanKapakRows.length === 0) {
      console.log("⚠️  YAN KAPAK ürünü bulunamadı!");
      return;
    }

    // Excel verilerini stock_code'a göre indexle
    const excelMap = new Map<string, any>();
    yanKapakRows.forEach((row: any) => {
      const stokKodu = String(row["Stok kodu"] || "").trim();
      if (stokKodu) {
        excelMap.set(stokKodu, row);
      }
    });

    console.log(`📊 Excel'de ${excelMap.size} benzersiz stok kodu bulundu.\n`);

    // product-prices.json dosyasını oku
    console.log("📄 product-prices.json dosyası okunuyor...");
    const pricesData = JSON.parse(fs.readFileSync(pricesJsonPath, "utf8"));
    
    // accessories.json dosyasını oku
    console.log("📄 accessories.json dosyası okunuyor...");
    const accessoriesData = JSON.parse(fs.readFileSync(accessoriesJsonPath, "utf8"));

    let updatedCountPrices = 0;
    let updatedCountAccessories = 0;
    let notFoundCount = 0;
    const notFoundItems: string[] = [];

    // product-prices.json'daki tüm kategorileri kontrol et
    console.log("\n🔍 product-prices.json'da YAN KAPAK aranıyor...");
    for (const [category, items] of Object.entries(pricesData.product_prices)) {
      if (!Array.isArray(items)) continue;

      for (const item of items as any[]) {
        const description = String(item.description || "").toUpperCase();
        const stockCode = String(item.stock_code || "").trim();
        
        if (description.includes("YAN KAPAK") && stockCode) {
          const excelRow = excelMap.get(stockCode);
          
          if (excelRow) {
            const priceValue = excelRow["Satış liste fiyatı"] || excelRow["Satış Liste Fiyatı"] || "";
            
            if (priceValue !== undefined && priceValue !== null && priceValue !== "") {
              let cleanPrice = String(priceValue).replace(/₺/g, "").replace(/\s/g, "").replace(/,/g, ".");
              const newPrice = roundPrice(parseFloat(cleanPrice));
              
              if (!isNaN(newPrice) && newPrice > 0) {
                const oldPrice = item.price;
                item.price = newPrice.toFixed(2);
                updatedCountPrices++;
                console.log(`  ✓ [${category}] ${item.description || item.stock_code}: ${oldPrice} → ${item.price}`);
              }
            }
          } else {
            notFoundCount++;
            if (notFoundItems.length < 10) {
              notFoundItems.push(`${category}: ${item.description || item.stock_code}`);
            }
          }
        }
      }
    }

    // accessories.json'daki tüm kategorileri kontrol et
    console.log("\n🔍 accessories.json'da YAN KAPAK aranıyor...");
    console.log(`📋 accessories.json yapısı: ${Object.keys(accessoriesData).join(", ")}`);
    
    // accessories.json yapısı: { accessories: { panjur: [...], kepenk: [...] } }
    const accessoriesCategories = accessoriesData.accessories || accessoriesData;
    
    for (const [category, items] of Object.entries(accessoriesCategories)) {
      if (!Array.isArray(items)) continue;

      for (const item of items as any[]) {
        const description = String(item.description || item.name || "").toUpperCase();
        const stockCode = String(item.stock_code || item.code || "").trim();
        
        if (description.includes("YAN KAPAK") && stockCode) {
          const excelRow = excelMap.get(stockCode);
          
          if (excelRow) {
            const priceValue = excelRow["Satış liste fiyatı"] || excelRow["Satış Liste Fiyatı"] || "";
            
            if (priceValue !== undefined && priceValue !== null && priceValue !== "") {
              let cleanPrice = String(priceValue).replace(/₺/g, "").replace(/\s/g, "").replace(/,/g, ".");
              const newPrice = roundPrice(parseFloat(cleanPrice));
              
              if (!isNaN(newPrice) && newPrice > 0) {
                const oldPrice = item.price;
                item.price = newPrice.toFixed(2);
                updatedCountAccessories++;
                console.log(`  ✓ [${category}] ${item.description || item.name || item.stock_code}: ${oldPrice} → ${item.price}`);
              } else {
                console.log(`  ⚠️  [${category}] ${item.description || item.name || item.stock_code}: Geçersiz fiyat: ${priceValue} (temizlenmiş: ${cleanPrice})`);
              }
            } else {
              console.log(`  ⚠️  [${category}] ${item.description || item.name || item.stock_code}: Fiyat bulunamadı`);
            }
          } else {
            // Debug: İlk birkaç bulunamayan için Excel'deki stock code'ları göster
            if (notFoundCount < 3) {
              console.log(`  ⚠️  [${category}] ${item.description || item.name || item.stock_code}: Excel'de bulunamadı (Stock Code: ${stockCode})`);
              console.log(`      Excel'deki ilk 3 stock code: ${Array.from(excelMap.keys()).slice(0, 3).join(", ")}`);
            }
            notFoundCount++;
            if (notFoundItems.length < 10) {
              notFoundItems.push(`${category}: ${item.description || item.name || item.stock_code} (${stockCode})`);
            }
          }
        }
      }
    }

    // Güncellenmiş verileri kaydet
    console.log("\n💾 Güncellenmiş fiyatlar kaydediliyor...");
    fs.writeFileSync(
      pricesJsonPath,
      JSON.stringify(pricesData, null, 2),
      "utf8"
    );
    
    fs.writeFileSync(
      accessoriesJsonPath,
      JSON.stringify(accessoriesData, null, 2),
      "utf8"
    );

    console.log("\n✅ YAN KAPAK fiyat güncelleme tamamlandı!");
    console.log(`📊 İstatistikler:`);
    console.log(`   - product-prices.json'da güncellenen: ${updatedCountPrices} ürün`);
    console.log(`   - accessories.json'da güncellenen: ${updatedCountAccessories} ürün`);
    console.log(`   - Toplam güncellenen: ${updatedCountPrices + updatedCountAccessories} ürün`);
    console.log(`   - Bulunamayan: ${notFoundCount} ürün`);
    
    if (notFoundItems.length > 0) {
      console.log(`\n⚠️  Bulunamayan ilk 10 ürün:`);
      notFoundItems.forEach(item => console.log(`   - ${item}`));
      if (notFoundCount > 10) {
        console.log(`   ... ve ${notFoundCount - 10} ürün daha`);
      }
    }

  } catch (error: any) {
    console.error("❌ Hata oluştu:", error.message);
    console.error(error);
    process.exit(1);
  }
}

updateYanKapakPrices();
