import React, { useState, useEffect } from "react";
import { ArrowDown } from "lucide-react";

interface FloatingTotalButtonProps {
  summaryRef: React.RefObject<HTMLDivElement>;
  total: number;
}

export function FloatingTotalButton({
  summaryRef,
  total,
}: FloatingTotalButtonProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    function onScroll() {
      if (!summaryRef.current) return;
      const rect = summaryRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      setVisible(!isVisible);
    }
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [summaryRef]);

  if (total === 0) return null;
  return (
    <button
      type="button"
      className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg font-semibold text-base md:hidden transition-opacity duration-300 hover:bg-blue-700 ${
        visible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      onClick={() => {
        summaryRef.current?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      <ArrowDown className="h-5 w-5 mr-1" />
      Toplam: € {total.toFixed(2)}
    </button>
  );
}
