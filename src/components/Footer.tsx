import { Clock, Instagram, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { BUSINESS_INFO, buildWhatsAppUrl } from '../data/boxData';
import { ResilientImage } from './ResilientImage';
import { PWAInstallButton } from './PWAInstallButton';
import { ScrollReveal } from './ScrollReveal';

const FOOTER_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'O Box', href: '#o-box' },
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Dúvidas & Horários', href: '#duvidas' },
  { label: 'Localização', href: '#localizacao' },
  { label: 'Contato', href: '#contato' },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#060709] pt-12 pb-24 text-[#A1AAB5] sm:pb-12">
      <ScrollReveal className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-10 md:grid-cols-12">
          {/* Brand & Local SEO Context */}
          <div className="md:col-span-5">
            <a href="#inicio" className="inline-block">
              <ResilientImage
                src={BUSINESS_INFO.assets.logoBanner}
                alt="Crossfit Ebber Atividades Físicas - CrossFit no Petrolândia e Betim"
                className="h-11 w-auto rounded border border-white/15 object-contain"
                fallbackTitle="CROSSFIT EBBER"
              />
            </a>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#B4BCC6]">
              Box de <strong className="font-semibold text-white">CrossFit no Petrolândia</strong> e{' '}
              <strong className="font-semibold text-white">treino funcional em Contagem e divisa com Betim</strong>.
              Especialidade em emagrecimento, definição muscular, hipertrofia e
              condicionamento físico para iniciantes e avançados.
            </p>

            <div className="mt-3 flex items-start gap-2 text-xs text-[#9AA3AF]">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-[#29A8F5]"
                aria-hidden="true"
              />
              <span>
                {BUSINESS_INFO.addressStreet} ({BUSINESS_INFO.addressReference}) ·{' '}
                {BUSINESS_INFO.addressNeighborhood} · {BUSINESS_INFO.addressCoverage}.
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-[#29A8F5]">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="tabular-nums">
                Funcionamento: {BUSINESS_INFO.openingDays}
              </span>
            </div>

            <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-white">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-[#29A8F5]"
                aria-hidden="true"
              />
              <span>
                2 Dias de Aula Experimental Gratuita · Do Iniciante ao Avançado
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Navegação Rápida
            </h4>
            <nav
              aria-label="Links do rodapé"
              className="mt-3 grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm"
            >
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-[#29A8F5]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9AA3AF]">
                Região Atendida
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#9AA3AF]">
                CrossFit no Bairro Petrolândia (Contagem/MG), Industrial São
                Luiz, Sapucaias e bairros de divisa com Betim.
              </p>
            </div>
          </div>

          {/* Social & Direct Contact */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              Canais Oficiais
            </h4>
            <div className="mt-3 flex flex-col gap-2.5 text-sm">
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-2 text-[#E5E7EB] transition-colors hover:text-[#29A8F5]"
              >
                <Phone className="h-4 w-4 text-[#29A8F5]" aria-hidden="true" />
                <span className="tabular-nums">
                  {BUSINESS_INFO.whatsappDisplay}
                </span>
              </a>
              <a
                href={BUSINESS_INFO.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center gap-2 text-[#E5E7EB] transition-colors hover:text-[#29A8F5]"
              >
                <Instagram
                  className="h-4 w-4 text-white"
                  aria-hidden="true"
                />
                <span>{BUSINESS_INFO.instagramHandle}</span>
              </a>
              <div className="pt-2">
                <PWAInstallButton variant="full" />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Direitos Autorais */}
        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-[#9AA3AF] sm:flex-row sm:items-center">
          <p>
            © {currentYear}{' '}
            <strong className="font-semibold text-white">
              {BUSINESS_INFO.brandName}
            </strong>{' '}
            ({BUSINESS_INFO.legalName}). Todos os direitos reservados.
          </p>
          <p className="text-[#8B949E]">
            CrossFit &amp; Treino Funcional · Petrolândia, Contagem e Betim/MG ·{' '}
            {BUSINESS_INFO.openingHours}
          </p>
        </div>
      </ScrollReveal>
    </footer>
  );
}
