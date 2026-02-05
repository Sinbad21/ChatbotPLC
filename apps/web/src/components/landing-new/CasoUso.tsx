'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Factory, Clock, TrendingDown, Users, CheckCircle } from 'lucide-react';

export const CasoUso: React.FC = () => {
  return (
    <section id="caso-uso" className="py-24 bg-platinum-950 relative overflow-hidden border-t border-platinum-900">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-platinum-500 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-platinum-500"></span>
              Caso Reale
              <span className="w-8 h-[1px] bg-platinum-500"></span>
            </h3>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
              Software house PLC, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">18 programmatori, 200+ clienti attivi</span>
            </h2>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Situazione Prima */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-platinum-900/30 border border-platinum-800 rounded-lg p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Prima</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                "Documentazione tecnica sparsa tra Wiki, PDF e note interne",
                "Supporto clienti interrotto 25+ volte al giorno per domande su configurazioni",
                "Tempo medio per rispondere a un ticket tecnico: 18 minuti",
                "Nuovi sviluppatori produttivi dopo 4-5 settimane",
                "Clienti bloccati in attesa di risposte su parametri e funzioni"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-platinum-400">
                  <span className="text-red-400 mt-1">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Situazione Dopo */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-emerald-900/20 to-platinum-900/30 border border-emerald-700/30 rounded-lg p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Dopo 90 giorni</h3>
            </div>
            
            <ul className="space-y-4">
              {[
                "Tutta la documentazione PLC indicizzata e interrogabile in linguaggio naturale",
                "Interruzioni ridotte a 5-6 al giorno (solo casi di sviluppo custom)",
                "Risposta media: 3.2 secondi con link al codice o manuale originale",
                "Nuovi sviluppatori autonomi dalla seconda settimana",
                "Clienti self-service 24/7 su parametri, errori e configurazioni"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-platinum-300">
                  <span className="text-emerald-400 mt-1">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Risultati Numerici */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-platinum-900/40 border border-platinum-800 rounded-lg p-8">
            <h3 className="text-center text-platinum-500 uppercase tracking-widest text-xs mb-8">Risultati documentati</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">-72%</span>
                </div>
                <div className="text-platinum-500 text-sm">Ticket al supporto</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">38h</span>
                </div>
                <div className="text-platinum-500 text-sm">Risparmiate / settimana</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">-75%</span>
                </div>
                <div className="text-platinum-500 text-sm">Tempo onboarding dev</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Factory className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">3 mesi</span>
                </div>
                <div className="text-platinum-500 text-sm">Payback raggiunto</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settori */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-platinum-600 text-sm mb-4">Applicabile a:</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-platinum-500">
            {[
              "Software house PLC/SCADA",
              "System integrator",
              "OEM macchinari",
              "Automazione industriale",
              "Building automation",
              "Assistenza tecnica",
              "Sviluppo firmware"
            ].map((sector, idx) => (
              <span key={idx} className="px-3 py-1 border border-platinum-800 rounded-full">
                {sector}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
