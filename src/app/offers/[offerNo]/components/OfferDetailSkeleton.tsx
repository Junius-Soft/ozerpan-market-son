import { Skeleton } from "@/components/ui/skeleton";

export function OfferDetailSkeleton() {
  return (
    <div className="py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-32" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sol: Pozlar tablosu/kartları skeleton */}
          <div className="flex-1">
            {/* Mobilde kart grid skeleton */}
            <div className="block md:hidden space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6 flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-6" />
                  </div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-4 w-32 mb-1" />
                  <div className="flex flex-col gap-2 mt-2">
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
            {/* Masaüstü tablo skeleton */}
            <div className="hidden md:block bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 mb-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-36" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </div>
          {/* Sağ: Toplam Bilgileri kartı skeleton */}
          <div className="w-full lg:w-[400px] space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-12" />
              </div>
              {/* Uyarı kutusu skeleton */}
              <Skeleton className="h-12 w-full rounded mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-10 w-full mb-2 rounded" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
