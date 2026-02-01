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
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative group"
          >
            <div className="aspect-square overflow-hidden rounded-sm relative z-10 bg-platinum-900 border border-platinum-800">
               <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2070&auto=format&fit=crop"
                alt="AI Robot Intelligence"
                className="w-full h-full object-cover opacity-80 grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-platinum-950 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 bg-platinum-950/90 backdrop-blur-md border border-platinum-700 p-4 rounded-sm transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                  <p className="text-xs font-mono text-platinum-300 uppercase tracking-widest">Neural Core: Online</p>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -left-4 w-full h-full border border-platinum-800 z-0 group-hover:-top-6 group-hover:-left-6 transition-all duration-500" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-platinum-700 to-transparent opacity-20 z-0 blur-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-platinum-500 uppercase tracking-[0.2em] text-xs font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-platinum-500"></span>
              La Nuova Era
            </h3>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
              Oltre la semplice <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-platinum-300 to-platinum-600">Automazione</span>
            </h2>
            <p className="text-platinum-400 mb-6 leading-relaxed">
              Creiamo entità digitali capaci di comprendere, imparare ed interagire. I nostri chatbot non sono semplici script, ma estensioni eleganti del tuo brand, attivi 24 ore su 24.
            </p>
            <p className="text-platinum-400 mb-8 leading-relaxed">
              Ogni interazione è calibrata per essere fluida come il mercurio e solida come il platino. Dalla gestione dei lead al supporto clienti, l&apos;AI lavora in background per far risplendere il tuo business.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: <Network size={20} />, text: "Reti Neurali Avanzate" },
                { icon: <Cpu size={20} />, text: "Elaborazione Real-Time" },
                { icon: <Lock size={20} />, text: "Privacy Blindata" }
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
