'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, PlayCircle } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto text-center max-w-5xl relative z-10">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-8"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          New: Enterprise Neural Engine v2.0
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]"
        >
          Enterprise AI Agents, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">Built for Scale.</span>
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Deploy autonomous AI agents that integrate seamlessly with your existing infrastructure. Automate support, sales, and operations with human-like precision.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
        >
          <Link href="/auth/register">
            <Button className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
              Start Free Trial <ArrowRight size={18} />
            </Button>
          </Link>
          <button className="px-8 py-3.5 text-slate-300 hover:text-white font-medium flex items-center gap-2 transition-colors">
            <PlayCircle size={18} /> Watch Demo
          </button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-10 bg-slate-800 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600/50" />
              <div className="w-3 h-3 rounded-full bg-slate-600/50" />
              <div className="w-3 h-3 rounded-full bg-slate-600/50" />
            </div>
            <div className="ml-auto w-48 h-2 bg-white/5 rounded-full" />
          </div>

          <div className="pt-10 pb-0 px-4 md:px-10">
            {/* Mock Dashboard Content */}
            <div className="grid grid-cols-12 gap-6 text-left">
               <div className="col-span-3 hidden md:block space-y-4">
                  <div className="h-4 w-24 bg-white/10 rounded mb-6" />
                  <div className="h-8 w-full bg-white/5 rounded" />
                  <div className="h-8 w-full bg-transparent rounded" />
                  <div className="h-8 w-full bg-transparent rounded" />
                  <div className="h-8 w-full bg-transparent rounded" />
               </div>
               <div className="col-span-12 md:col-span-9">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="h-8 w-64 bg-white/10 rounded mb-2" />
                      <div className="h-4 w-40 bg-white/5 rounded" />
                    </div>
                    <div className="h-10 w-32 bg-indigo-600 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="h-32 bg-slate-800 border border-white/5 rounded-lg" />
                    <div className="h-32 bg-slate-800 border border-white/5 rounded-lg" />
                    <div className="h-32 bg-slate-800 border border-white/5 rounded-lg" />
                  </div>
                  <div className="h-64 bg-slate-800 border border-white/5 rounded-lg w-full" />
               </div>
            </div>
          </div>

          {/* Fade Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900 to-transparent" />
        </motion.div>

        {/* Social Proof - Real Metrics */}
        <div className="mt-20 pt-10 border-t border-white/5">
           <p className="text-sm text-slate-500 mb-8">RISULTATI CONCRETI</p>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">500+</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Aziende Attive</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">10K+</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Conversazioni/Giorno</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">98%</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Soddisfazione</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">&lt;1s</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide">Tempo Risposta</div>
              </div>
           </div>
        </div>

      </div>
    </section>
  );
}
