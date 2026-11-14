import { useState } from 'react';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BUSINESS_INFO, buildWhatsAppUrl } from '../data/boxData';
import { PWAInstallButton } from './PWAInstallButton';

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'O Box', href: '#o-box' },
  { label: 'WOD & PRs', href: '#wod-ranking' },
  { label: 'Metodologia', href: '#metodologia' },
  { label: 'Contato', href: '#contato' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userProfile, authBusy, authError, signInWithGoogle, logout, clearAuthError } =
    useAuth();

  const displayName = userProfile?.name || user?.displayName || 'Atleta';
  const firstName = displayName.trim().split(/\s+/)[0] || 'Atleta';
  const avatarUrl = userProfile?.photoURL || user?.photoURL || '';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080A0C]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-16 lg:gap-6 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          id="brand-wordmark"
          href="#inicio"
          className="font-display text-xl font-extrabold uppercase tracking-tight text-white whitespace-nowrap shrink-0 xl:text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#149CEA]"
        >
          CROSSFIT <span className="text-[#149CEA]">EBBER</span>
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-medium text-[#B4BCC6]"
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

        {/* Zone 3: Google Auth + Primary CTA + Mobile Menu Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-white/15 bg-[#12161B] py-1 pr-1.5 pl-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#149CEA]/20 text-xs font-bold text-[#29A8F5]">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-[90px] truncate text-xs font-semibold text-white">
                {firstName}
              </span>
              {userProfile?.role === 'coach' && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#29A8F5]">
                  Coach
                </span>
              )}
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void logout()}
                aria-label={`Sair da conta de ${displayName}`}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#B4BCC6] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void signInWithGoogle()}
              aria-label="Entrar com conta Google"
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-md border border-white/20 bg-[#12161B] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white whitespace-nowrap shrink-0 transition-colors hover:border-[#149CEA] hover:bg-[#182029] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
            >
              <LogIn className="h-3.5 w-3.5 text-[#29A8F5]" aria-hidden="true" />
              <span>{authBusy ? 'Entrando...' : 'Entrar'}</span>
            </button>
          )}

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
            className="hidden md:inline-flex items-center justify-center rounded-md bg-[#0C7EC8] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white whitespace-nowrap shrink-0 transition-colors duration-150 hover:bg-[#149CEA] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span id="header-cta-label">
              <span className="xl:hidden">Aula Experimental</span>
              <span className="hidden xl:inline">
                2 Dias de Aula Experimental
              </span>
            </span>
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

      {/* Aviso discreto de erro de autenticação */}
      {authError && (
        <div
          role="alert"
          className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-200"
        >
          <span>{authError}</span>
          <button
            type="button"
            onClick={clearAuthError}
            className="ml-3 font-bold underline hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

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

            {/* Login/Logout Mobile */}
            <div className="mt-2 border-t border-white/10 pt-3">
              {user ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-white/15 bg-[#12161B] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`Foto de ${displayName}`}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#149CEA]/20 text-xs font-bold text-[#29A8F5]">
                        {firstName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>
                      <p className="text-[11px] uppercase tracking-wider text-[#29A8F5]">
                        {userProfile?.role === 'coach' ? 'Coach' : 'Aluno'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => {
                      void logout();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#D1D5DB] hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    void signInWithGoogle();
                    setMobileMenuOpen(false);
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-[#12161B] px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:border-[#149CEA]"
                >
                  <LogIn className="h-4 w-4 text-[#29A8F5]" aria-hidden="true" />
                  <span>
                    {authBusy ? 'Entrando...' : 'Entrar com Google'}
                  </span>
                </button>
              )}
            </div>

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
