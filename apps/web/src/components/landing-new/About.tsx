'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Network, Cpu, Lock } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <section id="chi-siamo" className="py-24 bg-platinum-950 relative">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden rounded-sm relative z-10 bg-platinum-900 border border-platinum-800">
               <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
                alt="Documentazione tecnica industriale"
                className="w-full h-full object-cover opacity-80 grayscale-[0.3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-platinum-950 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 bg-platinum-950 border border-platinum-700 p-4 rounded-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <p className="text-xs font-mono text-platinum-300 uppercase tracking-widest">Documentazione: Indicizzata</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-platinum-500 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-platinum-500"></span>
              Il Problema
            </h3>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
              La documentazione esiste. <br/>
              <span className="text-platinum-400">Nessuno la usa.</span>
            </h2>
            <p className="text-platinum-400 mb-6 leading-relaxed">
              Manuali, schede tecniche, procedure. Tutto archiviato, niente consultato. Il supporto risponde alle stesse domande. I tecnici chiamano invece di cercare.
            </p>
            <p className="text-platinum-400 mb-8 leading-relaxed">
              Ogni interruzione costa 45 minuti. Ogni ticket ripetuto costa €15-30. Ogni nuovo assunto impiega settimane a orientarsi. È un costo invisibile, ma reale.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: <Network size={20} />, text: "70% dei ticket risolvibili da documentazione" },
                { icon: <Cpu size={20} />, text: "15+ interruzioni al giorno per l'ufficio tecnico" },
                { icon: <Lock size={20} />, text: "3 settimane per rendere operativo un nuovo assunto" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 border-b border-platinum-900 hover:border-platinum-700 transition-colors group cursor-default">
                  <span className="text-platinum-600 group-hover:text-platinum-200 transition-colors">{item.icon}</span>
                  <span className="text-platinum-300 font-light tracking-wide">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
