import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { BUSINESS_INFO } from '../data/boxData';

const DarkGoogleMap = lazy(() =>
  import('./DarkGoogleMap').then((mod) => ({ default: mod.DarkGoogleMap }))
);

function MapPlaceholderCard({ onActivate }: { onActivate?: () => void }) {
  return (
    <div className="flex h-[300px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#080A0C] p-6 text-center sm:h-[340px]">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#149CEA]/40 bg-[#149CEA]/15 text-[#29A8F5]">
        <MapPin className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-lg font-bold uppercase text-white">
          {BUSINESS_INFO.addressStreet}
        </p>
        <p className="mt-1 text-xs text-[#A1AAB5]">
          {BUSINESS_INFO.addressReference} · {BUSINESS_INFO.addressNeighborhood}
        </p>
      </div>
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-[#149CEA]/60 bg-[#0C7EC8]/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0C7EC8]"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Carregar Mapa Interativo</span>
        </button>
      ) : (
        <p className="text-xs text-[#9AA3AF]">Carregando mapa interativo...</p>
      )}
    </div>
  );
}

export function LazyDarkGoogleMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || shouldLoadMap) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadMap(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '320px 0px',
        threshold: 0.01,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <div ref={containerRef} className="w-full">
      {shouldLoadMap ? (
        <Suspense fallback={<MapPlaceholderCard />}>
          <DarkGoogleMap />
        </Suspense>
      ) : (
        <MapPlaceholderCard onActivate={() => setShouldLoadMap(true)} />
      )}
    </div>
  );
}
