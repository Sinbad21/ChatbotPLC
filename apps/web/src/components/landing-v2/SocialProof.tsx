'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'We reduced support requests by 60%. The chatbot responds accurately and customers are satisfied.',
    author: 'Sarah Johnson',
    role: 'CEO',
    company: 'TechHub Inc',
    rating: 5,
  },
  {
    quote: 'Setup in less than an afternoon. Now we handle 200+ conversations daily without hiring new staff.',
    author: 'Michael Chen',
    role: 'Operations Manager',
    company: 'E-commerce Plus',
    rating: 5,
  },
  {
    quote: 'The dashboard shows us exactly what customers ask. We improved FAQs and increased conversions.',
    author: 'Emily Davis',
    role: 'Marketing Director',
    company: 'SaaS Solutions',
    rating: 5,
  },
];

export function SocialProof() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-3"
          >
            Used by Over 2,500 Companies
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-slate-400"
          >
            Real results from teams that have adopted OMNICAL STUDIO
          </motion.p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <div className="p-6 h-full bg-slate-900 border border-white/10 rounded-xl hover:border-indigo-500/50 transition-all">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-slate-300 leading-relaxed mb-6">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 font-semibold text-sm">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{testimonial.author}</p>
                    <p className="text-xs text-slate-500">
                      {testimonial.role} @ {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
