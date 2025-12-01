import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel kolon isimleri
const COLUMN_HEADERS = {
  stockCode: "stok kodu",
  description: "açıklama",
  currency: "para birimi",
  purchasePrice: "alış liste fiyatı",
  salesPrice: "satış liste fiyatı",
};

interface ExcelRow {
  stock_code: string;
  description: string;
  currency: string;
  purchase_price: number;
  sales_price: number;
}

interface ProductPriceItem {
  stock_code: string;
  price: string;
  [key: string]: any;
}

interface ProductPricesJson {
  product_prices: {
    [group: string]: ProductPriceItem[];
  };
}

interface AccessoriesJson {
  accessories: {
    [group: string]: ProductPriceItem[];
  };
}

function normalizeHeader(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeStockCode(value: any): string {
  return String(value || "").trim();
}

function parseNumber(value: any): number {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return value;
  const str = String(value).trim().replace(/\./g, "").replace(/,/g, ".");
  const n = Number(str);
  return Number.isFinite(n) ? n : NaN;
}

function loadExcelRows(excelPath: string): ExcelRow[] {
  console.log(`📖 Excel dosyası okunuyor: ${excelPath}`);

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel dosyası bulunamadı: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  console.log(`📊 Sheet adı: ${sheetName}`);

  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  }) as any[][];

  if (!data.length) {
    throw new Error("Excel dosyası boş");
  }

  const headerRow = data[0];

  // Header indekslerini bul
  const headerIndexMap: Record<keyof typeof COLUMN_HEADERS, number> = {
    stockCode: -1,
    description: -1,
    currency: -1,
    purchasePrice: -1,
    salesPrice: -1,
  };

  headerRow.forEach((cell, idx) => {
    const h = normalizeHeader(cell);
    (Object.keys(COLUMN_HEADERS) as (keyof typeof COLUMN_HEADERS)[]).forEach(
      (key) => {
        if (h === COLUMN_HEADERS[key]) {
          headerIndexMap[key] = idx;
        }
      }
    );
  });

  if (headerIndexMap.stockCode === -1) {
    throw new Error("'Stok kodu' kolonu bulunamadı");
  }

  if (headerIndexMap.salesPrice === -1 && headerIndexMap.purchasePrice === -1) {
    throw new Error(
      "'Satış liste fiyatı' veya 'Alış liste fiyatı' kolonlarından en az biri bulunmalı"
    );
  }

  console.log("🔍 Header indeksleri:", headerIndexMap);

  const rows: ExcelRow[] = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row.length) continue;

    const stock_code = normalizeStockCode(row[headerIndexMap.stockCode]);
    if (!stock_code) continue;

    const description =
      (headerIndexMap.description >= 0
        ? String(row[headerIndexMap.description] || "")
        : "") || "";

    const currency =
      headerIndexMap.currency >= 0
        ? String(row[headerIndexMap.currency] || "").trim().toUpperCase()
        : "";

    const purchase_price =
      headerIndexMap.purchasePrice >= 0
        ? parseNumber(row[headerIndexMap.purchasePrice])
        : NaN;

    const sales_price =
      headerIndexMap.salesPrice >= 0
        ? parseNumber(row[headerIndexMap.salesPrice])
        : NaN;

    rows.push({
      stock_code,
      description,
      currency,
      purchase_price,
      sales_price,
    });
  }

  console.log(`✅ Excel'den ${rows.length} satır okundu`);
  return rows;
}

