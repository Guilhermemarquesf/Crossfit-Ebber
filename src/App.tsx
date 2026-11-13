/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { BoxStructureSection } from './components/BoxStructureSection';
import { MethodologySection } from './components/MethodologySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqScheduleSection } from './components/FaqScheduleSection';
import { LocationContactSection } from './components/LocationContactSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScrollToTop } from './components/ScrollToTop';
import { WhatsAppGreetingSuggestion } from './components/WhatsAppGreetingSuggestion';

export default function App() {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handler = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-[#080A0C] text-white">
        {gmpQuotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}
        <Header />
        <main>
          <HeroSection />
          <BoxStructureSection />
          <MethodologySection />
          <TestimonialsSection />
          <FaqScheduleSection />
          <LocationContactSection />
          <WhatsAppGreetingSuggestion />
        </main>
        <Footer />
        <ScrollToTop />
        <FloatingWhatsApp />
        <OfflineIndicator />
      </div>
    </MotionConfig>
  );
}
