import { useState } from 'react';
import { Check, Copy, MessageSquareText } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';

const GREETING_TEXT =
  'Olá! Que bom te ver por aqui 💪. Sou da equipe Crossfit Ebber. Vi que você passou pelo nosso site! Já pensou em treinar com a gente? Me diz qual horário fica melhor para você e vamos agendar seus 2 dias de aula experimental gratuita para você conhecer o box!';

export function WhatsAppGreetingSuggestion() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GREETING_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores móveis sem permissão direta de clipboard
      const textarea = document.createElement('textarea');
      textarea.value = GREETING_TEXT;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section
      aria-labelledby="whatsapp-greeting-heading"
      aria-describedby="whatsapp-greeting-tip"
      className="border-b border-white/10 bg-[#080A0C] py-12 lg:py-16"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="rounded-xl border border-white/12 bg-[#101419] p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#149CEA]/45 bg-[#149CEA]/15 text-[#29A8F5]">
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#29A8F5]">
                    Atendimento Rápido · WhatsApp Business
                  </p>
                  <h2
                    id="whatsapp-greeting-heading"
                    className="mt-1 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl"
                  >
                    Mensagem sugerida para receber novos alunos
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                aria-labelledby="whatsapp-greeting-copy-label"
                aria-describedby="whatsapp-greeting-heading whatsapp-greeting-body whatsapp-greeting-tip"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-[#0C7EC8] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-[#149CEA] active:scale-[0.98] sm:whitespace-nowrap sm:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span id="whatsapp-greeting-copy-label">
                      Mensagem Copiada
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span id="whatsapp-greeting-copy-label">
                      Copiar Mensagem
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-[#080A0C] p-4 sm:p-5">
              <p
                id="whatsapp-greeting-body"
                className="text-sm leading-relaxed text-[#E5E7EB] sm:text-base"
              >
                {GREETING_TEXT}
              </p>
            </div>

            <p id="whatsapp-greeting-tip" className="mt-3 text-xs text-[#9AA3AF]">
              Dica para o Coach Ebber: salve este texto nas{' '}
              <strong className="font-semibold text-white">
                Respostas Rápidas
              </strong>{' '}
              do WhatsApp Business para responder em segundos quem chegar pelo
              site ou pelo Instagram.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
