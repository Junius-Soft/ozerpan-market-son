"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  ArrowRight, TrendingUp, TrendingDown, Minus, X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ExcelRow {
  stokKodu: string;
  aciklama: string;
  uretici: string;
  renk: string;
  paraBirimi: string;
  satisFiyati: number;
}

interface PriceChange {
  id: string;
  stockCode: string;
  description: string;
  currentPrice: number;
  newPrice: number;
  currency: string;
  diff: number;
  pctChange: number;
}

interface ExcelUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ExcelUploadDialog({ open, onClose, onComplete }: ExcelUploadDialogProps) {
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "done">("upload");
  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [notFound, setNotFound] = useState<ExcelRow[]>([]);
  const [noChange, setNoChange] = useState<number>(0);
  const [result, setResult] = useState<{ successCount: number; errorCount: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const reset = () => {
    setStep("upload");
    setChanges([]);
    setNotFound([]);
    setNoChange(0);
    setResult(null);
    setFileName("");
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const parseExcel = useCallback(async (file: File) => {
    setIsLoading(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

      // Sütun isimlerini eşle
      const parsed: ExcelRow[] = rawData.map((row) => ({
        stokKodu: String(row["Stok kodu"] || row["stok kodu"] || row["STOK KODU"] || row["Stok Kodu"] || "").trim(),
        aciklama: String(row["Açıklama"] || row["açıklama"] || row["AÇIKLAMA"] || row["Aciklama"] || "").trim(),
        uretici: String(row["Üretici"] || row["üretici"] || row["ÜRETICI"] || row["Uretici"] || "").trim(),
        renk: String(row["Renk"] || row["renk"] || row["RENK"] || "").trim(),
        paraBirimi: String(row["Para birimi"] || row["para birimi"] || row["PARA BİRİMİ"] || row["Para Birimi"] || "EUR").trim(),
        satisFiyati: Math.round(parseFloat(String(row["Satış liste fiyatı"] || row["satış liste fiyatı"] || row["SATIŞ LİSTE FİYATI"] || row["Satış Liste Fiyatı"] || row["Satis liste fiyati"] || 0)) * 100) / 100,
      })).filter((r) => r.stokKodu && !isNaN(r.satisFiyati) && r.satisFiyati > 0);

      // Veritabanındaki mevcut fiyatlarla karşılaştır
      const stockCodes = parsed.map((p) => p.stokKodu);

      // Stok kodlarıyla eşleşen ürünleri DB'den getir
      const { data: dbItems, error } = await supabase
        .from("product_prices")
        .select("id, stock_code, description, price, currency")
        .in("stock_code", stockCodes);

      if (error) {
        console.error("DB sorgulama hatası:", error);
        setIsLoading(false);
        return;
      }

      // stock_code -> db item map
      const dbMap = new Map(
        (dbItems || []).map((item) => [item.stock_code, item])
      );

      const changedItems: PriceChange[] = [];
      const notFoundItems: ExcelRow[] = [];
      let unchangedCount = 0;

      for (const excelItem of parsed) {
        const dbItem = dbMap.get(excelItem.stokKodu);
        if (!dbItem) {
          notFoundItems.push(excelItem);
          continue;
        }

        const currentPrice = Math.round(Number(dbItem.price) * 100) / 100;
        const newPrice = excelItem.satisFiyati;

        if (currentPrice === newPrice) {
          unchangedCount++;
          continue;
        }

        const diff = newPrice - currentPrice;
        const pctChange = currentPrice > 0 ? (diff / currentPrice) * 100 : 0;

        changedItems.push({
          id: dbItem.id,
          stockCode: excelItem.stokKodu,
          description: dbItem.description,
          currentPrice,
          newPrice,
          currency: dbItem.currency || excelItem.paraBirimi,
          diff,
          pctChange,
        });
      }

      setChanges(changedItems);
      setNotFound(notFoundItems);
      setNoChange(unchangedCount);
      setStep("preview");
    } catch (err) {
      console.error("Excel okuma hatası:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      parseExcel(file);
    }
  };

  const handleApplyChanges = async () => {
    if (changes.length === 0) return;
    setStep("processing");

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action: "excel_update",
          updates: changes.map((c) => ({ id: c.id, price: c.newPrice })),
        }),
      });

      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch {
      setResult({ successCount: 0, errorCount: changes.length });
      setStep("done");
    }
  };

