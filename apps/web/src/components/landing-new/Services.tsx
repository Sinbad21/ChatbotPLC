'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquareCode, BrainCircuit, Zap, Globe2 } from 'lucide-react';

const services = [
  {
    icon: <MessageSquareCode className="w-8 h-8" />,
    title: "Riduzione ticket L1: -70%",
    desc: "Le domande ripetitive vengono risolte automaticamente. Il supporto si occupa solo dei casi che richiedono competenza."
  },
  {
    icon: <BrainCircuit className="w-8 h-8" />,
    title: "Interruzioni: -80%",
    desc: "I tecnici consultano il sistema invece di chiamare l'ufficio. Chi lavora, lavora senza fermarsi."
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Onboarding: da 3 settimane a 3 giorni",
    desc: "I nuovi assunti trovano risposte dal primo giorno. Meno affiancamento, meno errori, meno tempo perso."
  },
  {
    icon: <Globe2 className="w-8 h-8" />,
    title: "Supporto 24/7 a costo zero",
    desc: "Clienti e collaboratori ottengono risposte fuori orario. Senza turni notturni, senza assunzioni."
  }
];

export const Services: React.FC = () => {
  return (
    <section id="benefici" className="py-24 bg-platinum-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 -left-64 w-96 h-96 bg-platinum-500/10 rounded-full blur-3xl animate-pulse" />
         <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-platinum-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s'}} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Cosa cambia in azienda</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-platinum-900 via-platinum-400 to-platinum-900 mx-auto rounded-full" />
          <p className="mt-6 text-platinum-400 max-w-2xl mx-auto">
            Numeri reali, non promesse. Ogni risultato è misurabile e verificabile.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative p-8 bg-platinum-900/40 backdrop-blur-sm border border-platinum-800 overflow-hidden rounded-sm transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out z-0" />

              <div className="absolute inset-0 border border-platinum-500/0 group-hover:border-platinum-500/30 transition-colors duration-500 rounded-sm z-10 pointer-events-none" />

              <div className="relative z-20">
                <div className="mb-6 inline-block p-3 rounded-full bg-platinum-950 border border-platinum-800 text-platinum-400 group-hover:text-white group-hover:border-platinum-500 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-300">
                  {service.icon}
                </div>
                <h3 className="text-xl font-serif text-platinum-100 mb-3 group-hover:text-white transition-colors">{service.title}</h3>
                <p className="text-platinum-500 text-sm leading-relaxed group-hover:text-platinum-300 transition-colors">
                  {service.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
