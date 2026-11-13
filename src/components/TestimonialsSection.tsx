import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Instagram,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import {
  BUSINESS_INFO,
  INSTAGRAM_FEED,
  TESTIMONIALS,
  buildWhatsAppUrl,
} from '../data/boxData';
import { ResilientImage } from './ResilientImage';
import { ScrollReveal } from './ScrollReveal';

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? TESTIMONIALS.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === TESTIMONIALS.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section
      id="depoimentos"
      aria-labelledby="testimonials-heading"
      className="border-b border-white/10 bg-[#0B0E12] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                Prova Social Real · Alunos do Box
              </p>
              <h2
                id="testimonials-heading"
                className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl text-balance"
              >
                Quem começa do zero{' '}
                <span className="text-[#149CEA]">não fica sem</span>
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#B4BCC6]">
                Histórias reais de quem treina no Petrolândia e região de Betim
                com foco em emagrecimento, definição, hipertrofia e saúde.
              </p>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center gap-3 self-start lg:self-auto">
              <span className="font-mono text-xs text-[#9AA3AF] tabular-nums">
                {String(activeIndex + 1).padStart(2, '0')} /{' '}
                {String(TESTIMONIALS.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Depoimento anterior"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#11151A] text-white transition-colors hover:border-[#149CEA] hover:text-[#29A8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Próximo depoimento"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#11151A] text-white transition-colors hover:border-[#149CEA] hover:text-[#29A8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* 3 Clean Member Cards with Photo, Name, Short Quote & Star Rating */}
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, idx) => {
            const isActive = idx === activeIndex;
            return (
              <ScrollReveal
                key={testimonial.id}
                delayMs={idx * 80}
                className={`${isActive ? 'block' : 'hidden md:block'}`}
              >
                <article
                  onClick={() => setActiveIndex(idx)}
                  className={`flex h-full cursor-pointer flex-col justify-between rounded-xl border p-6 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#149CEA] bg-[#111820]'
                      : 'border-white/12 bg-[#11151A] hover:border-white/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3.5">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#149CEA]/50 bg-[#080A0C]">
                        <ResilientImage
                          src={testimonial.photoSrc}
                          alt={testimonial.photoAlt}
                          className="h-full w-full object-cover object-top"
                          fallbackTitle={testimonial.name}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-xl font-bold uppercase tracking-wide text-white">
                          {testimonial.name}
                        </h3>
                        <p className="truncate text-xs font-medium text-[#29A8F5]">
                          {testimonial.focus}
                        </p>
                      </div>
                    </div>

                    <div
                      className="mt-4 flex items-center gap-1"
                      aria-label={`Avaliação ${testimonial.rating} de 5 estrelas`}
                    >
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star
                          key={starIdx}
                          className={`h-4 w-4 ${
                            starIdx < testimonial.rating
                              ? 'fill-[#149CEA] text-[#149CEA]'
                              : 'text-white/20'
                          }`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    <p className="mt-3 text-base font-medium leading-snug text-white">
                      “{testimonial.quote}”
                    </p>
                  </div>

                  <p className="mt-5 border-t border-white/10 pt-3 text-xs text-[#9AA3AF]">
                    {testimonial.memberSince}
                  </p>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Slide Indicators (mobile) + Trial CTA */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center md:hidden">
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Selecionar depoimento"
          >
            {TESTIMONIALS.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Ver depoimento de ${t.name}`}
                onClick={() => setActiveIndex(idx)}
                className="flex min-h-[44px] min-w-[32px] items-center justify-center"
              >
                <span
                  className={`block h-2.5 rounded-full transition-all duration-200 ${
                    idx === activeIndex
                      ? 'w-8 bg-[#149CEA]'
                      : 'w-2.5 bg-white/30'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Compact Visual Instagram Grid (@ebberwillian) */}
        <ScrollReveal delayMs={120}>
          <div className="mt-12 rounded-xl border border-white/12 bg-[#0F1317] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#149CEA]/40 bg-[#149CEA]/15 text-[#29A8F5]">
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p id="ig-feed-heading" className="text-sm font-bold text-white">
                    {BUSINESS_INFO.instagramHandle} · Rua Refinaria União, 124
                  </p>
                  <p id="ig-feed-desc" className="text-xs text-[#9AA3AF]">
                    Movimento real e comunidade treinando todos os dias
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="ig-follow-cta-label"
                  aria-describedby="ig-feed-heading ig-feed-desc"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-white/20 bg-[#080A0C] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-[#149CEA] hover:text-[#29A8F5] sm:whitespace-nowrap"
                >
                  <span id="ig-follow-cta-label">Seguir no Instagram</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
                <a
                  href={buildWhatsAppUrl(
                    'Olá! Vi os depoimentos e fotos no site da Crossfit Ebber e quero agendar meus 2 dias de aula experimental.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="ig-trial-cta-label"
                  aria-describedby="ig-feed-heading ig-feed-desc"
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-md bg-[#0C7EC8] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA] sm:whitespace-nowrap"
                >
                  <span id="ig-trial-cta-label">Agendar 2 Dias Experimentais</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {INSTAGRAM_FEED.map((post) => (
                <a
                  key={post.id}
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-lg border border-white/10 bg-[#080A0C]"
                >
                  <ResilientImage
                    src={post.src}
                    alt={post.alt}
                    className="aspect-[3/4] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
                    fallbackTitle={post.caption}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                  />
                  <p className="absolute right-2.5 bottom-2.5 left-2.5 truncate text-[11px] font-medium text-white">
                    {post.caption}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
