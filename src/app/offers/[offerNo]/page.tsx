"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getOffer,
  deletePositions,
  type Offer,
  type Position,
} from "@/documents/offers";
import { ArrowLeft, AlertTriangle, Plus, Edit2, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { parsePrice, formatPrice } from "@/utils/price-formatter";

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
      const success = await deletePositions(offer.id, selectedPositions);

      if (success) {
        // Reload offer to get updated data
        const updatedOffer = await getOffer(offer.id);
        if (updatedOffer) {
          setOffer(updatedOffer);
          setSelectedPositions([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete positions:", error);
    } finally {
      setIsDeletingPositions(false);
    }
  };

  const togglePositionSelection = (positionId: string) => {
    setSelectedPositions((prev) =>
      prev.includes(positionId)
        ? prev.filter((id) => id !== positionId)
        : [...prev, positionId]
    );
  };

  const toggleAllPositions = () => {
    if (!offer?.positions) return;

    setSelectedPositions(
      selectedPositions.length === offer.positions.length
        ? []
        : offer.positions.map((pos) => pos.id)
    );
  };

  const calculateTotals = (positions: Position[]) => {
    const subtotal = positions.reduce((sum, pos) => {
      // Use parsePrice to handle any string or number format
      const posTotal = parsePrice(pos.total);
      return sum + posTotal;
    }, 0);
    const vat = subtotal * 0.18; // 18% KDV
    return {
      subtotal: subtotal,
      vat: vat,
      total: subtotal + vat,
    };
  };

  const handleSaveOfferName = async () => {
    if (!offer) return;

    try {
      const response = await fetch(`/api/offers/${offer.id}?id=${offer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: offerName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update offer name");
      }

      const updatedOffer = await response.json();
      setOffer(updatedOffer);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to save offer name:", error);
    }
  };

  const updateOfferStatus = async (newStatus: string, eurRate?: number) => {
    if (!offer) return;
    console.log({ eurRate });
    console.log({ newStatus });
    try {
      const response = await fetch(`/api/offers/${offer.id}?id=${offer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, eurRate: eurRate }),
      });

      if (!response.ok) throw new Error("Failed to update offer status");

      const updatedOffer = await response.json();
      setOffer(updatedOffer);
    } catch (error) {
      console.error("Error updating offer status:", error);
    }
  };

  const handleCopyPosition = async (position: Position) => {
    if (!offer) return;

    // Create new position with incremented pozNo
    const lastPos = offer.positions[offer.positions.length - 1];
    const nextPozNo = String(parseInt(lastPos.pozNo) + 1).padStart(3, "0");

    const newPosition: Position = {
      ...position,
      id: `POS-${Date.now()}`,
      pozNo: nextPozNo,
    };

    try {
      // Update offer with new positions array
      const response = await fetch(`/api/offers?id=${offer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          positions: [...offer.positions, newPosition],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to copy position");
      }

      // Reload offer to get updated data
      const updatedOffer = await getOffer(offer.id);
      if (updatedOffer) {
        setOffer(updatedOffer);
      }
    } catch (error) {
      console.error("Failed to copy position:", error);
    }
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
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              </Card>

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

  const { subtotal, total } = calculateTotals(offer.positions);
  console.log({ eurRate });
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Teklif Detayı</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="hover:bg-gray-100"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            className="gap-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
            onClick={() => router.push("/offers")}
          >
            <ArrowLeft className="h-4 w-4" />
            Tekliflere Dön
          </Button>
        </div>

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
          {/* Sol Taraf - Poz Tablosu */}
          <div className="flex-1">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Pozlar</h2>
                <div className="flex gap-2">
                  {offer.positions?.length > 0 && offer.status === "Taslak" && (
                    <>
                      <Button
                        variant="outline"
                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={handleDeletePositions}
                        disabled={
                          selectedPositions.length === 0 || isDeletingPositions
                        }
                      >
                        {isDeletingPositions
                          ? "Siliniyor..."
                          : "Seçilenleri Sil"}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() =>
                          router.push(`/offers/${offer.id}/add-position`)
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Poz Ekle
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {!offer.positions?.length ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <p className="text-gray-500 mb-4">
                    Sipariş vermek için lütfen poz ekleyin
                  </p>
                  {offer.status !== "Kaydedildi" && (
                    <Button
                      variant="outline"
                      className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() =>
                        router.push(`/offers/${offer.id}/add-position`)
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Poz Ekle
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            selectedPositions.length === offer.positions.length
                          }
                          onCheckedChange={toggleAllPositions}
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">Poz No</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead className="w-[100px]">Birim</TableHead>
                      <TableHead className="w-[100px]">Miktar</TableHead>
                      <TableHead className="w-[150px]">Birim Fiyat</TableHead>
                      <TableHead className="w-[150px]">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offer.positions.map((position) => (
                      <TableRow
                        key={position.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          // Don't navigate if clicking on checkbox or copy button
                          const target = e.target as HTMLElement;
                          if (
                            target.closest("button") ||
                            target.closest('[role="checkbox"]')
                          ) {
                            return;
                          }
                          router.push(
                            `/offers/${offer.id}/add-position/product-details?selectedPosition=${position.id}&productId=${position.productId}&productName=${position.productName}&typeId=${position.typeId}&optionId=${position.optionId}`
                          );
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedPositions.includes(position.id)}
                            onCheckedChange={() =>
                              togglePositionSelection(position.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          {position.pozNo}
                          {offer.status === "Taslak" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyPosition(position)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>{position.description}</TableCell>
                        <TableCell>{position.unit}</TableCell>
                        <TableCell>{position.quantity}</TableCell>
                        <TableCell>
                          ₺{formatPrice(position.unitPrice, eurRate)}
                        </TableCell>
                        <TableCell>
                          ₺{formatPrice(position.total, eurRate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>

          {/* Sağ Taraf - Bilgi Kartları */}
          <div className="w-[400px] space-y-6">
            {/* Üst Card - Teklif Bilgileri */}
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold">Teklif Bilgileri</h2>
                <span
                  className={`
                    inline-block px-2 py-1 rounded-full text-xs font-medium
                    ${
                      offer.status === "Kaydedildi"
                        ? "bg-green-100 text-green-700"
                        : offer.status === "Revize"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  `}
                >
                  {offer.status}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Teklif No</label>
                  <div className="font-medium">{offer.id}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teklif Adı</label>
                  <div className="font-medium">{offer.name}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Oluşturma Tarihi
                  </label>
                  <div className="font-medium">{offer.created_at}</div>
                </div>

                {offer.status === "Taslak" && (
                  <div className="mt-6 flex items-start gap-2 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-600">
                      Taslak durumundaki tekliflerde fiyat yeniden hesaplanır.
                      Fiyatı korumak için lütfen teklifi kaydediniz!
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Alt Card - Toplam Bilgileri */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Toplam Bilgileri</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-500">Ara Toplam</label>
                  <div className="font-medium">
                    ₺{formatPrice(subtotal, eurRate)}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-500">KDV (%18)</label>
                  <div className="font-medium">
                    ₺
                    {formatPrice(
                      offer.positions?.length
                        ? calculateTotals(offer.positions).vat
                        : 0,
                      eurRate
                    )}
                  </div>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between items-center">
                  <label className="font-medium">Genel Toplam</label>
                  <div className="font-medium text-lg">
                    ₺{formatPrice(total, eurRate)}
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4" />
                {offer.status !== "Revize" && (
                  <div className="flex gap-3">
                    {offer.status === "Taslak" ? (
                      <>
                        {/* Save button */}
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          disabled={!offer.positions?.length || !offer.is_dirty}
                          onClick={async () => {
                            await updateOfferStatus("Kaydedildi", eurRate);
                          }}
                        >
                          Kaydet
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          disabled={!offer.positions?.length}
                          onClick={() => {
                            // TODO: Implement order functionality
                          }}
                        >
                          Sipariş Ver
                        </Button>
                      </>
                    ) : offer.status === "Kaydedildi" ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-yellow-200 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          disabled={!offer.positions?.length}
                          onClick={() => updateOfferStatus("Revize")}
                        >
                          Revize Et
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                          disabled={!offer.positions?.length}
                          onClick={() => {
                            // TODO: Implement purchase functionality
                          }}
                        >
                          Satın Al
                        </Button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
