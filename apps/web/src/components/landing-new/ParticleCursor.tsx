'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  velocity: { x: number; y: number };
}

export const ParticleCursor: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.3) return;

      const newParticle: Particle = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 4 + 1,
        velocity: {
          x: (Math.random() - 0.5) * 1,
          y: (Math.random() - 0.5) * 1
        }
      };

      setParticles((prev) => {
        const updated = [...prev, newParticle];
        if (updated.length > 25) return updated.slice(updated.length - 25);
        return updated;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 0.8,
              scale: 1,
              x: particle.x,
              y: particle.y
            }}
            animate={{
              opacity: 0,
              scale: 0,
              x: particle.x + particle.velocity.x * 50,
              y: particle.y + particle.velocity.y * 50
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute rounded-full bg-platinum-200 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{
              width: particle.size,
              height: particle.size,
              left: 0,
              top: 0,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
