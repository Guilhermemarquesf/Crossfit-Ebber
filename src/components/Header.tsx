import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BUSINESS_INFO, buildWhatsAppUrl } from '../data/boxData';
import { PWAInstallButton } from './PWAInstallButton';

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'O Box', href: '#o-box' },
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Contato', href: '#contato' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080A0C]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-6 lg:h-16 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          id="brand-wordmark"
          href="#inicio"
          className="font-display text-2xl font-extrabold uppercase tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#149CEA]"
        >
          CROSSFIT <span className="text-[#149CEA]">EBBER</span>
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#B4BCC6]"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#149CEA] after:transition-all after:duration-200 hover:after:w-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#149CEA]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <span id="header-cta-desc" className="sr-only">
            Atendimento via WhatsApp para agendar seus 2 dias de aula
            experimental gratuita na Crossfit Ebber em Petrolândia, Contagem.
          </span>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-labelledby="header-cta-label"
            aria-describedby="brand-wordmark header-cta-desc"
            className="hidden sm:inline-flex items-center justify-center rounded-md bg-[#0C7EC8] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#149CEA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span id="header-cta-label">2 Dias de Aula Experimental</span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-[#12161B] text-white transition-colors hover:border-[#149CEA] lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          className="border-t border-white/10 bg-[#0D1014] px-4 py-4 lg:hidden"
        >
          <nav aria-label="Menu mobile" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-[44px] items-center rounded-md px-3 text-base font-medium text-[#D1D5DB] transition-colors hover:bg-white/5 hover:text-[#149CEA]"
              >
                {link.label}
              </a>
            ))}
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              aria-labelledby="mobile-header-cta-label"
              aria-describedby="mobile-header-address-note"
              className="mt-3 flex min-h-[44px] items-center justify-center rounded-md bg-[#0C7EC8] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-[#149CEA]"
            >
              <span id="mobile-header-cta-label">
                Agendar 2 Dias de Aula Experimental
              </span>
            </a>
            <div className="mt-2">
              <PWAInstallButton
                variant="full"
                onInstalled={() => setMobileMenuOpen(false)}
              />
            </div>
            <p
              id="mobile-header-address-note"
              className="mt-3 px-3 text-xs text-[#9AA3AF]"
            >
              {BUSINESS_INFO.addressStreet} · {BUSINESS_INFO.openingHours}
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}
