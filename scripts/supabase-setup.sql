-- =============================================
-- Ozerpan Market - Fiyat Listesi Tablosu
-- Bu SQL'i Supabase SQL Editor'de çalıştırın
-- =============================================

-- 1. Tablo oluştur
CREATE TABLE IF NOT EXISTS product_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Ürün bilgileri
  product_category TEXT NOT NULL,           -- 'panjur', 'sineklik', 'kepenk', 'cam_balkon'
  item_type TEXT NOT NULL DEFAULT 'price',  -- 'price' veya 'accessory'
  description TEXT NOT NULL,
  stock_code TEXT,
  uretici_kodu TEXT,
  type TEXT,                                -- 'panjur_lamel_profilleri', 'panjur_kutu_profilleri' vb.
  color TEXT,
  unit TEXT,                                -- 'Metre', 'Adet', 'Takım'
  
  -- Fiyat bilgileri
  price DECIMAL(10,2) NOT NULL,
  previous_price DECIMAL(10,2),             -- Bir önceki fiyat
  currency TEXT DEFAULT 'EUR',
  
  -- Tarih bilgileri
  price_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexler
CREATE INDEX IF NOT EXISTS idx_product_prices_category ON product_prices(product_category);
CREATE INDEX IF NOT EXISTS idx_product_prices_type ON product_prices(type);
CREATE INDEX IF NOT EXISTS idx_product_prices_stock_code ON product_prices(stock_code);
CREATE INDEX IF NOT EXISTS idx_product_prices_item_type ON product_prices(item_type);
CREATE INDEX IF NOT EXISTS idx_product_prices_uretici_kodu ON product_prices(uretici_kodu);

-- 3. Fiyat güncelleme trigger'ı
-- Fiyat değiştiğinde otomatik olarak:
-- 1. Eski fiyatı previous_price'a kaydet
-- 2. price_updated_at'ı güncelle
CREATE OR REPLACE FUNCTION update_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    NEW.previous_price = OLD.price;
    NEW.price_updated_at = NOW();
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı oluştur (varsa önce sil)
DROP TRIGGER IF EXISTS trigger_price_update ON product_prices;
CREATE TRIGGER trigger_price_update
  BEFORE UPDATE ON product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_price_history();

-- 4. RLS (Row Level Security) aktif et
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- 5. RLS Politikaları
-- Herkes okuyabilir (anonim dahil)
DROP POLICY IF EXISTS "product_prices_select" ON product_prices;
CREATE POLICY "product_prices_select" ON product_prices
  FOR SELECT
  USING (true);

-- Sadece admin güncelleyebilir
DROP POLICY IF EXISTS "product_prices_update" ON product_prices;
CREATE POLICY "product_prices_update" ON product_prices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Sadece admin ekleyebilir
DROP POLICY IF EXISTS "product_prices_insert" ON product_prices;
CREATE POLICY "product_prices_insert" ON product_prices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Sadece admin silebilir
DROP POLICY IF EXISTS "product_prices_delete" ON product_prices;
CREATE POLICY "product_prices_delete" ON product_prices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 6. Doğrulama
-- Tablo oluşturulduğunu kontrol et
SELECT 'product_prices tablosu başarıyla oluşturuldu!' AS message;
SELECT count(*) as policy_count FROM pg_policies WHERE tablename = 'product_prices';