function updateProductPrices(
  jsonPath: string,
  excelRows: ExcelRow[]
): { updated: number; notFound: number } {
  console.log(`📦 product-prices.json okunuyor: ${jsonPath}`);

  const raw = fs.readFileSync(jsonPath, "utf8");
  const data: ProductPricesJson = JSON.parse(raw);

  if (!data.product_prices) {
    throw new Error("product-prices.json formatı beklenen yapıda değil");
  }

  // Stok kodu → Excel satırı
  const excelMap = new Map<string, ExcelRow>();
  excelRows.forEach((row) => {
    if (!row.stock_code) return;
    excelMap.set(row.stock_code, row);
  });

  let updated = 0;
  let notFound = 0;

  const groups = Object.keys(data.product_prices);
  console.log(`📂 Ürün grupları: ${groups.join(", ")}`);

  groups.forEach((group) => {
    const items = data.product_prices[group];
    items.forEach((item) => {
      const code = normalizeStockCode(item.stock_code);
      if (!code) return;

      const excelRow = excelMap.get(code);
      if (!excelRow) {
        return;
      }

      // Para birimi kontrolü (varsa)
      if (excelRow.currency && excelRow.currency !== "EUR") {
        // Farklı para birimi ise şimdilik atla
        return;
      }

      const newPriceNumber = !Number.isNaN(excelRow.sales_price)
        ? excelRow.sales_price
        : excelRow.purchase_price;

      if (Number.isNaN(newPriceNumber)) {
        return;
      }

      const oldPrice = item.price;
      const newPrice = newPriceNumber.toString();

      if (oldPrice !== newPrice) {
        item.price = newPrice;
        updated++;
      }
    });
  });

  // Ters kontrol: Excel'de olup JSON'da olmayanlar
  excelRows.forEach((row) => {
    const code = normalizeStockCode(row.stock_code);
    if (!code) return;

    let exists = false;
    for (const group of Object.keys(data.product_prices)) {
      if (
        data.product_prices[group].some(
          (item) => normalizeStockCode(item.stock_code) === code
        )
      ) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      notFound++;
    }
  });

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`✅ Fiyat güncelleme tamamlandı. Güncellenen: ${updated}`);
  console.log(
    `ℹ️ Excel'de olup JSON'da bulunamayan stok kodu sayısı: ${notFound}`
  );

  return { updated, notFound };
}

function updateAccessoriesPrices(
  jsonPath: string,
  excelRows: ExcelRow[]
): { updated: number } {
  console.log(`📦 accessories.json okunuyor: ${jsonPath}`);

  const raw = fs.readFileSync(jsonPath, "utf8");
  const data: AccessoriesJson = JSON.parse(raw);

  if (!data.accessories) {
    throw new Error("accessories.json formatı beklenen yapıda değil");
  }

  const excelMap = new Map<string, ExcelRow>();
  excelRows.forEach((row) => {
    if (!row.stock_code) return;
    excelMap.set(row.stock_code, row);
  });

  let updated = 0;

  const groups = Object.keys(data.accessories);
  console.log(`📂 Aksesuar grupları: ${groups.join(", ")}`);

  groups.forEach((group) => {
    const items = data.accessories[group];
    items.forEach((item) => {
      const code = normalizeStockCode(item.stock_code);
      if (!code) return;

      const excelRow = excelMap.get(code);
      if (!excelRow) {
        return;
      }

      // Para birimi kontrolü (varsa)
      if (excelRow.currency && excelRow.currency !== "EUR") {
        // Farklı para birimi ise şimdilik atla
        return;
      }

      const newPriceNumber = !Number.isNaN(excelRow.sales_price)
        ? excelRow.sales_price
        : excelRow.purchase_price;

      if (Number.isNaN(newPriceNumber)) {
        return;
      }

      const oldPrice = item.price;
      const newPrice = newPriceNumber.toString();

      if (oldPrice !== newPrice) {
        item.price = newPrice;
        updated++;
      }
    });
  });

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");

  console.log(`✅ Aksesuar fiyat güncelleme tamamlandı. Güncellenen: ${updated}`);

  return { updated };
}

// Ana çalışma fonksiyonu
function main() {
  const excelPathArg = process.argv[2];
  const excelPath = excelPathArg
    ? path.resolve(excelPathArg)
    : path.join(__dirname, "../src/documents/fiyat_listesi_271125.xlsx");

  const pricesJsonPath = path.join(__dirname, "../data/product-prices.json");
  const accessoriesJsonPath = path.join(__dirname, "../data/accessories.json");

  const excelRows = loadExcelRows(excelPath);
  updateProductPrices(pricesJsonPath, excelRows);
  updateAccessoriesPrices(accessoriesJsonPath, excelRows);
}

main();


