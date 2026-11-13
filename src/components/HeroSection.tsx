import { ArrowUpRight, ChevronRight } from 'lucide-react';
import { BUSINESS_INFO, buildWhatsAppUrl } from '../data/boxData';
import { ResilientImage } from './ResilientImage';
import { ScrollReveal } from './ScrollReveal';

const HERO_STRIPS = [
  {
    index: '01',
    title: 'Funcionamento',
    detail: 'Segunda a Sexta das 06:00 às 22:00',
  },
  {
    index: '02',
    title: 'Especialidades',
    detail: 'Emagrecimento, Definição, Hipertrofia e Condicionamento',
  },
  {
    index: '03',
    title: 'Localização Estratégica',
    detail: 'Em frente à UPA Petrolândia · Divisa com Betim',
  },
  {
    index: '04',
    title: '2 Dias Experimentais',
    detail: `Agende direto no ${BUSINESS_INFO.whatsappDisplay}`,
  },
];

export function HeroSection() {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-white/10 bg-[#080A0C]"
    >
      {/* Subtle architectural dark grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-4 pt-8 pb-10 sm:px-6 lg:px-8 lg:pt-14 lg:pb-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch lg:gap-10">
          {/* Left Copy Column */}
          <ScrollReveal className="flex flex-col justify-between lg:col-span-6 lg:py-2">
            <div>
              {/* Official Logo Banner cleanly cropped */}
              <div className="mb-6 inline-block overflow-hidden rounded-md border border-white/15 bg-[#12161B]">
                <ResilientImage
                  src={BUSINESS_INFO.assets.logoBanner}
                  alt="Logo oficial Crossfit Ebber Atividades Físicas"
                  className="h-12 w-auto object-contain sm:h-14"
                  fallbackTitle="Crossfit Ebber"
                  loading="eager"
                />
              </div>

              {/* Quiet unboxed metadata kicker */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-[#29A8F5] sm:text-sm">
                <span>Ebber Atividades Físicas</span>
                <span aria-hidden="true" className="text-white/30">
                  ·
                </span>
                <span className="text-[#B4BCC6]">
                  Petrolândia, Contagem · 06:00 às 22:00
                </span>
              </div>

              <h1
                id="hero-heading"
                className="mt-4 font-display font-extrabold uppercase tracking-tight text-white text-balance"
                style={{
                  fontSize: 'clamp(2.5rem, 4.4vw, 4.25rem)',
                  lineHeight: 0.96,
                }}
              >
                O corpo alcança o que a mente{' '}
                <span className="text-[#149CEA]">acredita</span>
              </h1>

              <p
                id="hero-specialties"
                className="mt-4 font-display text-xl font-bold uppercase tracking-wide text-[#29A8F5] sm:text-2xl"
              >
                Especialidade em emagrecimento, definição, hipertrofia e
                condicionamento físico.
              </p>

              <p
                id="hero-subtitle"
                className="mt-4 max-w-xl text-base leading-relaxed text-[#C4CBD4] sm:text-lg"
              >
                Treinar é sobre saúde, confiança e bem-estar. Experimente nossa
                metodologia com{' '}
                <strong className="font-semibold text-white">
                  2 dias de aula experimental
                </strong>{' '}
                no Petrolândia — horários das 06:00 às 22:00 para iniciantes e
                avançados.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={buildWhatsAppUrl(
                  'Olá! Quero agendar meus 2 dias de aula experimental na Crossfit Ebber!'
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-labelledby="hero-cta-primary-label"
                aria-describedby="hero-specialties hero-subtitle"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-white transition-all duration-150 hover:bg-[#149CEA] active:scale-[0.98] sm:px-6 sm:whitespace-nowrap sm:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span id="hero-cta-primary-label">
                  Agendar 2 Dias de Aula Experimental
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>

              <a
                href="#o-box"
                aria-labelledby="hero-cta-secondary-label"
                aria-describedby="hero-subtitle"
                className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-md border border-white/25 bg-[#101418] px-5 py-3 text-sm font-semibold text-white sm:whitespace-nowrap sm:shrink-0 transition-colors duration-150 hover:border-[#149CEA] hover:bg-[#141A21] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
              >
                <span id="hero-cta-secondary-label">Conhecer o Box</span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[#29A8F5]"
                  aria-hidden="true"
                />
              </a>
            </div>
          </ScrollReveal>

          {/* Right Dual Real Media Showcase: Real Community + Official Poster */}
          <ScrollReveal delayMs={100} className="lg:col-span-6">
            <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Real Community & Coach Photo */}
              <div className="relative flex flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0D1014]">
                <div
                  aria-hidden="true"
                  className="h-[2px] w-full bg-[#149CEA]"
                />
                <div className="relative flex-1 bg-[#080A0C]">
                  <ResilientImage
                    src={BUSINESS_INFO.assets.boxComunidade}
                    alt="Turma de alunos sorrindo ao lado do coach Ebber dentro do box da Crossfit Ebber"
                    className="h-full w-full object-cover object-top aspect-[3/4]"
                    fallbackTitle="Comunidade Crossfit Ebber"
                    loading="eager"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080A0C]/90 via-[#080A0C]/45 to-transparent"
                  />
                  <div className="absolute right-3.5 bottom-3.5 left-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#29A8F5]">
                      Comunidade Real
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Do iniciante ao avançado · Petrolândia
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Blue/Black/White Poster */}
              <div className="relative flex flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0D1014]">
                <div
                  aria-hidden="true"
                  className="h-[2px] w-full bg-white/80"
                />
                <div className="relative flex-1 bg-[#050608]">
                  <ResilientImage
                    src={BUSINESS_INFO.assets.posterMente}
                    alt="Arte oficial Crossfit Ebber: Quer resultado? O corpo alcança o que a mente acredita"
                    className="h-full w-full object-contain object-center aspect-[3/4]"
                    fallbackTitle="O Corpo Alcança o que a Mente Acredita"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Full-width 4-Column Summary Strip below Hero Split */}
        <ScrollReveal delayMs={160}>
          <div className="mt-10 grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 bg-[#0E1216] sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            {HERO_STRIPS.map((item) => (
              <div key={item.index} className="px-5 py-4">
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#29A8F5]">
                  <span>{item.index}</span>
                  <span aria-hidden="true" className="text-white/25">
                    /
                  </span>
                  <span className="font-sans font-semibold text-white">
                    {item.title}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#A1AAB5]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
