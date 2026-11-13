import { useEffect, useState } from 'react';
import {
  Check,
  ArrowUpRight,
  Maximize2,
  X,
  Play,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BOX_GALLERY,
  BUSINESS_INFO,
  GalleryItem,
  StructureCategory,
  buildWhatsAppUrl,
} from '../data/boxData';
import { ResilientImage } from './ResilientImage';
import { ScrollReveal } from './ScrollReveal';

const FILTER_OPTIONS: { id: StructureCategory; label: string }[] = [
  { id: 'todos', label: 'Todos os Registros' },
  { id: 'comunidade', label: 'Comunidade & Aulas' },
  { id: 'estrutura', label: 'Estrutura & Equipamentos' },
  { id: 'campanhas', label: 'Convite & Propósito' },
];

function getFitClass(fitMode: GalleryItem['fitMode']): string {
  if (fitMode === 'contain') return 'object-contain object-center bg-[#07090B]';
  if (fitMode === 'cover-top') return 'object-cover object-top';
  return 'object-cover object-center';
}

export function BoxStructureSection() {
  const [activeFilter, setActiveFilter] = useState<StructureCategory>('todos');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const featuredSpace = BOX_GALLERY[0];
  const secondaryCards =
    activeFilter === 'todos'
      ? BOX_GALLERY.slice(1)
      : BOX_GALLERY.filter((item) => item.category === activeFilter);

  const openLightboxById = (id: string) => {
    const idx = BOX_GALLERY.findIndex((g) => g.id === id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % BOX_GALLERY.length
        );
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + BOX_GALLERY.length) % BOX_GALLERY.length
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex]);

  const activeLightboxItem =
    lightboxIndex !== null ? BOX_GALLERY[lightboxIndex] : null;

  return (
    <section
      id="o-box"
      aria-labelledby="box-structure-heading"
      className="border-b border-white/10 bg-[#0B0E12] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                O Box · Estrutura & Comunidade
              </p>
              <h2
                id="box-structure-heading"
                className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl text-balance"
              >
                Fotos reais das nossas{' '}
                <span className="text-[#149CEA]">turmas e estrutura</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#B4BCC6]">
                Piso emborrachado, wood boxes, cordas, argolas, pneu,
                kettlebells, medicine balls e uma comunidade acolhedora — tudo
                pronto das{' '}
                <strong className="font-semibold text-white">
                  06:00 às 22:00
                </strong>{' '}
                para receber do iniciante ao avançado.
              </p>
            </div>

            {/* Interactive Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filtrar fotos do box"
              className="flex flex-wrap items-center gap-1.5 rounded-lg border border-white/10 bg-[#12161B] p-1.5 self-start lg:self-auto"
            >
              {FILTER_OPTIONS.map((option) => {
                const isSelected = activeFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveFilter(option.id)}
                    className={`min-h-[42px] rounded-md px-3.5 py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                      isSelected
                        ? 'bg-[#0C7EC8] text-white'
                        : 'text-[#A1AAB5] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Marquee Feature Card: Real Box Photo + Video Reel */}
        {activeFilter === 'todos' && (
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Real Box Interior Card */}
            <ScrollReveal className="lg:col-span-8">
              <article className="grid h-full grid-cols-1 overflow-hidden rounded-xl border border-white/15 bg-[#11151A] lg:grid-cols-12">
                <div className="relative bg-[#080A0C] lg:col-span-6">
                  <ResilientImage
                    src={featuredSpace.imageSrc}
                    alt={featuredSpace.imageAlt}
                    fallbackTitle={featuredSpace.title}
                    className="h-full w-full object-cover object-center aspect-[3/4]"
                  />
                  <button
                    type="button"
                    onClick={() => openLightboxById(featuredSpace.id)}
                    aria-label="Ampliar foto do espaço do box"
                    className="absolute right-3 bottom-3 inline-flex h-9 items-center gap-1.5 rounded-md border border-white/25 bg-[#080A0C]/85 px-3 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:border-[#149CEA] hover:text-[#29A8F5]"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Ampliar</span>
                  </button>
                </div>

                <div className="flex flex-col justify-between p-6 sm:p-7 lg:col-span-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-[#29A8F5]">
                      <span>{featuredSpace.categoryLabel}</span>
                      <span aria-hidden="true" className="text-white/25">
                        ·
                      </span>
                      <span className="text-[#9AA3AF]">Crossfit Ebber</span>
                    </div>

                    <h3
                      id="featured-box-title"
                      className="mt-2.5 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl text-balance"
                    >
                      {featuredSpace.title}
                    </h3>

                    <p
                      id="featured-box-desc"
                      className="mt-3 text-sm leading-relaxed text-[#B4BCC6] sm:text-base"
                    >
                      {featuredSpace.description}
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                      {featuredSpace.specs.map((spec) => (
                        <li
                          key={spec}
                          className="flex items-start gap-2.5 text-sm text-[#E2E6EC]"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#149CEA]"
                            aria-hidden="true"
                          />
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-2">
                    <a
                      href={buildWhatsAppUrl(
                        'Olá! Vi as fotos do box da Crossfit Ebber e quero agendar meus 2 dias de aula experimental.'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-labelledby="featured-box-cta-label"
                      aria-describedby="featured-box-title featured-box-desc"
                      className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] sm:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span id="featured-box-cta-label">
                        Agendar 2 Dias Experimentais
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>
            </ScrollReveal>

            {/* Official Promo Video Card */}
            <ScrollReveal delayMs={100} className="lg:col-span-4">
              <div className="flex h-full flex-col justify-between overflow-hidden rounded-xl border border-white/15 bg-[#11151A] p-5">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#29A8F5]">
                    <span className="inline-flex items-center gap-1.5">
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Vídeo Oficial do Box</span>
                    </span>
                    <span className="text-[#9AA3AF]">@ebberwillian</span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-tight text-white">
                    Precisando Emagrecer? Comece Agora
                  </h3>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-white/15 bg-black">
                  <video
                    src={BUSINESS_INFO.assets.promoVideo}
                    controls
                    playsInline
                    preload="none"
                    poster={BUSINESS_INFO.assets.posterInvista}
                    className="mx-auto aspect-[9/16] max-h-[420px] w-full object-contain bg-black"
                  >
                    Seu navegador não suporta a reprodução de vídeo.
                  </video>
                </div>
              </div>
            </ScrollReveal>
          </div>
        )}

        {/* Secondary Cards Grid */}
        <div
          className={`mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 ${
            secondaryCards.length === 2
              ? 'lg:grid-cols-2'
              : secondaryCards.length === 4
                ? 'lg:grid-cols-4'
                : 'lg:grid-cols-3'
          }`}
        >
          {secondaryCards.map((item, idx) => (
            <ScrollReveal key={item.id} delayMs={(idx % 4) * 70}>
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-white/12 bg-[#11151A] transition-colors duration-200 hover:border-[#149CEA]/60">
                <div className="relative bg-[#07090B]">
                  <ResilientImage
                    src={item.imageSrc}
                    alt={item.imageAlt}
                    fallbackTitle={item.title}
                    className={`w-full aspect-[3/4] ${getFitClass(
                      item.fitMode
                    )}`}
                  />
                  <button
                    type="button"
                    onClick={() => openLightboxById(item.id)}
                    aria-label={`Ampliar imagem ${item.title}`}
                    className="absolute right-3 bottom-3 inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-white/25 bg-[#080A0C]/85 px-3 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:border-[#149CEA] hover:text-[#29A8F5]"
                  >
                    <Maximize2 className="h-3 w-3" aria-hidden="true" />
                    <span>Ampliar</span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <span className="text-xs font-medium text-[#29A8F5]">
                      {item.categoryLabel}
                    </span>
                    <h3 className="mt-1.5 font-display text-xl font-bold uppercase tracking-tight text-white text-balance">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#A8B1BC]">
                      {item.description}
                    </p>
                  </div>

                  <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-3">
                    {item.specs.map((spec) => (
                      <li
                        key={spec}
                        className="flex items-start gap-2 text-xs text-[#D1D5DB]"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#149CEA]"
                          aria-hidden="true"
                        />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Lightbox Modal with Prev/Next navigation */}
      {activeLightboxItem && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightboxItem.title}
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-xl border border-white/20 bg-[#0D1014] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#29A8F5]">
                  {activeLightboxItem.categoryLabel} ·{' '}
                  <span className="font-mono tabular-nums text-[#9AA3AF]">
                    {String(lightboxIndex + 1).padStart(2, '0')}/
                    {String(BOX_GALLERY.length).padStart(2, '0')}
                  </span>
                </p>
                <h4 className="font-display text-lg font-bold uppercase text-white">
                  {activeLightboxItem.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + BOX_GALLERY.length) %
                        BOX_GALLERY.length
                    )
                  }
                  aria-label="Foto anterior"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#12161B] text-white hover:border-[#149CEA]"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % BOX_GALLERY.length)
                  }
                  aria-label="Próxima foto"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#12161B] text-white hover:border-[#149CEA]"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Fechar visualização ampliada"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#12161B] text-white hover:border-[#149CEA]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center overflow-hidden rounded-lg bg-black">
              <ResilientImage
                src={activeLightboxItem.imageSrc}
                alt={activeLightboxItem.imageAlt}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
