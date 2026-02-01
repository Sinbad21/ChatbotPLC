'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingNewI18n } from './i18n';

export const Navbar: React.FC = () => {
  const { lang, setLang, t } = useLandingNewI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
    isScrolled
      ? 'bg-platinum-950/80 backdrop-blur-md border-b border-platinum-800 py-4'
      : 'bg-transparent py-6'
  }`;

  const navItems = [
    { id: 'home', label: t('nav').home },
    { id: 'chi-siamo', label: t('nav').about },
    { id: 'servizi', label: t('nav').services },
    { id: 'prezzi', label: t('nav').pricing },
  ];

  return (
    <nav className={navClasses}>
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <Image
            src="/logo.svg"
            alt="Omnical Studio"
            width={32}
            height={32}
            className="w-8 h-8"
            priority
          />
          <span className="text-xl md:text-2xl font-serif font-bold text-platinum-100 tracking-widest uppercase group-hover:text-white transition-colors duration-500">
            OMNICAL STUDIO
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          {navItems.map((item) => (
            item.id === 'prezzi' ? (
              <Link
                key={item.id}
                href="/pricing"
                className="text-sm font-medium text-platinum-300 hover:text-white transition-colors duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-sm font-medium text-platinum-300 hover:text-white transition-colors duration-300 uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </a>
            )
          ))}

          <button
            type="button"
            onClick={() => setLang(lang === 'it' ? 'en' : 'it')}
            className="px-3 py-2 border border-platinum-700 text-platinum-200 hover:text-white hover:border-platinum-400 transition-all rounded-sm uppercase text-xs tracking-widest font-bold active:scale-95"
            aria-label={t('nav').language}
          >
            {lang.toUpperCase()}
          </button>

          <Link
            href="/auth/login"
            className="relative group px-6 py-2 border border-platinum-400 text-platinum-100 hover:text-platinum-900 transition-all duration-300 rounded-sm uppercase text-xs tracking-widest font-bold overflow-hidden bg-transparent hover:bg-platinum-100 active:scale-95 hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            <span className="relative z-10">Accedi</span>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-platinum-100 active:scale-90 transition-transform"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-platinum-900 border-b border-platinum-800 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navItems.map((item) => (
                item.id === 'prezzi' ? (
                  <Link
                    key={item.id}
                    href="/pricing"
                    className="text-platinum-200 hover:text-white text-lg font-serif border-b border-platinum-800/50 pb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="text-platinum-200 hover:text-white text-lg font-serif border-b border-platinum-800/50 pb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              ))}

              <button
                type="button"
                onClick={() => {
                  setLang(lang === 'it' ? 'en' : 'it');
                  setIsMobileMenuOpen(false);
                }}
                className="text-platinum-200 hover:text-white text-lg font-serif text-left"
                aria-label={t('nav').language}
              >
                {t('nav').language}: {lang.toUpperCase()}
              </button>

              <Link
                href="/auth/login"
                className="text-platinum-200 hover:text-white text-lg font-serif"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('nav').login}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
