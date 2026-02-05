'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, TrendingUp, Headphones } from 'lucide-react';

const personas = [
  {
    role: "Service Manager",
    prompt: "Riduce i ticket di primo livello del 70%. I clienti trovano le risposte sui manuali senza aprire richieste.",
    icon: <Headphones />,
    image: {
      src: "/landing-new/personas/customer-success.png",
      fallback: "/landing-new/personas/customer-success.svg",
    },
    color: "from-purple-400 to-purple-600"
  },
  {
    role: "Responsabile Ufficio Tecnico",
    prompt: "I tecnici sul campo consultano il sistema invece di chiamare. Le interruzioni calano dell'80%.",
    icon: <Home />,
    image: {
      src: "/landing-new/personas/real-estate.png",
      fallback: "/landing-new/personas/real-estate.svg",
    },
    color: "from-emerald-400 to-emerald-600"
  },
  {
    role: "HR / Operations Manager",
    prompt: "Nuovi assunti operativi in giorni, non settimane. La documentazione diventa strumento di formazione continua.",
    icon: <TrendingUp />,
    image: {
      src: "/landing-new/personas/salesman.png",
      fallback: "/landing-new/personas/salesman.svg",
    },
    color: "from-blue-400 to-blue-600"
  }
];

const PersonaCard: React.FC<{ persona: typeof personas[0], index: number }> = ({ persona, index }) => {
  const [imageSrc, setImageSrc] = useState(persona.image.src);

  useEffect(() => {
    setImageSrc(persona.image.src);
  }, [persona.image.src]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className="group relative"
    >
      <div className="relative h-[420px] sm:h-[500px] rounded-lg overflow-hidden border border-platinum-800 bg-platinum-900 hover:border-platinum-600 transition-colors duration-150">

        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imageSrc}
            alt={persona.role}
            className="w-full h-full object-cover opacity-70"
            loading="lazy"
            decoding="async"
            onError={() => {
              if (imageSrc !== persona.image.fallback) {
                setImageSrc(persona.image.fallback);
              }
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-platinum-950 via-platinum-950/50 to-transparent z-10" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-platinum-800 text-white border border-platinum-700">
              {persona.icon}
            </div>
            <h3 className="text-2xl font-serif text-white">{persona.role}</h3>
          </div>

          <div className="bg-platinum-900 border border-platinum-800 rounded-lg p-4">
            <p className="font-mono text-xs text-platinum-300 leading-relaxed">
              &quot;{persona.prompt}&quot;
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const Personas: React.FC = () => {
  return (
    <section className="py-20 md:py-32 bg-platinum-950 relative border-t border-platinum-900">

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-14 md:mb-20">
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Chi lo usa in azienda
          </h2>
          <p className="text-platinum-400 max-w-2xl mx-auto">
            Tre scenari tipici. Stesso obiettivo: meno tempo perso, più autonomia operativa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {personas.map((persona, index) => (
            <PersonaCard key={index} persona={persona} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
