"use client";

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
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { type Offer, getOffers } from "@/documents/offers";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import MobileOffersGrid from "./MobileOffersGrid";

export default function OffersPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOfferName, setNewOfferName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);

  const calculateOfferTotal = useMemo(() => {
    return (offer: Offer) => {
      const subtotal = offer.positions.reduce(
        (sum, position) => sum + position.unitPrice * position.quantity,
        0
      );
      const vat = subtotal * 0.2; // %20 KDV
      return "€ " + (subtotal + vat).toFixed(2); // İki ondalık basamakla göster
    };
  }, []);

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

  const handleDeleteSelected = async () => {
    try {
      for (const offerId of selectedOffers) {
        const response = await fetch(`/api/offers?id=${offerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete offer ${offerId}`);
        }
      }

      // Update local state after successful deletion
      const newOffers = allOffers.filter(
        (offer) => !selectedOffers.includes(offer.id)
      );
      setAllOffers(newOffers);
      setSelectedOffers([]);
    } catch (error) {
      console.error("Error deleting offers:", error);
      // You might want to add error handling UI here
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Sticky başlık ve butonlar sadece mobilde */}
        <div className="md:hidden flex flex-col gap-2">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Teklifler</h1>
          </div>
          {allOffers.length > 0 && (
            <div className="fixed left-0 right-0 bottom-0 z-40 flex gap-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 md:hidden p-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleDeleteSelected}
                disabled={selectedOffers.length === 0}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
              >
                <Trash2 className="h-5 w-5" />
                Seçilenleri Sil
              </Button>
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
              <Button
                variant="outline"
                onClick={handleDeleteSelected}
                disabled={selectedOffers.length === 0}
                className="gap-2  border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Seçilenleri Sil
              </Button>
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
                    .padStart(3, "0");
                  const newOffer: Offer = {
                    id: `${currentDate.getFullYear()}${String(
                      currentDate.getMonth() + 1
                    ).padStart(2, "0")}${randomNumber}`,
                    name: newOfferName,
                    created_at: currentDate.toLocaleDateString("tr-TR"),
                    status: "Taslak" as const,
                    positions: [],
                  };
                  const response = await fetch("/api/offers", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(newOffer),
                  });

                  if (!response.ok) {
                    throw new Error("Failed to create offer");
                  }

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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
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
          {/* Mobilde kart/grid, masaüstünde tablo */}
          <MobileOffersGrid
            offers={allOffers}
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
                <p className="text-gray-500 mb-4">
                  Henüz hiç teklif oluşturulmamış
                </p>
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
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={
                          selectedOffers.length === allOffers.length &&
                          allOffers.length > 0
                        }
                        onCheckedChange={(checked) => {
                          setSelectedOffers(
                            checked ? allOffers.map((o) => o.id) : []
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">Teklif No</TableHead>
                    <TableHead>Teklif Adı</TableHead>
                    <TableHead>Oluşturulma Tarihi</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Durumu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeletons
                    <>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : (
                    allOffers.map((offer) => (
                      <TableRow
                        key={offer.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest(".checkbox-cell")
                          )
                            return;
                          router.push(`/offers/${offer.id}`);
                        }}
                      >
                        <TableCell className="w-[50px] checkbox-cell">
                          <Checkbox
                            checked={selectedOffers.includes(offer.id)}
                            onCheckedChange={() => toggleOffer(offer.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {offer.id}
                        </TableCell>
                        <TableCell>{offer.name}</TableCell>
                        <TableCell>{offer.created_at}</TableCell>
                        <TableCell>{calculateOfferTotal(offer)}</TableCell>
                        <TableCell>
                          <div className="flex w-full">
                            <span
                              className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${
                                  offer.status === "Kaydedildi" ||
                                  offer.status === "Sipariş Verildi"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }
                              `}
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
        </div>
      </div>
    </div>
  );
}
