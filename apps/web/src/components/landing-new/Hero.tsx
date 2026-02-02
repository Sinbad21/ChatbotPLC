'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDown, Sparkles, Bot, Briefcase, Home, Headphones, RefreshCw,
  ChevronRight, ChevronLeft, BarChart3, Calendar, Users, Download, Filter,
  CheckCircle, Clock, PieChart
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'sales',
    persona: "Sales Specialist",
    color: "text-blue-400",
    bgGradient: "from-blue-500/20 to-transparent",
    icon: <Briefcase className="w-5 h-5" />,
    messages: [
      { text: "Vorrei aumentare i lead per la mia agenzia immobiliare.", sender: 'user' as const },
      { text: "Analisi completata. Per il settore Real Estate, consiglio un bot proattivo che pre-qualifica i clienti chiedendo budget e zona preferita.", sender: 'bot' as const },
      { text: "Sembra utile. PuÃ² fissare appuntamenti?", sender: 'user' as const },
      { text: "Certamente. Si integra con Google Calendar e prenota visite solo per lead qualificati sopra i 300kâ‚¬.", sender: 'bot' as const }
    ]
  },
  {
    id: 'realestate',
    persona: "Luxury Estate Agent",
    color: "text-emerald-400",
    bgGradient: "from-emerald-500/20 to-transparent",
    icon: <Home className="w-5 h-5" />,
    messages: [
      { text: "Cerco un attico in centro a Milano con terrazza.", sender: 'user' as const },
      { text: "Ho trovato 3 opzioni off-market in zona Brera. L'opzione A ha una terrazza di 40mq e vista Duomo. Desideri le planimetrie?", sender: 'bot' as const },
      { text: "SÃ¬, inviamele su WhatsApp.", sender: 'user' as const },
      { text: "Inviate ora. Ho incluso anche un video tour virtuale dell'interno. Vuoi che ti chiami un consulente?", sender: 'bot' as const }
    ]
  },
  {
    id: 'support',
    persona: "Tech Support AI",
    color: "text-purple-400",
    bgGradient: "from-purple-500/20 to-transparent",
    icon: <Headphones className="w-5 h-5" />,
    messages: [
      { text: "Il mio ordine #4092 Ã¨ in ritardo.", sender: 'user' as const },
      { text: "Controllo subito, Marco... Vedo che il pacco Ã¨ in transito a Bologna. La nuova consegna stimata Ã¨ domani entro le 14:00.", sender: 'bot' as const },
      { text: "Perfetto, grazie mille.", sender: 'user' as const },
      { text: "Di nulla! Ti ho appena inviato il link di tracking aggiornato via SMS. Serve altro?", sender: 'bot' as const }
    ]
  }
];

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

const BASE_PROMPTS: string[] = [
  'Come funziona con i miei PDF?',
  'Quanto tempo serve per iniziare?',
  'Posso provarlo con la mia documentazione?',
  'Funziona in italiano e inglese?',
];

const MAX_BOT_CHARS = 360;

function clampBotReply(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_BOT_CHARS) return normalized;
  return `${normalized.slice(0, MAX_BOT_CHARS).trimEnd()}…`;
}

