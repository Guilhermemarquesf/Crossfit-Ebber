import { useState } from 'react';
import { ChevronDown, Clock, ArrowUpRight } from 'lucide-react';
import {
  CLASS_SCHEDULE,
  FAQ_ITEMS,
  buildWhatsAppUrl,
} from '../data/boxData';
import { ScrollReveal } from './ScrollReveal';

export function FaqScheduleSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);
  const [selectedHour, setSelectedHour] = useState<string>('19:00');

  return (
    <section
      id="duvidas"
      aria-labelledby="faq-heading"
      className="border-b border-white/10 bg-[#080A0C] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Compact FAQ Accordion */}
          <ScrollReveal className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
              Para Iniciantes · Sem Dúvidas
            </p>
            <h2
              id="faq-heading"
              className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl text-balance"
            >
              Perguntas <span className="text-[#149CEA]">frequentes</span>
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#B4BCC6]">
              Tudo o que você precisa saber antes de agendar seus 2 dias de aula
              experimental no Petrolândia.
            </p>

            <div className="mt-8 divide-y divide-white/10 border-t border-b border-white/10">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`panel-${item.id}`}
                      onClick={() =>
                        setOpenId((prev) => (prev === item.id ? null : item.id))
                      }
                      className="flex min-h-[60px] w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[#29A8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
                    >
                      <span className="font-display text-xl font-bold uppercase tracking-tight text-white sm:text-2xl">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#29A8F5] transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div
                        id={`panel-${item.id}`}
                        className="pb-5 pr-6 text-sm leading-relaxed text-[#B4BCC6] sm:text-base"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollReveal>

          {/* Right: Clean Class Schedule Grid (06:00 - 22:00) */}
          <ScrollReveal delayMs={100} className="lg:col-span-5">
            <div
              role="region"
              aria-labelledby="schedule-heading"
              aria-describedby="schedule-desc"
              className="rounded-xl border border-white/15 bg-[#101419] p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                    Grade de Horários
                  </p>
                  <h3
                    id="schedule-heading"
                    className="mt-1.5 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
                  >
                    Funcionamento 06:00 às 22:00
                  </h3>
                  <p id="schedule-desc" className="mt-1.5 text-sm text-[#A8B1BC]">
                    Toque em um horário para já agendar sua aula experimental.
                  </p>
                </div>
                <Clock
                  className="h-6 w-6 shrink-0 text-[#29A8F5]"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-6 space-y-5">
                {CLASS_SCHEDULE.map((group) => {
                  const periodId = `schedule-period-${group.period.toLowerCase()}`;
                  return (
                    <div
                      key={group.period}
                      role="group"
                      aria-labelledby={periodId}
                    >
                      <span
                        id={periodId}
                        className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                      >
                        {group.period}
                      </span>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {group.hours.map((hour) => {
                          const active = selectedHour === hour;
                          return (
                            <button
                              key={hour}
                              type="button"
                              aria-pressed={active}
                              aria-describedby={periodId}
                              onClick={() => setSelectedHour(hour)}
                              className={`min-h-[40px] rounded-md border px-3.5 py-2 font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                                active
                                  ? 'border-[#149CEA] bg-[#0C7EC8] text-white'
                                  : 'border-white/12 bg-[#080A0C] text-[#D1D5DB] hover:border-[#149CEA]/60 hover:text-white'
                              }`}
                            >
                              {hour}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 border-t border-white/10 pt-5">
                <a
                  href={buildWhatsAppUrl(
                    `Olá! Vi o site da Crossfit Ebber e gostaria de agendar meus 2 dias de aula experimental no horário das ${selectedHour}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="schedule-cta-label"
                  aria-describedby="schedule-heading schedule-desc schedule-note"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-150 hover:bg-[#149CEA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span id="schedule-cta-label">
                    Agendar para às {selectedHour}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <p
                  id="schedule-note"
                  className="mt-2.5 text-center text-xs text-[#9AA3AF]"
                >
                  Escolha seu plano presencialmente após experimentar 2 dias
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
