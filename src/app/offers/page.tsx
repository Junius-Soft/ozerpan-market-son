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
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { formatPrice } from "./[offerNo]/page";

export default function OffersPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOfferName, setNewOfferName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const { eurRate, loading: isEurRateLoading } = useExchangeRate();

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Teklifler</h1>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={handleDeleteSelected}
              disabled={selectedOffers.length === 0}
              className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Seçilenleri Sil
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <Plus className="h-4 w-4" />
              Yeni Teklif
            </Button>
          </div>
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
                  const newOffer: Offer = {
                    id: `TEK-${new Date().getFullYear()}-${String(
                      allOffers.length + 1
                    ).padStart(3, "0")}`,
                    name: newOfferName,
                    created_at: new Date().toLocaleDateString("tr-TR"),
                    total: 0,
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
                <Button
                  type="submit"
                  variant="outline"
                  className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="rounded-md border">
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
              {isLoading || isEurRateLoading ? (
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
                      if ((e.target as HTMLElement).closest(".checkbox-cell"))
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
                    <TableCell className="font-medium">{offer.id}</TableCell>
                    <TableCell>{offer.name}</TableCell>
                    <TableCell>{offer.created_at}</TableCell>
                    <TableCell>
                      {formatPrice(offer.total, eurRate)} TL
                    </TableCell>
                    <TableCell>
                      <div className="flex w-full">
                        <span
                          className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              offer.status === "Kaydedildi"
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
        </div>
      </div>
    </div>
  );
}
