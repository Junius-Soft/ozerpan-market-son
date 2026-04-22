"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Package, Clock } from "lucide-react";
import type { PriceItem } from "../constants";

interface StatsCardsProps {
  prices: PriceItem[];
  total: number;
}

export function StatsCards({ prices, total }: StatsCardsProps) {
  const stats = useMemo(() => {
    const withPrevious = prices.filter((p) => p.previous_price !== null);
    const increased = withPrevious.filter((p) => p.price > (p.previous_price || 0));
    const decreased = withPrevious.filter((p) => p.price < (p.previous_price || 0));

    const recentlyUpdated = prices.filter((p) => {
      const updated = new Date(p.price_updated_at);
      const now = new Date();
      const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    });

    return { total, increased: increased.length, decreased: decreased.length, recentlyUpdated: recentlyUpdated.length };
  }, [prices, total]);

  const cards = [
    {
      label: "Toplam Ürün",
      value: stats.total,
      icon: Package,
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Fiyat Artışı",
      value: stats.increased,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-green-600",
      shadow: "shadow-emerald-500/20",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      label: "Fiyat Düşüşü",
      value: stats.decreased,
      icon: TrendingDown,
      gradient: "from-rose-500 to-red-600",
      shadow: "shadow-rose-500/20",
      bg: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      label: "Son 30 Gün",
      value: stats.recentlyUpdated,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden rounded-xl border ${card.bg} p-4 transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.shadow}`}
            >
              <card.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{card.value.toLocaleString("tr-TR")}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
