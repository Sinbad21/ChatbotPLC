'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Home, TrendingUp, Headphones } from 'lucide-react';

const personas = [
  {
    role: "The Salesman",
    prompt: "Agisci come un venditore esperto. Usa tecniche di persuasione eleganti, sii assertivo ma cortese.",
    icon: <TrendingUp />,
    image: {
      src: "/landing-new/personas/salesman.png",
      fallback: "/landing-new/personas/salesman.svg",
    },
    color: "from-blue-400 to-blue-600"
  },
  {
    role: "Real Estate Agent",
    prompt: "Sei un agente immobiliare di lusso. Descrivi le proprietà con un linguaggio evocativo e dettagliato.",
    icon: <Home />,
    image: {
      src: "/landing-new/personas/real-estate.png",
      fallback: "/landing-new/personas/real-estate.svg",
    },
    color: "from-emerald-400 to-emerald-600"
  },
  {
    role: "Customer Success",
    prompt: "Sei un assistente empatico. Risolvi problemi tecnici mantenendo un tono calmo e rassicurante.",
    icon: <Headphones />,
    image: {
      src: "/landing-new/personas/customer-success.png",
      fallback: "/landing-new/personas/customer-success.svg",
    },
    color: "from-purple-400 to-purple-600"
  }
];

const PersonaCard: React.FC<{ persona: typeof personas[0], index: number }> = ({ persona, index }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSrc, setImageSrc] = useState(persona.image.src);

  useEffect(() => {
    setImageSrc(persona.image.src);
  }, [persona.image.src]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      className="group relative"
    >
      <div className="relative h-[420px] sm:h-[500px] rounded-xl overflow-hidden border border-platinum-800 bg-platinum-900 transition-all duration-500 group-hover:border-platinum-500/50 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]">

        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            style={{ y }}
            className="absolute -top-[10%] left-0 w-full h-[120%]"
          >
            <img
              src={imageSrc}
              alt={persona.role}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-95"
              loading="lazy"
              decoding="async"
              onError={() => {
                if (imageSrc !== persona.image.fallback) {
                  setImageSrc(persona.image.fallback);
                }
              }}
            />
          </motion.div>

          <div className="absolute inset-0 bg-gradient-to-t from-platinum-950 via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30 z-10 mix-blend-overlay pointer-events-none" />

          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0.02)_50%,rgba(255,255,255,0))] bg-[length:100%_4px] pointer-events-none opacity-20" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 z-30">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-full bg-gradient-to-br ${persona.color} bg-opacity-20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md border border-white/10`}>
              {persona.icon}
            </div>
            <h3 className="text-2xl font-serif text-white drop-shadow-lg">{persona.role}</h3>
          </div>

          <div className="bg-platinum-950/80 backdrop-blur-md border border-platinum-800 rounded-lg p-4 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-xl">
            <p className="font-mono text-xs text-platinum-300 leading-relaxed">
              <span className="text-emerald-400 font-bold">system: </span>
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
    <section className="py-20 md:py-32 bg-platinum-950 relative">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-14 md:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-6xl text-white mb-6"
          >
            I MILLE VOLTI <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-platinum-200 via-white to-platinum-400 animate-pulse">DELL&apos;INTELLIGENZA</span>
          </motion.h2>
          <p className="text-platinum-400 max-w-2xl mx-auto">
            Definisci il ruolo. I nostri androidi virtuali si adatteranno perfettamente al contesto.
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
