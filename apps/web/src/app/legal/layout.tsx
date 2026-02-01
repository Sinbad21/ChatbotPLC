'use client';

import type { ReactNode } from 'react';
import { Navbar } from '@/components/landing-new/Navbar';
import { Footer } from '@/components/landing-new/Footer';
import { LandingNewI18nProvider } from '@/components/landing-new/i18n';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <LandingNewI18nProvider>
      <div className="relative min-h-screen font-sans selection:bg-platinum-400 selection:text-platinum-900 bg-platinum-950 overflow-x-hidden">
        <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10">
          <Navbar />
          <main className="pt-28 pb-20 px-4">{children}</main>
          <Footer />
        </div>
      </div>
    </LandingNewI18nProvider>
  );
}
