import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Listener global (Tier 1) para cota e falhas de autenticação do Google Maps Platform
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

// Renderização imediata da interface principal antes de registrar scripts em segundo plano
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Registro não-bloqueante do Service Worker PWA em produção (impede impacto no LCP/FCP e erros em dev sem HMR)
if (import.meta.env.PROD) {
  registerSW({
    immediate: false,
    onOfflineReady() {
      // Versão offline em cache pronta para abertura rápida como app instalado
    },
    onRegisterError() {
      // Silencia falha caso o ambiente bloqueie Service Workers em iframe
    },
  });
}
