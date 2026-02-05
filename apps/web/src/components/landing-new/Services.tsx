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
    <section id="benefici" className="py-24 bg-platinum-950 relative overflow-hidden border-t border-platinum-900">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-20"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">Cosa cambia in azienda</h2>
          <div className="w-24 h-[1px] bg-platinum-700 mx-auto mb-6" />
          <p className="mt-6 text-platinum-400 max-w-2xl mx-auto">
            Numeri reali, non promesse. Ogni risultato è misurabile e verificabile.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="group p-8 bg-platinum-900 border border-platinum-800 rounded-lg hover:border-platinum-600 transition-colors duration-150"
            >
              <div className="mb-6 inline-block p-3 rounded-lg bg-platinum-950 border border-platinum-800 text-platinum-400 group-hover:text-platinum-200 transition-colors duration-150">
                {service.icon}
              </div>
              <h3 className="text-xl font-serif text-platinum-100 mb-3">{service.title}</h3>
              <p className="text-platinum-500 text-sm leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}}
        </div>
      </div>
    </section>
  );
};
