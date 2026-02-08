'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Factory, Clock, TrendingDown, Users, CheckCircle } from 'lucide-react';

export const CasoUso: React.FC = () => {
  return (
    <section id="caso-uso" className="py-24 bg-platinum-950 relative overflow-hidden border-t border-platinum-900">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-platinum-500 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center justify-center gap-2">
              <span className="w-8 h-[1px] bg-platinum-500"></span>
              Scenario Tipo
              <span className="w-8 h-[1px] bg-platinum-500"></span>
            </h3>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
              Software house PLC, <br/>
              <span className="text-emerald-400">15–20 sviluppatori, 150+ clienti attivi</span>
            </h2>
            <p className="text-platinum-600 text-xs max-w-xl mx-auto">
              Scenario anonimizzato basato su benchmark interni. I risultati possono variare in base al contesto operativo.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Situazione Prima */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-platinum-900 border border-platinum-800 rounded-lg p-8"
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
            className="bg-platinum-900 border border-emerald-800/50 rounded-lg p-8"
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
          <div className="bg-platinum-900 border border-platinum-800 rounded-lg p-8">
            <h3 className="text-center text-platinum-500 uppercase tracking-widest text-xs mb-8">Risultati tipici osservati</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">fino a -70%</span>
                </div>
                <div className="text-platinum-500 text-sm">Ticket al supporto</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">~35h</span>
                </div>
                <div className="text-platinum-500 text-sm">Risparmiate / settimana*</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">fino a -75%</span>
                </div>
                <div className="text-platinum-500 text-sm">Tempo onboarding dev</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Factory className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold text-white">3 mesi</span>
                </div>
                <div className="text-platinum-500 text-sm">Payback tipico</div>
              </div>
            </div>
            <p className="text-platinum-600 text-xs mt-6 text-center">* Valori indicativi basati su scenari comparabili. I risultati effettivi dipendono dal volume documentale e dall&apos;organizzazione.</p>
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
