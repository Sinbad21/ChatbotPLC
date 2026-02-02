'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Zap } from 'lucide-react';

const steps = [
  {
    id: "01",
    title: "Carica la Documentazione",
    desc: "PDF, Word, Excel, testi. Il sistema accetta i formati che già usi. Non serve riscrivere nulla.",
    icon: <FileText />
  },
  {
    id: "02",
    title: "Il Sistema Indicizza",
    desc: "I contenuti vengono elaborati e resi interrogabili. Ogni risposta cita la fonte originale.",
    icon: <Database />
  },
  {
    id: "03",
    title: "Gli Utenti Interrogano",
    desc: "Via web, widget integrato, o canali come WhatsApp. Risposte immediate, 24/7, senza intervento umano.",
    icon: <Zap />
  }
];

export const Training: React.FC = () => {
  return (
    <section id="come-funziona" className="py-24 bg-platinum-950 relative overflow-hidden border-t border-platinum-900">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-platinum-400 to-transparent" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-platinum-400 to-transparent" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-platinum-400 to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl text-white mb-6"
          >
            Operativo in <span className="text-platinum-400 italic">3 Passaggi</span>
          </motion.h2>
          <p className="text-platinum-500 max-w-2xl mx-auto">
            Nessun setup complesso. Carica i documenti, il sistema li elabora, gli utenti trovano le risposte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative p-6 bg-platinum-900/30 backdrop-blur-sm border border-platinum-800 rounded-xl hover:bg-platinum-900/60 transition-all duration-500 hover:border-platinum-500 overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-8 text-9xl font-serif font-bold text-platinum-800/20 group-hover:text-platinum-700/30 transition-colors select-none z-0">
                {step.id}
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-platinum-950 border border-platinum-700 flex items-center justify-center text-platinum-200 mb-6 shadow-lg group-hover:text-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all">
                  {step.icon}
                </div>

                <h3 className="text-lg font-serif font-bold text-platinum-100 mb-3 group-hover:text-white transition-colors">
                  {step.title}
                </h3>

                <p className="text-sm text-platinum-500 leading-relaxed group-hover:text-platinum-300 transition-colors">
                  {step.desc}
                </p>
              </div>

              <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-platinum-200 group-hover:w-full transition-all duration-700 ease-out" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
