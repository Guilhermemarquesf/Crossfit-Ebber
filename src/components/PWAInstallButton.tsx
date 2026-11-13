import { useId, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  onInstalled?: () => void;
}

/**
 * Botão de instalação do atalho PWA na tela inicial do celular.
 * Oculta-se automaticamente quando o site já está rodando como app instalado (standalone).
 */
export function PWAInstallButton({
  variant = 'full',
  onInstalled,
}: PWAInstallButtonProps) {
  const uid = useId();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const accepted = await install();
    if (accepted && onInstalled) {
      onInstalled();
    }
  };

  if (isInstallable) {
    const labelId = `${uid}-install-label`;
    const descId = `${uid}-install-desc`;
    return (
      <>
        <span id={descId} className="sr-only">
          Instala o atalho do site da Crossfit Ebber na tela inicial do seu
          celular para abrir com um toque.
        </span>
        <button
          type="button"
          onClick={handleInstallClick}
          aria-labelledby={labelId}
          aria-describedby={descId}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-[#149CEA]/60 bg-[#149CEA]/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#0C7EC8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
            variant === 'full' ? 'w-full' : ''
          }`}
        >
          <Download
            className="h-4 w-4 shrink-0 text-[#29A8F5]"
            aria-hidden="true"
          />
          <span id={labelId}>Instalar App no Celular</span>
        </button>
      </>
    );
  }

  if (isIOS) {
    const iosLabelId = `${uid}-ios-label`;
    const iosDescId = `${uid}-ios-desc`;
    return (
      <>
        <span id={iosDescId} className="sr-only">
          Abre passo a passo para adicionar o atalho da Crossfit Ebber à tela
          inicial no Safari do iPhone ou iPad.
        </span>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-labelledby={iosLabelId}
          aria-describedby={iosDescId}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-white/20 bg-[#101418] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-[#149CEA] hover:text-[#29A8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA] ${
            variant === 'full' ? 'w-full' : ''
          }`}
        >
          <Smartphone
            className="h-4 w-4 shrink-0 text-[#29A8F5]"
            aria-hidden="true"
          />
          <span id={iosLabelId}>Adicionar à Tela Inicial (iPhone)</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-white/15 bg-[#101419] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#29A8F5]">
                    Atalho no iPhone / iPad
                  </p>
                  <h3
                    id="ios-pwa-title"
                    className="mt-1 font-display text-2xl font-bold uppercase text-white"
                  >
                    Instalar Crossfit Ebber
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Fechar instruções"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-[#080A0C] text-white hover:border-[#149CEA]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#D1D5DB]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#29A8F5]">
                    01.
                  </span>
                  <span>
                    Toque no botão{' '}
                    <strong className="inline-flex items-center gap-1 text-white">
                      Compartilhar <Share className="h-3.5 w-3.5 text-[#29A8F5]" aria-hidden="true" />
                    </strong>{' '}
                    na barra do Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#29A8F5]">
                    02.
                  </span>
                  <span>
                    Role para baixo e toque em{' '}
                    <strong className="text-white">
                      Adicionar à Tela de Início
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-xs font-bold text-[#29A8F5]">
                    03.
                  </span>
                  <span>
                    Confirme em <strong className="text-white">Adicionar</strong>{' '}
                    para abrir o box com um toque.
                  </span>
                </li>
              </ol>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#0C7EC8] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#149CEA]"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