const ChatSlide: React.FC = () => {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>(() => [
    {
      id: 1,
      text: 'Ciao! Prova a fare una domanda sulla documentazione tecnica.',
      sender: 'bot',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrollThumb, setScrollThumb] = useState<{ visible: boolean; top: number; height: number }>({
    visible: false,
    top: 0,
    height: 0,
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]); // Track messages for API calls
  const currentScenario = SCENARIOS[0];

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Keep messagesRef in sync with displayedMessages
  useEffect(() => {
    messagesRef.current = displayedMessages;
  }, [displayedMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight + 100,
        behavior: 'smooth'
      });
    }
  }, [displayedMessages, isTyping]);

  const updateScrollThumb = () => {
    const el = chatContainerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight > clientHeight + 1;
    if (!scrollable) {
      setScrollThumb((prev) => (prev.visible ? { visible: false, top: 0, height: 0 } : prev));
      return;
    }

    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 28);
    const maxThumbTop = Math.max(clientHeight - thumbHeight, 0);
    const maxScrollTop = Math.max(scrollHeight - clientHeight, 1);
    const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

    setScrollThumb({ visible: true, top: thumbTop, height: thumbHeight });
  };

  useEffect(() => {
    updateScrollThumb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedMessages, isTyping]);

  const sendMessage = async (messageOverride?: string) => {
    const userMessage = (messageOverride ?? inputValue).trim();
    if (!userMessage || isLoading) return;

    setInputValue('');

    const baseMessages = [...messagesRef.current];
    const userMsg: Message = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
    };

    const newMessages = [...baseMessages, userMsg];
    setDisplayedMessages(newMessages);

    // Build conversation history for API (include all previous messages)
    const conversationHistory = newMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Show typing indicator
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          scenario: currentScenario.id,
          conversationHistory: conversationHistory.slice(0, -1) // Don't include current user message twice
        }),
      });

      const data = await response.json();

      setIsTyping(false);
      setDisplayedMessages(prev => [...prev, {
        id: Date.now(),
        text: clampBotReply(data.message || 'Come posso aiutarti?'),
        sender: 'bot'
      }]);
    } catch {
      setIsTyping(false);
      setDisplayedMessages(prev => [...prev, {
        id: Date.now(),
        text: clampBotReply('Posso aiutarti a trovare informazioni nella tua documentazione tecnica. Cosa vorresti sapere?'),
        sender: 'bot'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-tr ${currentScenario.bgGradient} blur-3xl transition-colors duration-1000`} />

      <div className="flex items-center justify-between border-b border-platinum-800/50 p-6 bg-platinum-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-platinum-900 border border-platinum-700 flex items-center justify-center shadow-lg z-10 relative">
              <div className={`${currentScenario.color}`}>{currentScenario.icon}</div>
            </div>
            <div className={`absolute inset-0 rounded-full blur-md animate-pulse ${currentScenario.color} opacity-40`}></div>
          </div>
          <div>
            <h3 className={`font-serif font-medium text-sm ${currentScenario.color}`}>{currentScenario.persona}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-[pulse_2s_infinite]" />
              <span className="text-[10px] text-emerald-400/80 uppercase tracking-wide font-semibold">
                Prova Live
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setDisplayedMessages([
              {
                id: 1,
                text: 'Ciao! Prova a fare una domanda sulla documentazione tecnica.',
                sender: 'bot',
              },
            ]);
            setInputValue('');
            setIsTyping(false);
            setIsLoading(false);
            inputRef.current?.focus();
          }}
          className="inline-flex items-center gap-1.5 text-[10px] text-platinum-500 hover:text-platinum-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div
        ref={chatContainerRef}
        onScroll={updateScrollThumb}
        className="relative flex-1 overflow-y-scroll p-6 pr-8 space-y-4 z-10"
        style={{ scrollbarWidth: 'thin', scrollbarGutter: 'stable' }}
      >
        {scrollThumb.visible ? (
          <div aria-hidden="true" className="pointer-events-none absolute right-2 top-2 bottom-2 w-1 rounded-full bg-platinum-900/25">
            <div
              className="absolute left-0 w-1 rounded-full bg-platinum-400/70"
              style={{ top: scrollThumb.top, height: scrollThumb.height }}
            />
          </div>
        ) : null}
        <AnimatePresence mode='popLayout'>
          {displayedMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-lg backdrop-blur-sm ${msg.sender === 'user'
                ? 'bg-platinum-200 text-platinum-950 rounded-tr-none font-medium'
                : 'bg-platinum-800/60 border border-platinum-700/50 text-platinum-100 rounded-tl-none'
                }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-start">
              <div className="bg-platinum-800/60 border border-platinum-700/50 p-3 rounded-xl rounded-tl-none flex gap-1 items-center h-9">
                <span className="w-1 h-1 bg-platinum-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 bg-platinum-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-1 h-1 bg-platinum-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-platinum-800/50 bg-platinum-900/50 backdrop-blur-md z-10">
        <div className="mb-3 flex flex-wrap gap-2">
          {BASE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={isLoading}
              onClick={() => sendMessage(p)}
              className="text-[11px] text-platinum-200/90 border border-platinum-800 bg-platinum-950/40 hover:bg-platinum-900/60 transition-colors rounded-full px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="w-full bg-platinum-950/50 border border-platinum-800 rounded-lg px-4 py-2 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi un messaggio..."
            className="flex-1 bg-transparent text-platinum-100 text-sm placeholder-platinum-600 outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-1.5 rounded-md bg-platinum-700/50 hover:bg-platinum-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className={`w-3 h-3 ${inputValue.trim() ? 'text-platinum-200' : 'text-platinum-500'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

const DashboardSlide: React.FC = () => {
  return (
    <div className="flex flex-col h-full relative p-6 bg-platinum-900/80 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6 border-b border-platinum-800 pb-4">
        <div className="p-2 bg-platinum-800 rounded-lg text-white"><BarChart3 size={20} /></div>
        <div>
          <h3 className="text-white font-serif text-lg">Performance Hub</h3>
          <p className="text-xs text-platinum-500 uppercase tracking-wider">Real-time Analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-platinum-950/50 border border-platinum-800 rounded-xl">
          <div className="text-platinum-400 text-xs uppercase mb-1">Tempo Risposta</div>
          <div className="text-2xl font-bold text-white">0.2s</div>
          <div className="flex items-center gap-1 text-emerald-400 text-[10px] mt-1">
            <span className="font-bold">âš¡ Instant</span>
          </div>
        </div>
        <div className="p-4 bg-platinum-950/50 border border-platinum-800 rounded-xl">
          <div className="text-platinum-400 text-xs uppercase mb-1">Soddisfazione</div>
          <div className="text-2xl font-bold text-white">4.9<span className="text-sm text-platinum-500">/5</span></div>
          <div className="w-full bg-platinum-900 h-1 mt-2 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-[98%]"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-platinum-950/30 border border-platinum-800 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
        <h4 className="text-platinum-300 text-xs font-bold mb-4 flex items-center gap-2">
          <PieChart size={14} /> Tasso di Completamento
        </h4>
        <div className="flex items-end justify-between h-32 gap-2 px-2">
          {[40, 65, 45, 80, 95, 85, 90].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.1, duration: 1 }}
              className="w-full bg-gradient-to-t from-platinum-700 to-platinum-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity cursor-crosshair relative group"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-platinum-600 font-mono border-t border-platinum-800 pt-2">
          <span>LUN</span><span>DOM</span>
        </div>
      </div>
    </div>
  );
};

const BookingSlide: React.FC = () => {
  return (
    <div className="flex flex-col h-full relative p-6 bg-platinum-900/80 backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6 border-b border-platinum-800 pb-4">
        <div className="p-2 bg-platinum-800 rounded-lg text-white"><Calendar size={20} /></div>
        <div>
          <h3 className="text-white font-serif text-lg">Smart Booking</h3>
          <p className="text-xs text-platinum-500 uppercase tracking-wider">Appuntamenti AI</p>
        </div>
      </div>

      <div className="flex justify-between mb-6 bg-platinum-950/50 p-3 rounded-xl border border-platinum-800">
        {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
          <div key={i} className={`flex flex-col items-center justify-center w-8 h-10 rounded-md text-xs ${i === 3 ? 'bg-platinum-100 text-black font-bold shadow-glow' : 'text-platinum-500'}`}>
            <span className="opacity-50">{day}</span>
            <span>{12 + i}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-xs text-platinum-400 uppercase font-bold mb-2">Prossimi Appuntamenti</h4>
        {[
          { name: "Giulia V.", time: "10:30", type: "Consulenza", status: "confirmed" },
          { name: "Marco R.", time: "14:00", type: "Visita Immobile", status: "pending" },
          { name: "Studio Legale", time: "16:45", type: "Demo Prodotto", status: "confirmed" },
        ].map((apt, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-platinum-950/30 border border-platinum-800 rounded-lg hover:border-platinum-600 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-platinum-700 to-platinum-900 flex items-center justify-center text-[10px] text-white font-bold">
                {apt.name.charAt(0)}
              </div>
              <div>
                <div className="text-white text-sm font-medium">{apt.name}</div>
                <div className="text-platinum-500 text-xs flex items-center gap-1">
                  <Clock size={10} /> {apt.time} â€¢ {apt.type}
                </div>
              </div>
            </div>
            <div>
              {apt.status === 'confirmed' ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                  <CheckCircle size={10} /> Confirmed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                  <Clock size={10} /> Pending
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-platinum-800">
        <div className="flex justify-between text-xs text-platinum-500">
          <span>Slot Disponibili: 4</span>
          <span className="text-platinum-300">Sync: Google Calendar</span>
        </div>
      </div>
    </div>
  );
};

const LeadsSlide: React.FC = () => {
  return (
    <div className="flex flex-col h-full relative p-6 bg-platinum-900/80 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6 border-b border-platinum-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-platinum-800 rounded-lg text-white"><Users size={20} /></div>
          <div>
            <h3 className="text-white font-serif text-lg">Lead Manager</h3>
            <p className="text-xs text-platinum-500 uppercase tracking-wider">Contatti Raccolti</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 rounded bg-platinum-800 text-platinum-400 hover:text-white"><Filter size={14} /></button>
          <button className="p-1.5 rounded bg-platinum-800 text-platinum-400 hover:text-white"><Download size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-platinum-500 mb-2 px-2">
        <div className="col-span-5">Contatto</div>
        <div className="col-span-4">Interesse</div>
        <div className="col-span-3 text-right">Score</div>
      </div>

      <div className="space-y-2">
        {[
          { name: "Alessandro M.", email: "ale.m@gmail.com", interest: "Sito Web", score: 90 },
          { name: "Elena B.", email: "elena.b@corp.it", interest: "Chatbot", score: 75 },
          { name: "Davide R.", email: "d.rossi@studio.com", interest: "Automazione", score: 40 },
          { name: "Sara L.", email: "sara@agency.it", interest: "Sito Web", score: 85 },
        ].map((lead, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center p-2.5 bg-platinum-950/30 border border-platinum-800 rounded-lg hover:bg-platinum-800/30 transition-colors">
            <div className="col-span-5 overflow-hidden">
              <div className="text-white text-xs font-medium truncate">{lead.name}</div>
              <div className="text-platinum-500 text-[10px] truncate">{lead.email}</div>
            </div>
            <div className="col-span-4">
              <span className="px-2 py-0.5 rounded text-[10px] bg-platinum-800 text-platinum-300 border border-platinum-700">
                {lead.interest}
              </span>
            </div>
            <div className="col-span-3 text-right">
              <span className={`text-xs font-bold ${lead.score > 80 ? 'text-emerald-400' : lead.score > 50 ? 'text-amber-400' : 'text-platinum-500'}`}>
                {lead.score}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto text-center">
        <button className="text-xs text-platinum-400 hover:text-white transition-colors flex items-center justify-center gap-1 w-full py-2 border border-dashed border-platinum-800 rounded hover:border-platinum-600">
          View all 1,240 leads
        </button>
      </div>
    </div>
  );
};

export const Hero: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const TOTAL_SLIDES = 4;

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % TOTAL_SLIDES);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-platinum-950 pt-24 md:pt-0"
      style={{ perspective: '2000px' }}
    >
      {/* Subtle grid background only */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="z-10 container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center h-full">

        <div className="text-center lg:text-left mt-10 lg:mt-0 relative z-20">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center lg:justify-start gap-2 mb-6"
          >
            <div className="relative overflow-hidden group bg-platinum-900/50 border border-platinum-700 rounded-full px-4 py-1.5 backdrop-blur-sm inline-flex items-center gap-2">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <Sparkles className="w-3 h-3 text-platinum-300 animate-pulse" />
              <span className="text-platinum-300 text-xs uppercase tracking-[0.2em] font-medium">
                Supporto Tecnico su Documentazione Aziendale
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mb-6"
          >
            <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-platinum-50 via-platinum-200 to-platinum-500 leading-[1.05]">
              I tuoi manuali <br />
              <span className="relative inline-block">
                rispondono. 24/7.
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-xl mx-auto lg:mx-0 text-platinum-400 text-base sm:text-lg font-light leading-relaxed mb-8 sm:mb-10"
          >
            Riduci i ticket ripetitivi del 70%. Il tuo personale tecnico smette di essere interrotto. I clienti trovano le risposte da soli, direttamente dalla tua documentazione.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
          >
            <Link
              href="/contact"
              className="relative px-8 py-3 bg-platinum-100 text-platinum-950 font-bold tracking-widest uppercase text-sm overflow-hidden group rounded-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 active:scale-95 transform text-center"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative flex items-center justify-center gap-2 z-10">
                <Bot className="w-4 h-4" />
                Richiedi una Demo
              </span>
            </Link>
            <a
              href="#come-funziona"
              className="relative px-8 py-3 border border-platinum-700 text-platinum-300 font-medium tracking-widest uppercase text-sm transition-all duration-300 rounded-sm backdrop-blur-sm group overflow-hidden hover:text-white hover:border-platinum-400 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transform text-center"
            >
              <span className="absolute inset-0 w-full h-full bg-platinum-800/0 group-hover:bg-platinum-800/40 transition-colors duration-300"></span>
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
              <span className="relative z-10">Vedi Come Funziona</span>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30, rotateY: 0, rotateX: 0 }}
          animate={{ opacity: 1, x: 0, rotateY: -15, rotateX: 8 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative w-full max-w-sm sm:max-w-md mx-auto lg:mr-0 group/slider"
          style={{ transformStyle: 'preserve-3d', perspective: '1500px' }}
        >
          <div className="absolute top-1/2 -left-12 -translate-y-1/2 z-30 opacity-50 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block" onClick={prevSlide}>
            <div className="p-2 rounded-full bg-platinum-900 border border-platinum-700 hover:bg-platinum-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <ChevronLeft className="text-platinum-200" />
            </div>
          </div>
          <div className="absolute top-1/2 -right-12 -translate-y-1/2 z-30 opacity-50 hover:opacity-100 transition-opacity cursor-pointer hidden lg:block" onClick={nextSlide}>
            <div className="p-2 rounded-full bg-platinum-900 border border-platinum-700 hover:bg-platinum-800 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <ChevronRight className="text-platinum-200" />
            </div>
          </div>

          <div className={`absolute inset-0 rounded-2xl blur-[60px] opacity-50 transition-colors duration-700 ${activeSlide === 0 ? 'bg-blue-500/30' :
            activeSlide === 1 ? 'bg-emerald-500/30' :
              activeSlide === 2 ? 'bg-purple-500/30' : 'bg-amber-500/30'
            }`} />

          <div className="relative bg-platinum-950/90 backdrop-blur-xl border-t border-l border-platinum-700/50 p-0 rounded-2xl flex flex-col h-[420px] sm:h-[500px] overflow-hidden border-r-[8px] border-b-[8px] border-r-platinum-900 border-b-platinum-900 shadow-[20px_30px_60px_rgba(0,0,0,0.9)]">

            <AnimatePresence mode='wait'>
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full w-full"
              >
                {activeSlide === 0 && <ChatSlide />}
                {activeSlide === 1 && <DashboardSlide />}
                {activeSlide === 2 && <BookingSlide />}
                {activeSlide === 3 && <LeadsSlide />}
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-20">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'bg-white w-4' : 'bg-platinum-600'}`}
                />
              ))}
            </div>

          </div>
        </motion.div>
      </div>

      {/* Social Proof - Real Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="z-10 container mx-auto px-4 sm:px-6 mt-16 md:mt-24"
      >
        <div className="border-t border-platinum-800/50 pt-10">
          <p className="text-xs text-platinum-500 uppercase tracking-[0.2em] text-center mb-8">Risultati Misurabili</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-platinum-100 mb-1">-70%</div>
              <div className="text-xs text-platinum-500 uppercase tracking-wide">Ticket Ripetitivi</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-platinum-100 mb-1">&lt;3s</div>
              <div className="text-xs text-platinum-500 uppercase tracking-wide">Tempo Risposta</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-platinum-100 mb-1">24/7</div>
              <div className="text-xs text-platinum-500 uppercase tracking-wide">Senza Personale Extra</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-serif font-bold text-platinum-100 mb-1">0</div>
              <div className="text-xs text-platinum-500 uppercase tracking-wide">Formazione Richiesta</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-platinum-500 hidden md:block cursor-pointer z-20"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => document.getElementById('chi-siamo')?.scrollIntoView({ behavior: 'smooth' })}
      >
        <ArrowDown className="w-6 h-6 opacity-50 hover:opacity-100 transition-opacity" />
      </motion.div>
    </section>
  );
};

