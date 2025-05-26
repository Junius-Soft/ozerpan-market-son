"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
  getOffers,
  saveOffers,
  type Offer,
  type Position,
} from "@/documents/offers";
import { ArrowLeft, AlertTriangle, Plus, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [offerName, setOfferName] = useState("");

  useEffect(() => {
    const loadOffer = async () => {
      const offers = await getOffers();
      const currentOffer = offers.find((o) => o.id === params.offerNo);
      if (currentOffer) {
        setOffer(currentOffer);
        setOfferName(currentOffer.name);
      }
    };
    loadOffer();
  }, [params.offerNo]);

  const calculateTotals = (positions: Position[]) => {
    const subtotal = positions.reduce((sum, pos) => sum + pos.total, 0);
    return {
      subtotal: subtotal,
      discount: 0,
      total: subtotal,
    };
  };

  const handleSaveOfferName = async () => {
    try {
      const updatedOffer = {
        ...offer!,
        name: offerName,
        isDirty: true,
      };
      const offers = await getOffers();
      const updatedOffers = offers.map((o) =>
        o.id === offer?.id ? updatedOffer : o
      );
      await saveOffers(updatedOffers);
      setOffer(updatedOffer);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to save offer name:", error);
    }
  };

  if (!offer) {
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
                {offer.positions?.length > 0 && (
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

              {!offer.positions?.length ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <p className="text-gray-500 mb-4">
                    Sipariş vermek için lütfen poz ekleyin
                  </p>
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
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
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
                      <TableRow key={position.id}>
                        <TableCell>{position.pozNo}</TableCell>
                        <TableCell>{position.description}</TableCell>
                        <TableCell>{position.unit}</TableCell>
                        <TableCell>{position.quantity}</TableCell>
                        <TableCell>
                          ₺
                          {position.unitPrice.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          ₺
                          {position.total.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
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
                  <div className="font-medium">{offer.createdAt}</div>
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
                    ₺
                    {subtotal.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-500">İskonto (%0)</label>
                  <div className="font-medium">₺0,00</div>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between items-center">
                  <label className="font-medium">Genel Toplam</label>
                  <div className="font-medium text-lg">
                    ₺
                    {total.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="h-px bg-gray-200 my-4" />
                {offer.status !== "Revize" && (
                  <div className="flex gap-3">
                    {offer.status === "Taslak" ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                          disabled={!offer.positions?.length || !offer.isDirty}
                          onClick={async () => {
                            const updatedOffer = {
                              ...offer,
                              status: "Kaydedildi" as const,
                              isDirty: false,
                            };
                            const offers = await getOffers();
                            const updatedOffers = offers.map((o) =>
                              o.id === offer.id ? updatedOffer : o
                            );
                            await saveOffers(updatedOffers);
                            setOffer(updatedOffer);
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
                          onClick={async () => {
                            const updatedOffer = {
                              ...offer,
                              status: "Revize" as const,
                              isDirty: false,
                            };
                            const offers = await getOffers();
                            const updatedOffers = offers.map((o) =>
                              o.id === offer.id ? updatedOffer : o
                            );
                            await saveOffers(updatedOffers);
                            setOffer(updatedOffer);
                          }}
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
