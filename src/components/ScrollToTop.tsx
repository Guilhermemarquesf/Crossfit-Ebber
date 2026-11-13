import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Voltar ao topo da página"
      className="fixed right-4 bottom-18 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#101418]/95 text-white shadow-lg shadow-black/60 backdrop-blur-sm transition-all duration-150 hover:scale-[1.05] hover:border-[#149CEA] hover:text-[#29A8F5] active:scale-[0.98] sm:right-6 sm:bottom-21 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#149CEA]"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
