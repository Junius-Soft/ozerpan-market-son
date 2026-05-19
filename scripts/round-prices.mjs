/**
 * Supabase'deki tüm fiyatları 2 basamağa yuvarla.
 * Kullanım: node scripts/round-prices.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const envFile = await fs.readFile(path.join(rootDir, '.env'), 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

// Tüm fiyatları çek
console.log('📊 Supabase fiyatları kontrol ediliyor...');
const { data: allPrices, error } = await supabase
  .from('product_prices')
  .select('id, price, description');

if (error) {
  console.error('❌ Hata:', error.message);
  process.exit(1);
}

// 2 basamaktan fazla olanları bul
const toFix = allPrices.filter(item => {
  const rounded = Math.round(item.price * 100) / 100;
  return Math.abs(item.price - rounded) > 0.000001;
});

console.log(`   Toplam kayıt: ${allPrices.length}`);
console.log(`   Düzeltilmesi gereken: ${toFix.length}`);

if (toFix.length === 0) {
  console.log('✅ Tüm fiyatlar zaten 2 basamaklı!');
  process.exit(0);
}

// Örnekler göster
console.log('\n📋 Düzeltilecek örnekler:');
toFix.slice(0, 10).forEach(item => {
  const rounded = Math.round(item.price * 100) / 100;
  console.log(`   ${item.price} → ${rounded.toFixed(2)}  (${item.description?.substring(0, 40)})`);
});
if (toFix.length > 10) console.log(`   ... ve ${toFix.length - 10} tane daha`);

// Güncelle
console.log('\n📤 Güncelleniyor...');
let success = 0;
let errors = 0;

for (const item of toFix) {
  const rounded = Math.round(item.price * 100) / 100;
  const { error: updateErr } = await supabase
    .from('product_prices')
    .update({ price: rounded })
    .eq('id', item.id);

  if (updateErr) {
    errors++;
  } else {
    success++;
  }
}

console.log(`\n🎉 Tamamlandı! ${success} fiyat düzeltildi${errors > 0 ? `, ${errors} hata` : ''}`);
