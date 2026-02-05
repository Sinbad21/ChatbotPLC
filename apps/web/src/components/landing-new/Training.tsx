'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Zap } from 'lucide-react';

const steps = [
  {
    id: "01",
    title: "Carica i tuoi documenti",
    desc: "PDF, Word, Excel. I manuali che hai già. Nessuna riscrittura, nessun formato speciale.",
    icon: <FileText />
  },
  {
    id: "02",
    title: "Il sistema li indicizza",
    desc: "In ore, non settimane. Ogni risposta include il riferimento al documento originale.",
    icon: <Database />
  },
  {
    id: "03",
    title: "Gli utenti fanno domande",
    desc: "In linguaggio naturale. Via web, widget, WhatsApp. Risposte in secondi, 24/7.",
    icon: <Zap />
  }
];

export const Training: React.FC = () => {
  return (
    <section id="come-funziona" className="py-24 bg-platinum-950 relative overflow-hidden border-t border-platinum-900">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Come funziona
          </h2>
          <p className="text-platinum-500 max-w-2xl mx-auto">
            Nessun progetto IT. Nessuna integrazione complessa. Tre passaggi e sei operativo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="group relative p-6 bg-platinum-900 border border-platinum-800 rounded-lg hover:border-platinum-600 transition-colors duration-150"
            >
              <div className="absolute -right-4 -bottom-8 text-9xl font-serif font-bold text-platinum-800/20 select-none z-0">
                {step.id}
              </div>

              <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-platinum-950 border border-platinum-700 flex items-center justify-center text-platinum-200 mb-6">
                  {step.icon}
                </div>

                <h3 className="text-lg font-serif font-bold text-platinum-100 mb-3">
                  {step.title}
                </h3>

                <p className="text-sm text-platinum-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
