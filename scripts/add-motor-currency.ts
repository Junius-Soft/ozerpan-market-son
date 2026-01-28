import fs from "fs";
import path from "path";

const pricesJsonPath = path.join(__dirname, "../data/product-prices.json");

function addMotorCurrency() {
  try {
    console.log("JSON dosyası okunuyor...");
    const pricesData = JSON.parse(fs.readFileSync(pricesJsonPath, "utf8"));
    
    let updatedCount = 0;

    // Tüm kategorileri kontrol et
    for (const [category, items] of Object.entries(pricesData.product_prices)) {
      if (!Array.isArray(items)) continue;

      for (const item of items as any[]) {
        // Motor tipi kontrolü
        if (item.type === "panjur_motorlar" || item.type === "kepenk_motorlar") {
          // Eğer currency yoksa veya TRY ise EUR yap
          if (!item.currency || item.currency === "TRY") {
            item.currency = "EUR";
            updatedCount++;
            console.log(`  ✓ [${category}] ${item.description || item.stock_code}: currency → EUR`);
          }
        }
      }
    }

    // Güncellenmiş veriyi kaydet
    console.log("\n💾 Güncellenmiş veriler kaydediliyor...");
    fs.writeFileSync(
      pricesJsonPath,
      JSON.stringify(pricesData, null, 2),
      "utf8"
    );

    console.log("\n✅ Motor fiyatlarına currency eklendi!");
    console.log(`📊 Toplam güncellenen: ${updatedCount} motor ürünü`);

  } catch (error: any) {
    console.error("❌ Hata oluştu:", error.message);
    console.error(error);
    process.exit(1);
  }
}

addMotorCurrency();
