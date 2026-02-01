'use client';

import React, { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { LandingNewI18nProvider } from './i18n';
import { Integrations } from './Integrations';
import { Services } from './Services';
import { Personas } from './Personas';
import { Training } from './Training';
import { PricingV2 } from './PricingV2';
import { About } from './About';
import { Footer } from './Footer';

const LandingPage: React.FC = () => {
  useEffect(() => {
    const scrollToHash = () => {
      const raw = typeof window !== 'undefined' ? window.location.hash : '';
      const id = raw.startsWith('#') ? decodeURIComponent(raw.slice(1)) : '';
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <LandingNewI18nProvider>
      <div className="relative min-h-screen font-sans selection:bg-platinum-400 selection:text-platinum-900 bg-platinum-950 overflow-x-hidden">

      {/* Subtle grid background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Integrations />
          <About />
          <Personas />
          <Services />
          <Training />
          <PricingV2 />
        </main>
        <Footer />
      </div>

      </div>
    </LandingNewI18nProvider>
  );

};

export default LandingPage;
