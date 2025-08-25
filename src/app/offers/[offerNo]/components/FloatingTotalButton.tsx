import React, { useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";

// Local convertCurrency function for FloatingTotalButton
function convertCurrency(
  amount: number,
  currency: string,
  eurRate: number
): number {
  if (currency === "EUR") return amount;
  // TRY'ye çevir: amount * eurRate
  return amount * eurRate;
}

interface FloatingTotalButtonProps {
  summaryRef: React.RefObject<HTMLDivElement>;
  total: number;
  currency: string;
  eurRate: number;
  displayCurrency: string;
}

export function FloatingTotalButton({
  summaryRef,
  total,
  currency,
  eurRate,
  displayCurrency,
}: FloatingTotalButtonProps) {
  const [visible, setVisible] = useState(true);

  // Currency conversion logic
  const getDisplayAmount = () => {
    if (currency === displayCurrency) {
      return total;
    } else {
      if (currency === "EUR" && displayCurrency === "TRY") {
        return convertCurrency(total, currency, eurRate); // This will multiply by eurRate
      } else if (currency === "TRY" && displayCurrency === "EUR") {
        return total / eurRate; // Convert TRY to EUR
      }
      return total; // Fallback
    }
  };

  const displayAmount = getDisplayAmount();

  useEffect(() => {
    if (!summaryRef.current) return;
    const target = summaryRef.current;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.01, // Hemen görünür olunca tetiklenir
      }
    );
    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [summaryRef]);

  if (total === 0) return null;
  return (
    <button
      type="button"
      className={`fixed bottom-6 right-4 z-40 flex items-center gap-2
        bg-black text-white
        dark:bg-white/80 dark:text-zinc-900
        backdrop-blur-lg border border-zinc-200 dark:border-zinc-700 shadow-2xl font-semibold text-base px-5 py-3 rounded-full md:hidden transition-opacity duration-300
        hover:bg-zinc-800/90 dark:hover:bg-white/90 hover:shadow-xl
        ${
          visible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }
      `}
      onClick={() => {
        summaryRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <ArrowDown className="h-5 w-5 mr-1" />
      Toplam:{" "}
      {displayCurrency === "EUR"
        ? `€ ${Number(displayAmount).toFixed(2)}`
        : `₺ ${displayAmount.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
    </button>
  );
}
