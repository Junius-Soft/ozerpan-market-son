export function OfferDetailSkeleton() {
  return (
    <div className="py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          <div className="h-5 w-8 bg-muted animate-pulse rounded" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="ml-auto">
            <div className="h-9 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sol: Pozlar tablosu/kartları skeleton */}
          <div className="flex-1">
            {/* Mobilde kart grid skeleton */}
            <div className="block md:hidden space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-card dark:bg-card rounded-lg p-6 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-5 w-6 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-32 mb-1 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 mb-1 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 mb-1 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-28 mb-1 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 mb-1 bg-muted animate-pulse rounded" />
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            {/* Masaüstü tablo skeleton */}
            <div className="hidden md:block bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 mb-3">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
              <div className="flex gap-2 mt-4">
                <div className="h-9 w-36 bg-muted animate-pulse rounded" />
                <div className="h-9 w-28 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
          {/* Sağ: Toplam Bilgileri kartı skeleton */}
          <div className="w-full lg:w-[400px] space-y-6">
            <div className="bg-card dark:bg-card rounded-lg p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-5 w-12 bg-muted animate-pulse rounded" />
              </div>
              {/* Uyarı kutusu skeleton */}
              <div className="h-12 w-full rounded mb-2 bg-muted animate-pulse" />
              <div className="h-4 w-32 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-10 w-full mb-2 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/3 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-4 w-1/2 mb-2 bg-muted animate-pulse rounded" />
              <div className="h-6 w-1/2 mb-4 bg-muted animate-pulse rounded" />
              <div className="flex gap-2 mt-4">
                <div className="h-9 w-32 bg-muted animate-pulse rounded" />
                <div className="h-9 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
