'use client';

import { motion } from 'framer-motion';
import { FileText, Zap, BarChart3 } from 'lucide-react';

const values = [
  {
    icon: FileText,
    title: 'Train with Your Content',
    description: 'Upload PDFs, DOCX, URLs or text. The chatbot learns from your documentation and responds with accurate information.',
  },
  {
    icon: Zap,
    title: 'Integrate Anywhere in 5 Minutes',
    description: 'Widget ready for website, WhatsApp, Telegram, Slack. Copy-paste the code and you are online.',
  },
  {
    icon: BarChart3,
    title: 'Measure Real Results',
    description: 'Dashboard with conversations, acquired leads, frequent questions and resolution rate. No useless metrics.',
  },
];

export function ValueProps() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="bg-slate-900 rounded-2xl p-6 h-full border border-white/10 hover:border-indigo-500/50 shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                {/* Icon Container */}
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-all duration-300">
                    <value.icon className="w-6 h-6 text-indigo-400" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">
                  {value.title}
                </h3>

                {/* Description */}
                <p className="text-slate-400 leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
