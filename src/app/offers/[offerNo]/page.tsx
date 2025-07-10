"use client";

import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
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
import MobilePositionsGrid from "./components/MobilePositionsGrid";
import {
  calculateTotals,
  togglePositionSelection,
  toggleAllPositions,
  apiCopyPosition,
  apiDeletePositions,
  apiSaveOfferName,
  apiUpdateOfferStatus,
} from "@/utils/offer-utils";
import { FloatingTotalButton } from "./components/FloatingTotalButton";
import { OfferDetailSkeleton } from "./components/OfferDetailSkeleton";
import { useFrappePostCall } from "frappe-react-sdk";
import { PriceItem, SelectedProduct } from "@/types/panjur";
import { toast } from "react-toastify";

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [offerName, setOfferName] = useState("");
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [isDeletingPositions, setIsDeletingPositions] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const { eurRate, loading: isEurRateLoading } = useExchangeRate({
    offerId: params.offerNo as string,
  });
  const [sortKey, setSortKey] = useState<string>("pozNo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const summaryRef = useRef<HTMLDivElement>(null!);
  const [vatRate, setVatRate] = useState<number>(20);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [assemblyRate, setAssemblyRate] = useState<number>(0);
  const [summaryTotal, setSummaryTotal] = useState<number>(0);
  const { call } = useFrappePostCall(
    "ozerpan_ercom_sync.market.api.sales_order"
  );
  const [selectedOrder, setSelectedOrder] = useState<string>("");

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
  // React Hook'lar en üstte olmalı
  const handleVatChange = React.useCallback((v: number) => setVatRate(v), []);
  const handleDiscountChange = React.useCallback(
    (v: number) => setDiscountRate(v),
    []
  );
  const handleAssemblyChange = React.useCallback(
    (v: number) => setAssemblyRate(v),
    []
  );

  if (!offer || isEurRateLoading) {
    return <OfferDetailSkeleton />;
  }
  const { subtotal } = calculateTotals(offer.positions);

  // Profil tipini kullanıcı dostu başlığa çeviren fonksiyon
  function formatProfileType(type: string): string {
    return type
      .split("_")
      .map((word) =>
        word.length > 0
          ? word[0].toLocaleUpperCase("tr-TR") +
            word.slice(1).toLocaleLowerCase("tr-TR")
          : ""
      )
      .join(" ");
  }

  // Gerçek sipariş datası oluşturucu
  function buildOrderData(offer: Offer) {
    return {
      data: {
        order_no: selectedOrder || offer.id,
        order_type: "Panjur",
        tax: vatRate,
        discount: discountRate,
        assembly: assemblyRate,
        total: Number((summaryTotal * eurRate).toFixed(2)),
        grand_total: Number((summaryTotal * eurRate).toFixed(2)), // örnek oran, gerekirse değiştirin
        remarks: "",
        poz_list: offer.positions.map((pos, idx) => ({
          poz_no: idx + 1,
          product_name: pos.productName,
          product_type: pos.typeId,
          product_option: pos.optionId,
          quantity: pos.quantity,
          unit_price: Number((pos.unitPrice * eurRate).toFixed(2)),
          production_materials: {
            profiles:
              pos.selectedProducts?.products?.map(
                (profile: SelectedProduct) => ({
                  stock_code: profile.stock_code,
                  type: formatProfileType(profile.type),
                  description: profile.description,
                  unit_of_measure: profile.unit,
                  quantity: profile.quantity,
                })
              ) || [],
            accessories:
              pos.selectedProducts?.accessories?.map((acc: PriceItem) => ({
                stock_code: acc.stock_code,
                description: acc.description,
                unit_of_measure: acc.unit,
                quantity: acc.quantity ?? 0,
              })) || [],
          },
        })),
      },
    };
  }

  return (
    <div className="py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <OfferHeader
          offerName={offer.name}
          onEdit={() => setIsEditDialogOpen(true)}
          onBack={() => router.push("/offers")}
          onImalatList={(selectedTypes) => {
            if (!offer || selectedPositions.length === 0) return;
            const positions = offer.positions.filter((p) =>
              selectedPositions.includes(p.id)
            );
            if (positions.length > 0) {
              import("@/utils/offer-utils").then((utils) => {
                // Normalize tipler ve debug
                const normalizedTypes = selectedTypes.map((t) =>
                  t.toLowerCase().trim()
                );
                const filteredPositions = positions.map((pos) => {
                  const filteredProducts = (
                    pos.selectedProducts?.products || []
                  ).filter((prod) => {
                    //prod'un descriptionu seçilen tiplerden birini içeriyor mu?
                    const prodDesc = prod.description.toLowerCase().trim();
                    return normalizedTypes.some((type) =>
                      prodDesc.includes(type)
                    );
                  });
                  // Debug için log
                  if (filteredProducts.length === 0) {
                    console.warn(
                      "Pozisyon",
                      pos.pozNo,
                      "için eşleşen ürün yok",
                      {
                        mevcut: (pos.selectedProducts?.products || []).map(
                          (p) => p.type
                        ),
                        aranan: normalizedTypes,
                      }
                    );
                  }
                  return {
                    ...pos,
                    selectedProducts: {
                      ...pos.selectedProducts,
                      products: filteredProducts,
                      accessories: pos.selectedProducts?.accessories || [],
                    },
                  };
                }) as typeof positions;
                utils.openImalatListPDFMulti(offer, filteredPositions);
              });
            }
          }}
          onFiyatAnaliz={() => {
            if (!offer || selectedPositions.length === 0) return;
            const positions = offer.positions.filter((p) =>
              selectedPositions.includes(p.id)
            );
            if (positions.length > 0) {
              import("@/utils/fiyat-analizi-pdf-generator").then((mod) => {
                mod.generateFiyatAnaliziPDFPozListesi(offer, positions);
              });
            }
          }}
          hasSelectedPosition={selectedPositions.length > 0}
          onDepoCikisFisi={() => {
            if (!offer || selectedPositions.length === 0) return;
            const positions = offer.positions.filter((p) =>
              selectedPositions.includes(p.id)
            );
            if (positions.length > 0) {
              import("@/utils/depo-pdf-generator").then((mod) => {
                mod.openDepoCikisFisiPDFMulti(offer, positions);
              });
            }
          }}
          onTeklifFormu={() => {
            if (!offer || selectedPositions.length === 0) return;
            const positions = offer.positions.filter((p) =>
              selectedPositions.includes(p.id)
            );
            if (positions.length > 0) {
              import("@/utils/offer-utils").then((utils) => {
                utils.openTeklifFormuPDFMulti(
                  offer,
                  positions,
                  vatRate,
                  discountRate,
                  assemblyRate
                );
              });
            }
          }}
          loading={false}
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
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Mobilde kart grid, masaüstünde tablo */}
          <div className="flex-1">
            <div className="block md:hidden">
              <MobilePositionsGrid
                positions={sortedPositions}
                offerId={offer.id}
                offerStatus={offer.status}
                selectedPositions={selectedPositions}
                onSelect={handleTogglePositionSelection}
                onDelete={handleDeletePositions}
                onCopy={handleCopyPosition}
                onAdd={() => router.push(`/offers/${offer.id}/add-position`)}
                isDeleting={isDeletingPositions}
              />
              {/* Floating toplam button */}
              <FloatingTotalButton
                summaryRef={summaryRef}
                total={summaryTotal}
              />
            </div>
            <div className="hidden md:block">
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
              />
            </div>
          </div>
          <div ref={summaryRef} className="w-full lg:w-[400px] space-y-6">
            <OfferSummaryCard
              subtotal={subtotal}
              offerStatus={offer.status}
              isDirty={!!offer.is_dirty}
              positionsLength={offer.positions.length}
              eurRate={eurRate}
              onSave={async () =>
                await updateOfferStatus("Kaydedildi", eurRate)
              }
              onOrder={async () => {
                setOrderLoading(true);
                try {
                  const orderData = buildOrderData(offer);
                  await call(orderData);
                  await updateOfferStatus("Sipariş Verildi", eurRate);
                  toast.success(`Sipariş başarıyla oluşturuldu!`, {
                    position: "top-center",
                    autoClose: 2000,
                    closeButton: false,
                  });
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Bilinmeyen bir hata oluştu.";
                  toast.error(`Sipariş oluşturulamadı! ${message}`, {
                    position: "top-center",
                    autoClose: 2000,
                    closeButton: false,
                  });
                } finally {
                  setOrderLoading(false);
                }
              }}
              onRevise={() => updateOfferStatus("Revize")}
              onTotalChange={setSummaryTotal}
              selectedOrder={selectedOrder}
              onSelectedOrderChange={setSelectedOrder}
              orderLoading={orderLoading}
              onVatChange={handleVatChange}
              onDiscountChange={handleDiscountChange}
              onAssemblyChange={handleAssemblyChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
