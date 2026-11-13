import { useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Componente de imagem otimizado para PageSpeed mobile:
 * - Todas as mídias do box são servidas em formato WebP comprimido (/assets/ebber/*.webp)
 * - Imagens abaixo da dobra utilizam loading="lazy", decoding="async" e fetchPriority="low"
 * - Fallback visual garante integridade de layout caso alguma mídia falhe
 */
export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle = 'Crossfit Ebber',
  loading = 'lazy',
  fetchPriority,
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  const resolvedPriority =
    fetchPriority ?? (loading === 'eager' ? 'high' : 'low');

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#12161B] via-[#0B0E12] to-[#080A0C] border border-white/10 p-6 text-center ${className}`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#149CEA]/40 bg-[#149CEA]/10 text-[#149CEA]">
          <Dumbbell className="h-6 w-6" aria-hidden="true" />
        </div>
        <span className="font-display text-lg font-bold uppercase tracking-wide text-white/85">
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={resolvedPriority}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
