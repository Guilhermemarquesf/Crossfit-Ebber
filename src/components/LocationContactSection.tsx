import { useState, FormEvent } from 'react';
import {
  MapPin,
  Navigation,
  Instagram,
  Phone,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { BUSINESS_INFO, TRIAL_GOALS, buildWhatsAppUrl } from '../data/boxData';
import { LazyDarkGoogleMap } from './LazyDarkGoogleMap';
import { ScrollReveal } from './ScrollReveal';

export function LocationContactSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState<string>(TRIAL_GOALS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(BUSINESS_INFO.addressFull);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    } catch {
      setCopiedAddress(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanedName = name.trim();
    const digitsOnly = phone.replace(/\D/g, '');

    if (cleanedName.length < 2) {
      setErrorMsg('Informe seu nome completo para o agendamento.');
      return;
    }

    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      setErrorMsg(
        'Informe um número de WhatsApp válido com DDD (ex: 31 99999-9999).'
      );
      return;
    }

    setErrorMsg(null);
    setSubmitted(true);
  };

  const formattedLeadMsg = `Olá! Me chamo ${name.trim()} (WhatsApp: ${phone.trim()}). Vim pelo site da Crossfit Ebber e quero agendar meus 2 dias de aula experimental com foco em: ${goal}.`;

  return (
    <section
      id="localizacao"
      aria-labelledby="location-heading"
      className="border-b border-white/10 bg-[#0B0E12] py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
            Localização & Contato · Petrolândia / Betim
          </p>
          <h2
            id="location-heading"
            className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl lg:text-5xl text-balance"
          >
            Em frente à{' '}
            <span className="text-[#149CEA]">UPA Petrolândia</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#B4BCC6]">
            Fácil acesso para quem busca CrossFit no Petrolândia, Contagem e
            região de divisa com Betim. Funcionamento das 06:00 às 22:00.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Left: Embedded Dark Google Map + Address & Reference Landmark */}
          <ScrollReveal className="lg:col-span-6">
            <div
              role="region"
              aria-labelledby="location-address-heading"
              aria-describedby="location-reference-desc"
              className="flex h-full flex-col justify-between rounded-xl border border-white/12 bg-[#11151A] p-6 sm:p-8"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#149CEA]/45 bg-[#149CEA]/15 text-[#29A8F5]">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#29A8F5]">
                      Ponto de Referência Oficial
                    </span>
                    <h3
                      id="location-address-heading"
                      className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl"
                    >
                      {BUSINESS_INFO.addressStreet}
                    </h3>
                    <p
                      id="location-reference-desc"
                      className="mt-1 text-base font-semibold text-white"
                    >
                      {BUSINESS_INFO.addressReference}
                    </p>
                    <p
                      id="location-coverage-desc"
                      className="mt-1 text-sm text-[#A1AAB5]"
                    >
                      {BUSINESS_INFO.addressNeighborhood} ·{' '}
                      {BUSINESS_INFO.addressCoverage}
                    </p>
                  </div>
                </div>

                {/* Embedded Dark Mode Google Map (Lazy Loaded on Viewport) */}
                <div className="mt-5">
                  <LazyDarkGoogleMap />
                </div>

                {/* Hours & Quick Actions */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#080A0C] px-4 py-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-white">
                    <Clock
                      className="h-3.5 w-3.5 text-[#29A8F5]"
                      aria-hidden="true"
                    />
                    <span>Funcionamento</span>
                  </span>
                  <span className="font-mono font-semibold text-[#29A8F5] tabular-nums">
                    {BUSINESS_INFO.openingHours}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={BUSINESS_INFO.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-labelledby="location-route-cta-label"
                    aria-describedby="location-address-heading location-reference-desc location-coverage-desc"
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md border border-[#149CEA] bg-[#149CEA]/15 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-[#0C7EC8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span id="location-route-cta-label">
                      Traçar Rota no Google Maps
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    aria-labelledby="location-copy-label"
                    aria-describedby="location-address-heading location-reference-desc"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-white/20 bg-[#0A0D10] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
                  >
                    {copiedAddress ? (
                      <>
                        <Check
                          className="h-4 w-4 shrink-0 text-[#29A8F5]"
                          aria-hidden="true"
                        />
                        <span id="location-copy-label">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span id="location-copy-label">Copiar Endereço</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Channels */}
              <div className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-2">
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="location-wa-label"
                  aria-describedby="location-address-heading location-wa-value"
                  className="flex min-h-[56px] items-center gap-3 rounded-lg border border-white/12 bg-[#0A0D10] px-4 py-3 transition-colors hover:border-[#149CEA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#149CEA]/15 text-[#29A8F5]">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span
                      id="location-wa-label"
                      className="block text-[11px] font-medium uppercase tracking-wider text-[#9AA3AF]"
                    >
                      WhatsApp Oficial
                    </span>
                    <span
                      id="location-wa-value"
                      className="block truncate text-sm font-bold text-white tabular-nums"
                    >
                      {BUSINESS_INFO.whatsappDisplay}
                    </span>
                  </div>
                </a>

                <a
                  href={BUSINESS_INFO.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby="location-ig-label"
                  aria-describedby="location-address-heading location-ig-value"
                  className="flex min-h-[56px] items-center gap-3 rounded-lg border border-white/12 bg-[#0A0D10] px-4 py-3 transition-colors hover:border-white/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
                    <Instagram className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span
                      id="location-ig-label"
                      className="block text-[11px] font-medium uppercase tracking-wider text-[#9AA3AF]"
                    >
                      Instagram
                    </span>
                    <span
                      id="location-ig-value"
                      className="block truncate text-sm font-bold text-white"
                    >
                      {BUSINESS_INFO.instagramHandle}
                    </span>
                  </div>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Validated Lead Capture / Contact Form */}
          <ScrollReveal delayMs={100} className="lg:col-span-6">
            <div
              id="contato"
              role="region"
              aria-labelledby="contact-form-heading"
              aria-describedby="contact-form-desc"
              className="flex h-full flex-col justify-between rounded-xl border border-white/12 bg-[#11151A] p-6 sm:p-8"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                  Fale com a Equipe
                </span>
                <h3
                  id="contact-form-heading"
                  className="mt-1.5 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
                >
                  Garanta 2 Dias de Aula Experimental
                </h3>
                <p
                  id="contact-form-desc"
                  className="mt-2 text-sm leading-relaxed text-[#B4BCC6]"
                >
                  Agende pelo formulário ou direto no WhatsApp e conheça o box
                  pessoalmente antes de escolher seu plano.
                </p>

                {submitted ? (
                  <div
                    role="status"
                    aria-labelledby="lead-confirmation-heading"
                    aria-describedby="lead-confirmation-desc"
                    className="mt-6 rounded-lg border border-[#149CEA]/50 bg-[#0A131C] p-6"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-6 w-6 shrink-0 text-[#29A8F5]"
                        aria-hidden="true"
                      />
                      <div>
                        <h4
                          id="lead-confirmation-heading"
                          className="font-display text-xl font-bold uppercase text-white"
                        >
                          Solicitação pronta para envio
                        </h4>
                        <p
                          id="lead-confirmation-desc"
                          className="mt-1.5 text-sm leading-relaxed text-[#D1D5DB]"
                        >
                          Obrigado,{' '}
                          <strong className="text-white">{name}</strong>! Clique
                          no botão abaixo para confirmar seus 2 dias de aula
                          experimental diretamente no WhatsApp da Crossfit Ebber.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <a
                        href={buildWhatsAppUrl(formattedLeadMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-labelledby="lead-confirm-wa-label"
                        aria-describedby="lead-confirmation-heading lead-confirmation-desc"
                        className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#149CEA]"
                      >
                        <span id="lead-confirm-wa-label">
                          Confirmar no WhatsApp
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitted(false);
                          setName('');
                          setPhone('');
                        }}
                        aria-labelledby="lead-edit-label"
                        aria-describedby="lead-confirmation-heading"
                        className="inline-flex min-h-[46px] items-center justify-center rounded-md border border-white/20 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10"
                      >
                        <span id="lead-edit-label">Editar dados</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    aria-labelledby="contact-form-heading"
                    aria-describedby="contact-form-desc"
                    className="mt-6 space-y-4"
                  >
                    <div>
                      <label
                        id="lead-name-label"
                        htmlFor="lead-name"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                      >
                        Seu Nome
                      </label>
                      <span id="lead-name-hint" className="sr-only">
                        Informe seu nome completo para identificação no
                        agendamento.
                      </span>
                      <input
                        id="lead-name"
                        name="name"
                        type="text"
                        required
                        aria-labelledby="lead-name-label"
                        aria-describedby={
                          errorMsg
                            ? 'lead-name-hint lead-form-error'
                            : 'lead-name-hint'
                        }
                        aria-invalid={Boolean(errorMsg && name.trim().length < 2)}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Lucas Oliveira"
                        className="mt-1.5 w-full rounded-md border border-white/15 bg-[#080A0C] px-3.5 py-3 text-sm text-white placeholder:text-[#6B7280] focus:border-[#149CEA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        id="lead-phone-label"
                        htmlFor="lead-phone"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                      >
                        Seu WhatsApp (com DDD)
                      </label>
                      <span id="lead-phone-hint" className="sr-only">
                        Informe número com DDD, por exemplo 31 99999-9999.
                      </span>
                      <input
                        id="lead-phone"
                        name="phone"
                        type="tel"
                        required
                        aria-labelledby="lead-phone-label"
                        aria-describedby={
                          errorMsg
                            ? 'lead-phone-hint lead-form-error'
                            : 'lead-phone-hint'
                        }
                        aria-invalid={Boolean(
                          errorMsg &&
                            (phone.replace(/\D/g, '').length < 10 ||
                              phone.replace(/\D/g, '').length > 11)
                        )}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(31) 99999-9999"
                        className="mt-1.5 w-full rounded-md border border-white/15 bg-[#080A0C] px-3.5 py-3 text-sm text-white placeholder:text-[#6B7280] tabular-nums focus:border-[#149CEA] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        id="lead-goal-label"
                        htmlFor="lead-goal"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]"
                      >
                        Objetivo Principal
                      </label>
                      <span id="lead-goal-hint" className="sr-only">
                        Escolha seu foco principal entre emagrecimento, definição,
                        hipertrofia ou condicionamento físico.
                      </span>
                      <select
                        id="lead-goal"
                        name="goal"
                        aria-labelledby="lead-goal-label"
                        aria-describedby="lead-goal-hint"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-white/15 bg-[#080A0C] px-3.5 py-3 text-sm text-white focus:border-[#149CEA] focus:outline-none"
                      >
                        {TRIAL_GOALS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {errorMsg && (
                      <p
                        id="lead-form-error"
                        role="alert"
                        className="rounded-md border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-200"
                      >
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      aria-labelledby="lead-submit-label"
                      aria-describedby="contact-form-heading contact-form-desc lead-form-footer-note"
                      className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all duration-150 hover:bg-[#149CEA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <span id="lead-submit-label">
                        Agendar 2 Dias Experimentais
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  </form>
                )}
              </div>

              <div
                id="lead-form-footer-note"
                className="mt-6 border-t border-white/10 pt-5 text-xs text-[#9AA3AF]"
              >
                Atendimento personalizado para iniciantes e avançados · Sem
                planos engessados, conheça o box primeiro.
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
