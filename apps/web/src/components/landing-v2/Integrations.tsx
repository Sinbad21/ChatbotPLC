'use client';

import { motion } from 'framer-motion';
import { Send, Globe, MessageCircle, Smartphone, MessageSquare, Code } from 'lucide-react';

const integrations = [
  { name: "WhatsApp", icon: <MessageCircle size={24} /> },
  { name: "Telegram", icon: <Send size={24} /> },
  { name: "Web Integration", icon: <Globe size={24} /> },
  { name: "Messenger", icon: <MessageSquare size={24} /> },
  { name: "Mobile App", icon: <Smartphone size={24} /> },
  { name: "API Connect", icon: <Code size={24} /> },
  // Duplicates for seamless loop
  { name: "WhatsApp", icon: <MessageCircle size={24} /> },
  { name: "Telegram", icon: <Send size={24} /> },
  { name: "Web Integration", icon: <Globe size={24} /> },
  { name: "Messenger", icon: <MessageSquare size={24} /> },
  { name: "Mobile App", icon: <Smartphone size={24} /> },
  { name: "API Connect", icon: <Code size={24} /> },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-10 bg-slate-950 border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 z-10 pointer-events-none" />

      <div className="flex relative z-0">
        <motion.div
          className="flex gap-16 items-center whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
          {integrations.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-default group">
              <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-white group-hover:border-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                {item.icon}
              </div>
              <span className="text-lg font-medium text-slate-300 tracking-wide uppercase">{item.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
