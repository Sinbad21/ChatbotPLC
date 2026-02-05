'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Send, Globe, MessageCircle, Smartphone, MessageSquare, Code } from 'lucide-react';

const integrations = [
  { name: "WhatsApp", icon: <MessageCircle size={24} /> },
  { name: "Telegram", icon: <Send size={24} /> },
  { name: "Web Integration", icon: <Globe size={24} /> },
  { name: "Messenger", icon: <MessageSquare size={24} /> },
  { name: "Mobile App", icon: <Smartphone size={24} /> },
  { name: "API Connect", icon: <Code size={24} /> },
  { name: "WhatsApp", icon: <MessageCircle size={24} /> },
  { name: "Telegram", icon: <Send size={24} /> },
  { name: "Web Integration", icon: <Globe size={24} /> },
  { name: "Messenger", icon: <MessageSquare size={24} /> },
  { name: "Mobile App", icon: <Smartphone size={24} /> },
  { name: "API Connect", icon: <Code size={24} /> },
];

export const Integrations: React.FC = () => {
  return (
    <section className="py-10 bg-platinum-950 border-y border-platinum-900 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-platinum-950 via-transparent to-platinum-950 z-10 pointer-events-none" />

      <div className="flex relative z-0">
        <motion.div
          className="flex gap-16 items-center whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {integrations.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-150 cursor-default group">
              <div className="p-3 rounded-lg bg-platinum-900 border border-platinum-800 text-platinum-400 group-hover:text-platinum-200 group-hover:border-platinum-600 transition-colors duration-150">
                {item.icon}
              </div>
              <span className="text-lg font-serif text-platinum-300 tracking-wider uppercase">{item.name}</span>
            </div>
          ))})
        </motion.div>
      </div>
    </section>
  );
};
