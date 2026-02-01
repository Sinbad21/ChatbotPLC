import { Navbar } from '@/components/landing-new/Navbar';
import { Pricing } from '@/components/landing-new/Pricing';
import { Footer } from '@/components/landing-new/Footer';
import { LandingNewI18nProvider } from '@/components/landing-new/i18n';
import { AddOnsModulesSection } from '@/components/pricing/AddOnsModulesSection';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

export default function PricingPage() {
  return (
    <div className="relative min-h-screen font-sans selection:bg-platinum-400 selection:text-platinum-900 bg-platinum-950 overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-40 mix-blend-overlay" />

      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <LandingNewI18nProvider>
        <div className="relative z-10">
          <Navbar />

          <main className="pt-28 pb-20">
            <div className="container mx-auto px-4 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-platinum-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alla home
            </Link>

            <div className="mt-10">
              <Suspense fallback={null}>
                <Pricing />
              </Suspense>
            </div>

            <AddOnsModulesSection />

            <div className="mt-20 text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif text-white mb-4">Hai bisogno di un piano custom?</h3>
              <p className="text-platinum-500 mb-6">
                Offriamo piani enterprise su misura con supporto dedicato, SLA e sconti volume. Contattaci per definire
                la soluzione migliore.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 rounded-sm text-xs font-bold uppercase tracking-widest bg-platinum-100 text-black hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all duration-300 active:scale-95"
              >
                Contatta Sales
              </Link>
            </div>

            <div className="mt-20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-serif text-white mb-10 text-center">Billing FAQ</h3>
              <div className="space-y-6 text-sm">
                <div className="rounded-2xl border border-platinum-800 bg-platinum-900/20 p-6">
                  <h4 className="font-semibold text-white mb-2">Come viene calcolato l'uso?</h4>
                  <p className="text-platinum-500">
                    Ogni messaggio (input utente + risposta bot) conta come un messaggio. Anche le chiamate API
                    contribuiscono al limite mensile.
                  </p>
                </div>

                <div className="rounded-2xl border border-platinum-800 bg-platinum-900/20 p-6">
                  <h4 className="font-semibold text-white mb-2">Posso cancellare quando voglio?</h4>
                  <p className="text-platinum-500">
                    Sì, puoi annullare in qualsiasi momento dalle impostazioni. L'accesso resta attivo fino a fine periodo
                    di fatturazione.
                  </p>
                </div>

                <div className="rounded-2xl border border-platinum-800 bg-platinum-900/20 p-6">
                  <h4 className="font-semibold text-white mb-2">Quali metodi di pagamento accettate?</h4>
                  <p className="text-platinum-500">
                    Carte principali (Visa, Mastercard, Amex) e PayPal. Per enterprise offriamo anche fatturazione e bonifico.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center text-sm text-platinum-600">
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Termini di Servizio
              </Link>
              {' • '}
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
            </div>
          </main>

          <Footer />
        </div>
      </LandingNewI18nProvider>
    </div>
  );
}
