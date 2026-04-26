/**
 * Supabase'deki mevcut verileri kontrol et ve eksik olanları aktar.
 * product-prices.json ve accessories.json'daki tüm veriler,
 * tekrar eden stok kodları olmadan Supabase'e aktarılır.
 * 
 * Kullanım: node scripts/sync-all-prices.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// .env dosyasını oku
const envFile = await fs.readFile(path.join(rootDir, '.env'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 1. Supabase'deki mevcut stok kodlarını al
console.log('📊 Supabase\'deki mevcut kayıtlar kontrol ediliyor...');
const { data: existing, error: fetchError, count } = await supabase
  .from('product_prices')
  .select('stock_code, description', { count: 'exact' });

if (fetchError) {
  console.error('❌ Supabase sorgulama hatası:', fetchError.message);
  process.exit(1);
}

console.log(`   Supabase\'de mevcut kayıt sayısı: ${count}`);

const existingCodes = new Set(
  (existing || []).map(e => e.stock_code).filter(Boolean)
);
const existingDescs = new Set(
  (existing || []).map(e => e.description).filter(Boolean)
);

// 2. JSON dosyalarını oku
const productPricesRaw = JSON.parse(
  await fs.readFile(path.join(rootDir, 'data', 'product-prices.json'), 'utf8')
);
const accessoriesRaw = JSON.parse(
  await fs.readFile(path.join(rootDir, 'data', 'accessories.json'), 'utf8')
);

// 3. Tüm ürünleri topla
const allItems = [];
const seenCodes = new Set();

// product-prices.json
for (const [category, items] of Object.entries(productPricesRaw.product_prices)) {
  for (const item of items) {
    const key = item.stock_code || item.description;
    if (seenCodes.has(key)) continue;
    seenCodes.add(key);
    
    allItems.push({
      product_category: category,
      item_type: 'product',
      description: item.description || '',
      stock_code: item.stock_code || null,
      uretici_kodu: item.uretici_kodu || null,
      type: item.type || null,
      color: item.color || null,
      unit: item.unit || null,
      price: parseFloat(item.price) || 0,
      currency: item.currency || 'EUR',
    });
  }
}

// accessories.json
for (const [category, items] of Object.entries(accessoriesRaw.accessories)) {
  for (const item of items) {
    const key = item.stock_code || item.description;
    if (seenCodes.has(key)) continue;
    seenCodes.add(key);
    
    allItems.push({
      product_category: category,
      item_type: 'accessory',
      description: item.description || '',
      stock_code: item.stock_code || null,
      uretici_kodu: item.uretici_kodu || null,
      type: item.type || null,
      color: item.color || null,
      unit: item.unit || null,
      price: parseFloat(item.price) || 0,
      currency: item.currency || 'EUR',
    });
  }
}

console.log(`📁 JSON dosyalarındaki toplam benzersiz ürün: ${allItems.length}`);
console.log(`   product-prices.json kategorileri: ${Object.keys(productPricesRaw.product_prices).join(', ')}`);
console.log(`   accessories.json kategorileri: ${Object.keys(accessoriesRaw.accessories).join(', ')}`);

// 4. Supabase'de olmayanları bul
const toInsert = allItems.filter(item => {
  if (item.stock_code && existingCodes.has(item.stock_code)) return false;
  if (!item.stock_code && existingDescs.has(item.description)) return false;
  return true;
});

console.log(`\n🔍 Eksik kayıt sayısı: ${toInsert.length}`);

if (toInsert.length === 0) {
  console.log('✅ Tüm veriler zaten Supabase\'de mevcut!');
  process.exit(0);
}

// Kategorilere göre dağılım
const categoryCount = {};
toInsert.forEach(item => {
  const key = `${item.product_category} (${item.item_type})`;
  categoryCount[key] = (categoryCount[key] || 0) + 1;
});
console.log('\n📋 Eklenecek kayıtların dağılımı:');
for (const [cat, count] of Object.entries(categoryCount)) {
  console.log(`   ${cat}: ${count}`);
}

// 5. Supabase'e ekle (batch halinde)
console.log('\n📤 Supabase\'e ekleniyor...');
const batchSize = 50;
let insertedCount = 0;
let errorCount = 0;

for (let i = 0; i < toInsert.length; i += batchSize) {
  const batch = toInsert.slice(i, i + batchSize);
  
  const { error } = await supabase
    .from('product_prices')
    .insert(batch);
  
  if (error) {
    console.error(`   ❌ Batch ${Math.floor(i/batchSize) + 1} hatası:`, error.message);
    errorCount += batch.length;
  } else {
    insertedCount += batch.length;
    process.stdout.write(`   ✅ ${insertedCount}/${toInsert.length} eklendi\r`);
  }
}

console.log(`\n\n🎉 Tamamlandı!`);
console.log(`   Eklenen: ${insertedCount}`);
if (errorCount > 0) console.log(`   Hata: ${errorCount}`);

// 6. Son durum
const { count: finalCount } = await supabase
  .from('product_prices')
  .select('*', { count: 'exact', head: true });

console.log(`   Supabase\'deki toplam kayıt: ${finalCount}`);
