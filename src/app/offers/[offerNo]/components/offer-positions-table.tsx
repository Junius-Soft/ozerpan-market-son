import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Copy } from "lucide-react";
import { Position } from "@/documents/offers";
import { useRouter } from "next/navigation";
import React from "react";

interface OfferPositionsTableProps {
  positions: Position[];
  offerId: string;
  offerStatus: string;
  selectedPositions: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onCopy: (position: Position) => void;
  onAdd: () => void;
  isDeleting: boolean;
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
}

export function OfferPositionsTable({
  positions,
  offerId,
  offerStatus,
  selectedPositions,
  onSelect,
  onSelectAll,
  onDelete,
  onCopy,
  onAdd,
  isDeleting,
  sortKey,
  sortDirection,
  onSort,
}: OfferPositionsTableProps) {
  const router = useRouter();
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Pozlar</h2>
        <div className="flex gap-2">
          {positions.length > 0 && offerStatus === "Taslak" && (
            <>
              <Button
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={onDelete}
                disabled={selectedPositions.length === 0 || isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Siliniyor..." : "Seçilenleri Sil"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={onAdd}>
                <Plus className="h-4 w-4" />
                Poz Ekle
              </Button>
            </>
          )}
        </div>
      </div>
      {!positions.length ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
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
        <Table>
          <TableHeader>
            <TableRow>
              {offerStatus === "Taslak" && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedPositions.length === positions.length}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
              )}
              <TableHead
                className="w-[100px] cursor-pointer"
                onClick={() => onSort("pozNo")}
              >
                Poz No{" "}
                {sortKey === "pozNo" && (sortDirection === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => onSort("productName")}
              >
                Ürün{" "}
                {sortKey === "productName" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer">
                Gen x Yük
              </TableHead>
              <TableHead
                className="w-[100px] cursor-pointer"
                onClick={() => onSort("quantity")}
              >
                Miktar{" "}
                {sortKey === "quantity" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="w-[150px] cursor-pointer"
                onClick={() => onSort("unitPrice")}
              >
                Birim Fiyat{" "}
                {sortKey === "unitPrice" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </TableHead>
              <TableHead
                className="w-[150px] cursor-pointer"
                onClick={() => onSort("total")}
              >
                Toplam{" "}
                {sortKey === "total" && (sortDirection === "asc" ? "▲" : "▼")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((position) => (
              <TableRow
                key={position.id}
                className="cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (
                    target.closest("button") ||
                    target.closest('[role="checkbox"]')
                  ) {
                    return;
                  }
                  router.push(
                    `/offers/${offerId}/add-position/product-details?selectedPosition=${position.id}&productId=${position.productId}&productName=${position.productName}&typeId=${position.typeId}&optionId=${position.optionId}`
                  );
                }}
              >
                {offerStatus === "Taslak" && (
                  <TableCell>
                    <Checkbox
                      checked={selectedPositions.includes(position.id)}
                      onCheckedChange={() => onSelect(position.id)}
                    />
                  </TableCell>
                )}
                <TableCell className="flex items-center gap-2">
                  {position.pozNo}
                  {offerStatus === "Taslak" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onCopy(position)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
                <TableCell>{position.productName}</TableCell>
                <TableCell>
                  {position.productDetails.width &&
                  position.productDetails.height
                    ? `${position.productDetails.width} x ${position.productDetails.height}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {position.quantity} {position.unit}
                </TableCell>
                <TableCell>€ {position.unitPrice.toFixed(2)}</TableCell>
                <TableCell>€ {position.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
