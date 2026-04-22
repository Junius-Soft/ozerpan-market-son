/**
 * Migration Script: JSON → Supabase
 * 
 * Bu script data/product-prices.json ve data/accessories.json
 * dosyalarındaki fiyatları Supabase'e aktarır.
 * 
 * Kullanım:
 *   npx tsx scripts/migrate-prices-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Migration için service_role key kullan (RLS bypass)
// Yoksa anon key ile dene
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY (veya NEXT_PUBLIC_SUPABASE_ANON_KEY) .env dosyasında tanımlı olmalı!');
  console.error('💡 Service role key için: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY bulunamadı, anon key ile deneniyor...');
  console.warn('   RLS aktifse bu çalışmayabilir. Service role key eklemeniz önerilir.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PriceItem {
  description: string;
  stock_code?: string;
  uretici_kodu?: string;
  type?: string;
  color?: string;
  unit?: string;
  price: string;
  currency?: string;
}

interface ProductPricesData {
  product_prices: Record<string, PriceItem[]>;
}

interface AccessoriesData {
  accessories: Record<string, PriceItem[]>;
}

async function migrate() {
  console.log('🚀 Fiyat listesi migration başlıyor...\n');

  // JSON dosyalarını oku
  const pricesPath = path.join(process.cwd(), 'data', 'product-prices.json');
  const accessoriesPath = path.join(process.cwd(), 'data', 'accessories.json');

  const pricesData: ProductPricesData = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));
  const accessoriesData: AccessoriesData = JSON.parse(fs.readFileSync(accessoriesPath, 'utf8'));

  // Önce mevcut verileri sil (temiz başlangıç)
  console.log('🗑️  Mevcut veriler temizleniyor...');
  const { error: deleteError } = await supabase
    .from('product_prices')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Tüm satırları sil

  if (deleteError) {
    console.error('❌ Silme hatası:', deleteError.message);
    console.log('ℹ️  Tablo boş olabilir, devam ediyorum...');
  }

  let totalInserted = 0;
  let totalErrors = 0;

  // Product prices'ları aktar
  for (const [category, items] of Object.entries(pricesData.product_prices)) {
    console.log(`\n📦 Kategori: ${category} (${items.length} ürün)`);
    
    const records = items.map((item: PriceItem) => ({
      product_category: category,
      item_type: 'price',
      description: item.description,
      stock_code: item.stock_code || null,
      uretici_kodu: item.uretici_kodu || null,
      type: item.type || null,
      color: item.color || null,
      unit: item.unit || null,
      price: parseFloat(item.price),
      previous_price: null,
      currency: item.currency || 'EUR',
    }));

    // Batch insert (Supabase max ~1000 per request)
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from('product_prices')
        .insert(batch);

      if (error) {
        console.error(`  ❌ Batch ${i / batchSize + 1} hatası:`, error.message);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ Batch ${i / batchSize + 1}: ${batch.length} ürün eklendi`);
      }
    }
  }

  // Accessories'ları aktar
  for (const [category, items] of Object.entries(accessoriesData.accessories)) {
    console.log(`\n🔧 Aksesuar: ${category} (${items.length} ürün)`);
    
    const records = items.map((item: PriceItem) => ({
      product_category: category,
      item_type: 'accessory',
      description: item.description,
      stock_code: item.stock_code || null,
      uretici_kodu: item.uretici_kodu || null,
      type: item.type || null,
      color: item.color || null,
      unit: item.unit || null,
      price: parseFloat(item.price),
      previous_price: null,
      currency: item.currency || 'EUR',
    }));

    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from('product_prices')
        .insert(batch);

      if (error) {
        console.error(`  ❌ Batch ${i / batchSize + 1} hatası:`, error.message);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
        console.log(`  ✅ Batch ${i / batchSize + 1}: ${batch.length} aksesuar eklendi`);
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Toplam eklenen: ${totalInserted}`);
  if (totalErrors > 0) {
    console.log(`❌ Toplam hata: ${totalErrors}`);
  }
  console.log('🎉 Migration tamamlandı!');
}

migrate().catch(console.error);
