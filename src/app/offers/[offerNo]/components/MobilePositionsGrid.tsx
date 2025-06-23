import { Button } from "@/components/ui/button";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Position } from "@/documents/offers";

interface MobilePositionsGridProps {
  positions: Position[];
  offerId: string;
  offerStatus: string;
  selectedPositions: string[];
  onSelect: (id: string) => void;
  onDelete: () => void;
  onCopy: (position: Position) => void;
  onAdd: () => void;
  isDeleting: boolean;
}

export default function MobilePositionsGrid({
  positions,
  offerId,
  offerStatus,
  selectedPositions,
  onSelect,
  onDelete,
  onCopy,
  onAdd,
  isDeleting,
}: MobilePositionsGridProps) {
  const router = useRouter();

  return (
    <div className="block md:hidden">
      {/* Üstte aksiyon butonları */}
      {positions.length > 0 && offerStatus === "Taslak" && (
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex-1"
            onClick={onDelete}
            disabled={selectedPositions.length === 0 || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Siliniyor..." : "Seçilenleri Sil"}
          </Button>
          <Button variant="outline" className="gap-2 flex-1" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Poz Ekle
          </Button>
        </div>
      )}
      {positions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <p className="text-gray-500 mb-4">
            Sipariş vermek için lütfen poz ekleyin
          </p>
          {offerStatus !== "Kaydedildi" && (
            <Button variant="outline" className="gap-2" onClick={onAdd}>
              <Plus className="h-4 w-4" />
              Poz Ekle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 p-2 pb-[calc(40px+2rem)]">
          {positions.map((position) => {
            const isSelected = selectedPositions.includes(position.id);
            return (
              <div
                key={position.id}
                className={`bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col border cursor-pointer relative transition-all duration-150 min-h-[170px] ${
                  isSelected
                    ? "border-green-500 border-[1px] bg-blue-50 dark:bg-blue-900/30"
                    : ""
                }`}
                onClick={() => onSelect(position.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex flex-col max-w-[70%]">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {position.pozNo}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        -
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {position.productName}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {position.id}
                    </div>
                  </div>
                  {offerStatus === "Taslak" && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(position);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-col items-start gap-1 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {position.productDetails.width &&
                    position.productDetails.height
                      ? `${position.productDetails.width} x ${position.productDetails.height}`
                      : "-"}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {position.quantity} {position.unit}
                  </span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-2 text-left">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mr-1">
                    Birim Fiyat:
                  </span>
                  € {position.unitPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-200 font-semibold mb-2 text-left">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mr-1">
                    Toplam:
                  </span>
                  € {position.total.toFixed(2)}
                </div>
                {offerStatus === "Taslak" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1 h-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/offers/${offerId}/add-position/product-details?selectedPosition=${position.id}&productId=${position.productId}&productName=${position.productName}&typeId=${position.typeId}&optionId=${position.optionId}`
                        );
                      }}
                    >
                      Detay
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
