import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  METHODOLOGY_BENEFITS,
  TRIAL_GOALS,
  TRIAL_LEVELS,
  TRIAL_PERIODS,
  TRIAL_STEPS,
  buildWhatsAppUrl,
} from '../data/boxData';
import { ScrollReveal } from './ScrollReveal';

export function MethodologySection() {
  const [selectedLevel, setSelectedLevel] = useState<string>(TRIAL_LEVELS[0]);
  const [selectedGoal, setSelectedGoal] = useState<string>(TRIAL_GOALS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(TRIAL_PERIODS[2]);

  const customWhatsAppMessage = `Olá! Vim pelo site da Crossfit Ebber e gostaria de agendar meus 2 dias de aula experimental.\n• Nível: ${selectedLevel}\n• Objetivo: ${selectedGoal}\n• Faixa de horário (06:00 às 22:00): ${selectedPeriod}`;

  return (
    <section
      id="metodologia"
      aria-labelledby="methodology-heading"
      className="border-b border-white/10 bg-[#080A0C] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left: 4 Specialties & Benefits */}
          <ScrollReveal className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
              Nossas Especialidades & Metodologia
            </p>
            <h2
              id="methodology-heading"
              className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl text-balance"
            >
              Treinos focados no{' '}
              <span className="text-[#149CEA]">seu objetivo</span>
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#B4BCC6]">
              Na Crossfit Ebber atuamos com foco técnico e acompanhamento
              individualizado em emagrecimento, definição, hipertrofia e
              condicionamento físico completo — todos os dias das 06:00 às
              22:00.
            </p>

            <div className="mt-8 divide-y divide-white/10 border-t border-b border-white/10">
              {METHODOLOGY_BENEFITS.map((item, idx) => (
                <ScrollReveal key={item.number} delayMs={idx * 70}>
                  <div className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-12 sm:gap-6">
                    <div className="sm:col-span-2">
                      <span className="font-mono text-lg font-semibold tabular-nums text-[#149CEA]">
                        {item.number}
                      </span>
                    </div>
                    <div className="sm:col-span-10">
                      <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#B4BCC6] sm:text-base">
                        {item.summary}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[#29A8F5]">
                        {item.highlight}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Clear 3-Step Onboarding for 2-Day Trial */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TRIAL_STEPS.map((s, idx) => (
                <ScrollReveal key={s.step} delayMs={idx * 80}>
                  <div className="h-full rounded-lg border border-white/10 bg-[#0E1216] p-4">
                    <span className="font-mono text-xs font-semibold tabular-nums text-[#29A8F5]">
                      Passo {s.step}
                    </span>
                    <h4 className="mt-1 font-display text-lg font-bold uppercase text-white">
                      {s.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#A1AAB5]">
                      {s.detail}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          {/* Right: Interactive 2-Day Trial Configurator */}
          <ScrollReveal delayMs={100} className="lg:col-span-5">
            <div
              role="region"
              aria-labelledby="trial-config-heading"
              aria-describedby="trial-config-desc"
              className="rounded-xl border border-white/15 bg-[#101419] p-6 sm:p-8"
            >
              <div className="border-b border-white/10 pb-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                  2 Dias de Aula Experimental
                </p>
                <h3
                  id="trial-config-heading"
                  className="mt-1.5 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
                >
                  Monte sua Experiência no Box
                </h3>
                <p id="trial-config-desc" className="mt-2 text-sm text-[#A8B1BC]">
                  Escolha seu nível, especialidade desejada e faixa de horário
                  (06:00 às 22:00) para agendar direto no WhatsApp.
                </p>
              </div>

              <div className="mt-6 space-y-6">
                {/* Level */}
                <div role="group" aria-labelledby="trial-level-label">
                  <span
                    id="trial-level-label"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                  >
                    1. Qual seu nível atual?
                  </span>
                  <div className="mt-2.5 flex flex-col gap-2">
                    {TRIAL_LEVELS.map((level) => {
                      const active = selectedLevel === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          aria-pressed={active}
                          aria-describedby="trial-level-label"
                          onClick={() => setSelectedLevel(level)}
                          className={`flex min-h-[42px] items-center justify-between rounded-md border px-3.5 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                            active
                              ? 'border-[#149CEA] bg-[#149CEA]/15 font-semibold text-white'
                              : 'border-white/10 bg-[#0A0D10] text-[#B4BCC6] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <span>{level}</span>
                          {active && (
                            <span className="text-xs font-bold text-[#29A8F5]">
                              Selecionado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goal */}
                <div role="group" aria-labelledby="trial-goal-label">
                  <span
                    id="trial-goal-label"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                  >
                    2. Qual sua especialidade de interesse?
                  </span>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {TRIAL_GOALS.map((goal) => {
                      const active = selectedGoal === goal;
                      return (
                        <button
                          key={goal}
                          type="button"
                          aria-pressed={active}
                          aria-describedby="trial-goal-label"
                          onClick={() => setSelectedGoal(goal)}
                          className={`min-h-[42px] rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                            active
                              ? 'border-white/70 bg-white/10 font-semibold text-white'
                              : 'border-white/10 bg-[#0A0D10] text-[#B4BCC6] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {goal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Period */}
                <div role="group" aria-labelledby="trial-period-label">
                  <span
                    id="trial-period-label"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                  >
                    3. Horário de preferência (06:00 às 22:00)
                  </span>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {TRIAL_PERIODS.map((period) => {
                      const active = selectedPeriod === period;
                      return (
                        <button
                          key={period}
                          type="button"
                          aria-pressed={active}
                          aria-describedby="trial-period-label"
                          onClick={() => setSelectedPeriod(period)}
                          className={`min-h-[40px] rounded-md border px-2 py-2 text-center font-mono text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
                            active
                              ? 'border-[#149CEA] bg-[#0C7EC8] text-white'
                              : 'border-white/10 bg-[#0A0D10] text-[#B4BCC6] hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {period}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-7 border-t border-white/10 pt-5">
                <a
                  href={buildWhatsAppUrl(customWhatsAppMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="trial-config-cta-label"
                  aria-describedby="trial-config-heading trial-config-desc trial-config-note"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-150 hover:bg-[#149CEA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span id="trial-config-cta-label">
                    Garantir 2 Dias pelo WhatsApp
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <p
                  id="trial-config-note"
                  className="mt-2.5 text-center text-xs text-[#9AA3AF]"
                >
                  Atendimento direto no (31) 98632-5827 · Sem compromisso
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
