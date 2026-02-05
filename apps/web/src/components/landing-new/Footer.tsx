'use client';

import React from 'react';
import Link from 'next/link';
import { Diamond, Twitter, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-platinum-950 text-platinum-300 border-t border-platinum-800 pt-20 pb-8 relative overflow-hidden">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">

          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Diamond className="w-5 h-5 text-platinum-100" />
              <span className="text-xl font-serif font-bold text-white tracking-widest uppercase">
                OMNICAL STUDIO
              </span>
            </div>
            <p className="text-sm text-platinum-500 leading-relaxed mb-6">
              Supporto documentale automatico per aziende tecniche. <br/>
              Riduci ticket, interruzioni e tempi di formazione.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 rounded-sm bg-platinum-900 flex items-center justify-center text-platinum-400 hover:bg-platinum-800 hover:text-white transition-colors duration-150 border border-platinum-800">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-sm bg-platinum-900 flex items-center justify-center text-platinum-400 hover:bg-platinum-800 hover:text-white transition-colors duration-150 border border-platinum-800">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-platinum-600 rounded-full"></span>
              Esplora
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="text-platinum-500 hover:text-white hover:translate-x-1 transition-all inline-block">Home</Link></li>
              <li><Link href="/#come-funziona" className="text-platinum-500 hover:text-white hover:translate-x-1 transition-all inline-block">Come Funziona</Link></li>
              <li><Link href="/contact" className="text-platinum-500 hover:text-white hover:translate-x-1 transition-all inline-block">Richiedi Valutazione</Link></li>
              <li><Link href="/pricing" className="text-platinum-500 hover:text-white hover:translate-x-1 transition-all inline-block">Prezzi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-platinum-600 rounded-full"></span>
              Policy
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/legal/privacy" className="text-platinum-500 hover:text-white transition-colors">Privacy Data</Link></li>
              <li><Link href="/legal/terms" className="text-platinum-500 hover:text-white transition-colors">Termini di Servizio</Link></li>
              <li><Link href="/legal/cookies" className="text-platinum-500 hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/legal/gdpr" className="text-platinum-500 hover:text-white transition-colors">GDPR</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Richiedi una valutazione</h4>
            <p className="text-xs text-platinum-500 mb-4">Analisi gratuita della tua documentazione e stima del risparmio atteso.</p>
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email aziendale"
                  className="w-full bg-platinum-900/50 border border-platinum-800 text-white px-4 py-3 text-sm focus:outline-none focus:border-platinum-400 transition-colors rounded-sm"
                />
              </div>
              <button className="w-full bg-platinum-200 text-platinum-950 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors duration-150 rounded-sm">
                Richiedi valutazione
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-platinum-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-platinum-700">
            © {new Date().getFullYear()} OMNICAL STUDIO. Supporto tecnico automatico.
          </p>
        </div>
      </div>
    </footer>
  );
};