  const removeChange = (id: string) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {step === "upload" && "Excel ile Fiyat Güncelleme"}
            {step === "preview" && "Fiyat Değişikliklerini Onaylayın"}
            {step === "processing" && "Güncelleniyor..."}
            {step === "done" && "Güncelleme Tamamlandı"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="py-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/30"
              }`}
              onClick={() => document.getElementById("excel-file-input")?.click()}
            >
              {isLoading ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    <strong>{fileName}</strong> analiz ediliyor...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Upload className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium">Excel dosyasını sürükleyip bırakın</p>
                    <p className="text-sm text-muted-foreground mt-1">veya tıklayarak seçin</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Desteklenen format: .xlsx, .xls
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <span className="font-mono">Stok kodu | Açıklama | Üretici | Renk | Para birimi | Satış liste fiyatı</span>
                  </div>
                </div>
              )}
            </div>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && (
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/30">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{changes.length}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Değişecek</p>
              </div>
              <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-950/10 border-gray-200 dark:border-gray-800/30">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">{noChange}</p>
                <p className="text-xs text-gray-600 dark:text-gray-500">Değişmedi</p>
              </div>
              <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{notFound.length}</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Bulunamadı</p>
              </div>
            </div>

            {/* Changes Table */}
            {changes.length > 0 ? (
              <div className="flex-1 overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Stok Kodu</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Mevcut Fiyat</TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="text-right">Yeni Fiyat</TableHead>
                      <TableHead className="text-right">Değişim</TableHead>
                      <TableHead className="w-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {changes.map((item, i) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{item.stockCode}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={item.description}>
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {item.currentPrice.toFixed(2)} <span className="text-xs text-muted-foreground">{item.currency}</span>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-semibold">
                          {item.newPrice.toFixed(2)} <span className="text-xs text-muted-foreground">{item.currency}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            item.diff > 0
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}>
                            {item.diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {item.diff > 0 ? "+" : ""}{item.pctChange.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-red-600"
                            onClick={() => removeChange(item.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <Minus className="h-10 w-10 mx-auto opacity-40" />
                  <p className="font-medium">Fiyat değişikliği bulunamadı</p>
                  <p className="text-sm">Excel dosyasındaki fiyatlar mevcut fiyatlarla aynı.</p>
                </div>
              </div>
            )}

            {/* Not found items */}
            {notFound.length > 0 && (
              <details className="rounded-lg border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/10">
                <summary className="px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 cursor-pointer">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5" />
                  {notFound.length} ürün veritabanında bulunamadı
                </summary>
                <div className="px-3 pb-2 space-y-1">
                  {notFound.slice(0, 10).map((item, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-500">
                      <span className="font-mono">{item.stokKodu}</span> — {item.aciklama}
                    </p>
                  ))}
                  {notFound.length > 10 && (
                    <p className="text-xs text-amber-500">...ve {notFound.length - 10} ürün daha</p>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">
              {changes.length} ürün fiyatı güncelleniyor...
            </p>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && result && (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Güncelleme Tamamlandı!</p>
              <p className="text-sm text-muted-foreground">
                <strong className="text-emerald-600">{result.successCount}</strong> ürün başarıyla güncellendi
                {result.errorCount > 0 && (
                  <>, <strong className="text-red-600">{result.errorCount}</strong> hata oluştu</>
                )}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>İptal</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { reset(); }}>
                Geri
              </Button>
              <Button
                onClick={handleApplyChanges}
                disabled={changes.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {changes.length} Fiyatı Güncelle
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => { handleClose(); onComplete(); }}>
              Tamam
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
