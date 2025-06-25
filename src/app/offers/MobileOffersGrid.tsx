import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import type { Offer } from "@/documents/offers";

interface MobileOffersGridProps {
  offers: Offer[];
  isLoading: boolean;
  onCreate: () => void;
  calculateOfferTotal: (offer: Offer) => string;
  selectedOffers: string[];
  toggleOffer: (offerId: string) => void;
}

export default function MobileOffersGrid({
  offers,
  isLoading,
  onCreate,
  calculateOfferTotal,
  selectedOffers,
  toggleOffer,
}: MobileOffersGridProps) {
  const router = useRouter();
  return (
    <div className="block md:hidden">
      {offers.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <p className="text-gray-500 mb-4">Henüz hiç teklif oluşturulmamış</p>
          <Button
            onClick={onCreate}
            variant="outline"
            className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <Plus className="h-4 w-4" />
            Teklif Oluştur
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 p-2 pb-[calc(40px+2rem)]">
          {isLoading
            ? [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col gap-2"
                >
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))
            : offers.map((offer) => {
                const isSelected = selectedOffers.includes(offer.id);
                return (
                  <div
                    key={offer.id}
                    className={`bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col border cursor-pointer relative transition-all duration-150 min-h-[170px] ${
                      isSelected
                        ? "border-green-500 border-[1px] bg-blue-50 dark:bg-blue-900/30"
                        : ""
                    }`}
                    onClick={() => toggleOffer(offer.id)}
                  >
                    {/* Üst kısım: Ad, Tarih ve Status */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col max-w-[70%]">
                        <div className="flex items-center gap-1">
                          <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                            {offer.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            -
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {offer.created_at}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                          {offer.id}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ml-2 whitespace-nowrap ${
                          offer.status === "Kaydedildi" ||
                          offer.status === "Sipariş Verildi"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    {/* Alt bilgiler */}
                    <div className="flex flex-col items-start gap-1 mb-2"></div>
                    {/* Toplam fiyat */}
                    <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-2 text-left">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mr-1">
                        Toplam:
                      </span>
                      {calculateOfferTotal(offer)}
                    </div>
                    {/* Detay butonu */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full mt-auto h-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/offers/${offer.id}`);
                      }}
                    >
                      Detay
                    </Button>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
