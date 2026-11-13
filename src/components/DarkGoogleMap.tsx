import { useEffect, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation } from 'lucide-react';
import { BUSINESS_INFO } from '../data/boxData';

interface LatLngCoords {
  lat: number;
  lng: number;
}

interface ResolvedPlace {
  location: LatLngCoords;
  formattedAddress: string;
}

interface MapContentProps {
  onResolved: () => void;
  onFallback: () => void;
}

function CrossfitEbberMapContent({ onResolved, onFallback }: MapContentProps) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(
    null
  );
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    if (!placesLib || !map) return;

    let cancelled = false;

    const locateBox = async () => {
      try {
        const { places } = await placesLib.Place.searchByText({
          textQuery: BUSINESS_INFO.addressSearchQuery,
          fields: ['location', 'formattedAddress'],
          maxResultCount: 1,
          language: 'pt-BR',
          region: 'BR',
        });

        if (cancelled) return;

        const match = places?.[0];
        if (match?.location) {
          const coords: LatLngCoords = {
            lat: match.location.lat(),
            lng: match.location.lng(),
          };
          setResolvedPlace({
            location: coords,
            formattedAddress:
              match.formattedAddress || BUSINESS_INFO.addressFull,
          });
          map.setCenter(coords);
          map.setZoom(16);
          onResolved();
        } else {
          onFallback();
        }
      } catch (err) {
        if (cancelled) return;
        const msg = String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('Quota') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onFallback();
      }
    };

    void locateBox();

    return () => {
      cancelled = true;
    };
  }, [placesLib, map, onResolved, onFallback]);

  if (!resolvedPlace) {
    return null;
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={resolvedPlace.location}
        title="Crossfit Ebber - Rua Refinaria União, 124"
        onClick={() => setInfoOpen((prev) => !prev)}
      >
        <Pin
          background="#149CEA"
          borderColor="#0C7EC8"
          glyphColor="#FFFFFF"
          scale={1.2}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={240}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-slate-900">
            <p className="text-xs font-extrabold uppercase tracking-wide text-[#0C7EC8]">
              Crossfit Ebber
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-900">
              {BUSINESS_INFO.addressStreet}
            </p>
            <p className="text-[11px] text-slate-600">
              {BUSINESS_INFO.addressReference} · Petrolândia
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function DarkGoogleMap() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [searchFallback, setSearchFallback] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () =>
      window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  if (!apiKey || quotaExceeded || searchFallback) {
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
        <a
          href={BUSINESS_INFO.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-[#0C7EC8] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#149CEA]"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Ver no Google Maps</span>
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-lg border border-white/15 bg-[#080A0C] sm:h-[340px]">
      {!isReady && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#080A0C]/90 text-xs text-[#A1AAB5]"
        >
          <MapPin className="h-5 w-5 text-[#29A8F5]" />
          <span>Carregando mapa da Rua Refinaria União, 124...</span>
        </div>
      )}
      <APIProvider
        apiKey={apiKey}
        libraries={['places', 'marker']}
        language="pt-BR"
        region="BR"
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          colorScheme="DARK"
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <CrossfitEbberMapContent
            onResolved={() => setIsReady(true)}
            onFallback={() => setSearchFallback(true)}
          />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
