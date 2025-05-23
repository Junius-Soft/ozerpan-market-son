"use client";

import { Card } from "@/components/ui/card";
import { type Position } from "@/documents/offers";

interface PreviewStepProps {
  positionDetails: Omit<Position, "id" | "total"> | null;
}

export function PreviewStep({ positionDetails }: PreviewStepProps) {
  if (!positionDetails) {
    return <div>Pozisyon detayları bulunamadı.</div>;
  }

  const { pozNo, description, unit, quantity, unitPrice } = positionDetails;
  const total = quantity * unitPrice;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Poz No</h3>
            <p className="mt-1">{pozNo}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Birim</h3>
            <p className="mt-1">{unit}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Açıklama</h3>
          <p className="mt-1">{description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Miktar</h3>
            <p className="mt-1">{quantity}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Birim Fiyat</h3>
            <p className="mt-1">
              ₺{unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Toplam</h3>
            <p className="mt-1 font-medium">
              ₺{total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
