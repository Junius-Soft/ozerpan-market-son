"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOffer, type Offer, type Position } from "@/documents/offers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { OfferHeader } from "./components/offer-header";
import { OfferPositionsTable } from "./components/offer-positions-table";
import { OfferSummaryCard } from "./components/offer-summary-card";
import {
  calculateTotals,
  togglePositionSelection,
  toggleAllPositions,
  apiCopyPosition,
  apiDeletePositions,
  apiSaveOfferName,
  apiUpdateOfferStatus,
  openImalatListPDF,
} from "@/utils/offer-utils";

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [offerName, setOfferName] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [isDeletingPositions, setIsDeletingPositions] = useState(false);
  const { eurRate, loading: isEurRateLoading } = useExchangeRate({
    offerId: params.offerNo as string,
  });
  const [sortKey, setSortKey] = useState<string>("pozNo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadOffer = async () => {
      const currentOffer = await getOffer(params.offerNo as string);
      if (currentOffer) {
        setOffer(currentOffer);
        setOfferName(currentOffer.name);
      }
    };
    loadOffer();
  }, [params.offerNo]);

  const handleDeletePositions = async () => {
    if (!offer || selectedPositions.length === 0) return;
    try {
      setIsDeletingPositions(true);
      await apiDeletePositions(offer.id, selectedPositions);
      // Reload offer to get updated data
      const updatedOffer = await getOffer(offer.id);
      if (updatedOffer) {
        setOffer(updatedOffer);
        setSelectedPositions([]);
      }
    } catch (error) {
      console.error("Failed to delete positions:", error);
    } finally {
      setIsDeletingPositions(false);
    }
  };

  const handleSaveOfferName = async () => {
    if (!offer) return;
    try {
      await apiSaveOfferName(offer.id, offerName);
      const updatedOffer = await getOffer(offer.id);
      setOffer(updatedOffer);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to save offer name:", error);
    }
  };

  const updateOfferStatus = async (newStatus: string, eurRate?: number) => {
    if (!offer) return;
    try {
      await apiUpdateOfferStatus(offer.id, newStatus, eurRate);
      const updatedOffer = await getOffer(offer.id);
      setOffer(updatedOffer);
    } catch (error) {
      console.error("Error updating offer status:", error);
    }
  };

  const handleCopyPosition = async (position: Position) => {
    if (!offer) return;
    try {
      await apiCopyPosition(offer.id, offer.positions, position);
      const updatedOffer = await getOffer(offer.id);
      if (updatedOffer) {
        setOffer(updatedOffer);
      }
    } catch (error) {
      console.error("Failed to copy position:", error);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedPositions = (offer?.positions ?? []).slice().sort((a, b) => {
    const aValue = a[sortKey as keyof Position];
    const bValue = b[sortKey as keyof Position];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  // handleTogglePositionSelection fonksiyonu
  const handleTogglePositionSelection = (positionId: string) => {
    setSelectedPositions((prev) => togglePositionSelection(prev, positionId));
  };

  // handleToggleAllPositions fonksiyonu
  const handleToggleAllPositions = () => {
    if (!offer?.positions) return;
    setSelectedPositions(
      toggleAllPositions(offer.positions, selectedPositions)
    );
  };

  if (!offer || isEurRateLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex gap-6">
            {/* Sol Taraf - Poz Tablosu Skeleton */}
            <div className="flex-1">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-28" />
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-12 flex-1" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Sağ Taraf - Bilgi Kartları Skeleton */}
            <div className="w-[400px] space-y-6">
              <Card className="p-6">
                <Skeleton className="h-6 w-36 mb-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                  <Skeleton className="h-px w-full" />
                  <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 flex-1" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { subtotal, vat, total } = calculateTotals(offer.positions);
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <OfferHeader
          offerName={offer.name}
          onEdit={() => setIsEditDialogOpen(true)}
          onBack={() => router.push("/offers")}
          onImalatList={() => {
            if (!offer || selectedPositions.length === 0) return;
            const pos = offer.positions.find(
              (p) => p.id === selectedPositions[0]
            );
            if (pos) openImalatListPDF(offer, pos);
          }}
          onFiyatAnaliz={() => {
            /* TODO: Fiyat Analizi fonksiyonu */
          }}
          hasSelectedPosition={selectedPositions.length > 0}
        />
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Teklif Adını Düzenle</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="Teklif adı"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveOfferName();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                İptal
              </Button>
              <Button onClick={handleSaveOfferName}>Kaydet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex gap-6">
          <div className="flex-1">
            <OfferPositionsTable
              positions={sortedPositions}
              offerId={offer.id}
              offerStatus={offer.status}
              selectedPositions={selectedPositions}
              onSelect={handleTogglePositionSelection}
              onSelectAll={handleToggleAllPositions}
              onDelete={handleDeletePositions}
              onCopy={handleCopyPosition}
              onAdd={() => router.push(`/offers/${offer.id}/add-position`)}
              isDeleting={isDeletingPositions}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={handleSort}
              eurRate={eurRate}
            />
          </div>
          <div className="w-[400px] space-y-6">
            <OfferSummaryCard
              subtotal={subtotal}
              vat={vat}
              total={total}
              offerStatus={offer.status}
              isDirty={!!offer.is_dirty}
              positionsLength={offer.positions.length}
              eurRate={eurRate}
              onSave={async () =>
                await updateOfferStatus("Kaydedildi", eurRate)
              }
              onOrder={() => {}}
              onRevise={() => updateOfferStatus("Revize")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
