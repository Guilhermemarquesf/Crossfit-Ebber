import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../data/boxData';

export function FloatingWhatsApp() {
  return (
    <>
      <span id="floating-wa-desc" className="sr-only">
        Abre conversa no WhatsApp (31) 98632-5827 com mensagem pronta para
        agendar seus 2 dias de aula experimental na Crossfit Ebber em Petrolândia.
      </span>
      <a
        href={buildWhatsAppUrl(
          'Olá! Quero falar com a equipe da Crossfit Ebber para agendar meus 2 dias de aula experimental.'
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-labelledby="floating-wa-label"
        aria-describedby="floating-wa-desc"
        className="fixed right-4 bottom-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-white/25 bg-[#0C7EC8] px-4 text-xs font-bold uppercase tracking-wide text-white shadow-lg shadow-black/60 transition-transform duration-150 hover:scale-[1.03] hover:bg-[#149CEA] active:scale-[0.98] sm:right-6 sm:bottom-6 sm:h-12 sm:px-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span id="floating-wa-label" className="whitespace-nowrap">
          WhatsApp
        </span>
      </a>
    </>
  );
}
