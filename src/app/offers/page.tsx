"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Offer, getOffers } from "@/documents/offers";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import MobileOffersGrid from "./MobileOffersGrid";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

export default function OffersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newOfferName, setNewOfferName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { eurRate, loading: isEurRateLoading } = useExchangeRate();

  const calculateOfferTotal = useMemo(() => {
    return (offer: Offer) => {
      const hasCamBalkon = offer.positions.some(
        (position) => position.productId === "cam-balkon"
      );
      if (hasCamBalkon) {
        const subtotal = offer.positions.reduce((sum, position) => {
          let priceTRY = position.unitPrice * position.quantity;
          if (position.currency?.code === "EUR") {
            priceTRY = priceTRY * (offer.eurRate ?? eurRate);
          }
          return sum + priceTRY;
        }, 0);
        const vat = subtotal * 0.2;
        const total = subtotal + vat;
        return "₺ " + total.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      const subtotal = offer.positions.reduce((sum, position) => {
        let priceEUR = position.unitPrice * position.quantity;
        if (position.currency?.code === "TRY") {
          priceEUR = priceEUR / (offer.eurRate ?? eurRate);
        }
        return sum + priceEUR;
      }, 0);
      const vat = subtotal * 0.2;
      return "€ " + (subtotal + vat).toFixed(2);
    };
  }, [eurRate]);

  // Pagination hesapları
  const totalPages = Math.ceil(allOffers.length / pageSize);
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return allOffers.slice(start, start + pageSize);
  }, [allOffers, currentPage, pageSize]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
    setSelectedOffers([]);
  };

  // Sayfa değişince seçimleri temizle
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedOffers([]);
  };

  // Load offers on mount
  useEffect(() => {
    const loadOffers = async () => {
      setIsLoading(true);
      try {
        const offers = await getOffers();
        setAllOffers(offers);
      } finally {
        setIsLoading(false);
      }
    };
    loadOffers();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  const toggleOffer = (offerId: string) => {
    setSelectedOffers((prev) =>
      prev.includes(offerId)
        ? prev.filter((id) => id !== offerId)
        : [...prev, offerId]
    );
  };

  // Silinecek tekliflerin isimlerini bul
  const selectedOfferNames = allOffers
    .filter((o) => selectedOffers.includes(o.id))
    .map((o) => o.name);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      for (const offerId of selectedOffers) {
        const response = await fetch(`/api/offers?id=${offerId}`, {
          method: "DELETE",
          headers,
        });
        if (!response.ok) {
          throw new Error(`Failed to delete offer ${offerId}`);
        }
      }
      const newOffers = allOffers.filter(
        (offer) => !selectedOffers.includes(offer.id)
      );
      setAllOffers(newOffers);
      setSelectedOffers([]);
      setIsDeleteModalOpen(false);
      // Sayfa boşaldıysa bir önceki sayfaya dön
      const newTotal = Math.ceil(newOffers.length / pageSize);
      if (currentPage > newTotal && newTotal > 0) {
        setCurrentPage(newTotal);
      }
    } catch (error) {
      console.error("Error deleting offers:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">

        {/* Silme Onay Dialog */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Teklifleri Sil
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Aşağıdaki {selectedOffers.length} teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </p>
              <ul className="rounded-md border border-red-100 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 divide-y divide-red-100 dark:divide-red-900/20 max-h-48 overflow-y-auto">
                {selectedOfferNames.map((name, i) => (
                  <li key={i} className="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                    <Trash2 className="h-3.5 w-3.5 flex-shrink-0" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Evet, Sil
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Mobil başlık */}
        <div className="md:hidden flex flex-col gap-2">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Teklifler</h1>
          </div>
          {allOffers.length > 0 && (
            <div className="fixed left-0 right-0 bottom-0 z-40 flex gap-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 md:hidden p-4">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={selectedOffers.length === 0}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                >
                  <Trash2 className="h-5 w-5" />
                  Seçilenleri Sil
                </Button>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                size="lg"
                className="gap-2 w-full py-4 text-base"
              >
                <Plus className="h-5 w-5" />
                Yeni Teklif
              </Button>
            </div>
          )}
        </div>

        {/* Masaüstü başlık ve butonlar */}
        <div className="hidden md:flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teklifler</h1>
          {allOffers.length > 0 && (
            <div className="space-x-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={selectedOffers.length === 0}
                  className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Seçilenleri Sil
                  {selectedOffers.length > 0 && (
                    <span className="ml-1 bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 text-xs font-bold">
                      {selectedOffers.length}
                    </span>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni Teklif
              </Button>
            </div>
          )}
        </div>

        {/* Yeni Teklif Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Teklif</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newOfferName.trim()) {
                  const currentDate = new Date();
                  const randomNumber = Math.floor(Math.random() * 1000)
                    .toString()
                    .padStart(2, "0");
                  const newOffer: Offer = {
                    id: `${currentDate.getFullYear()}${String(
                      currentDate.getMonth() + 1
                    ).padStart(2, "0")}${randomNumber}`,
                    name: newOfferName,
                    created_at: currentDate.toISOString(),
                    status: "Taslak" as const,
                    positions: [],
                  };
                  const response = await fetch("/api/offers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newOffer),
                  });
                  if (!response.ok) throw new Error("Failed to create offer");
                  setAllOffers((prev) => [...prev, newOffer]);
                  setNewOfferName("");
                  setIsModalOpen(false);
                  router.push(`/offers/${newOffer.id}`);
                }
              }}
            >
              <div className="py-4">
                <Input
                  ref={inputRef}
                  placeholder="Teklif adını giriniz"
                  value={newOfferName}
                  onChange={(e) => setNewOfferName(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" variant="default" className="gap-2">
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div>
          {/* Mobil grid */}
          <MobileOffersGrid
            offers={paginatedOffers}
            isLoading={isLoading}
            onCreate={() => setIsModalOpen(true)}
            calculateOfferTotal={calculateOfferTotal}
            selectedOffers={selectedOffers}
            toggleOffer={toggleOffer}
          />

          {/* Masaüstü tablo */}
          <div className="hidden md:block rounded-md border">
            {allOffers.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className="text-gray-500 mb-4">Henüz hiç teklif oluşturulmamış</p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  variant="outline"
                  className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Teklif Oluştur
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && (
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            paginatedOffers.length > 0 &&
                            paginatedOffers.every((o) => selectedOffers.includes(o.id))
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Mevcut sayfadaki tümünü ekle
                              setSelectedOffers((prev) => [
                                ...prev,
                                ...paginatedOffers
                                  .map((o) => o.id)
                                  .filter((id) => !prev.includes(id)),
                              ]);
                            } else {
                              // Mevcut sayfadakileri kaldır
                              setSelectedOffers((prev) =>
                                prev.filter(
                                  (id) => !paginatedOffers.map((o) => o.id).includes(id)
                                )
                              );
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">Teklif No</TableHead>
                    <TableHead>Teklif Adı</TableHead>
                    <TableHead>Oluşturulma Tarihi</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durumu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading || isEurRateLoading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    paginatedOffers.map((offer) => (
                      <TableRow
                        key={offer.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if ((e.target as HTMLElement).closest(".checkbox-cell")) return;
                          router.push(`/offers/${offer.id}`);
                        }}
                      >
                        {isAdmin && (
                          <TableCell className="w-[50px] checkbox-cell">
                            <Checkbox
                              checked={selectedOffers.includes(offer.id)}
                              onCheckedChange={() => toggleOffer(offer.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{offer.id}</TableCell>
                        <TableCell>{offer.name}</TableCell>
                        <TableCell>
                          {new Date(offer.created_at).toLocaleDateString("tr-TR")}
                        </TableCell>
                        <TableCell>{calculateOfferTotal(offer)}</TableCell>
                        <TableCell>
                          <div className="flex w-full">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                offer.status === "Kaydedildi" ||
                                offer.status === "Sipariş Verildi"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {offer.status}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && allOffers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-4">
              {/* Sol: Sayfa boyutu seçici + bilgi */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Sayfa başına:</span>
                  <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  Toplam{" "}
                  <span className="font-medium">{allOffers.length}</span> tekliften{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, allOffers.length)}
                  </span>{" "}
                  arası
                </p>
              </div>
              {/* Sağ: Sayfa butonları */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Çok sayfa varsa sadece yakındakileri göster
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .reduce<(number | "...")[]>((acc, page, idx, arr) => {
                      if (idx > 0 && typeof arr[idx - 1] === "number" && (page as number) - (arr[idx - 1] as number) > 1) {
                        acc.push("...");
                      }
                      acc.push(page);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "..." ? (
                        <span key={`ellipsis-${idx}`} className="h-8 w-8 flex items-center justify-center text-muted-foreground text-sm">
                          …
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={currentPage === item ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(item as number)}
                          className="h-8 w-8 p-0"
                        >
                          {item}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
