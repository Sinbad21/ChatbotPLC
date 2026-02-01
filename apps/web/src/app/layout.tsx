import './globals.css';
import type { Metadata } from 'next';
import { LenisProvider } from '@/lib/lenis-provider';
import { CookieConsentBanner } from '@/components/legal/CookieConsentBanner';
import { ConsentScriptInjector } from '@/components/legal/ConsentScriptInjector';
export const metadata: Metadata = {
  title: 'Omnical Studio - AI Chatbot Platform',
  description: 'Build and deploy AI-powered chatbots in minutes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased smooth-scroll">
        <LenisProvider>
          {children}
          <ConsentScriptInjector />
          <CookieConsentBanner />
        </LenisProvider>
      </body>
    </html>
  );
}

