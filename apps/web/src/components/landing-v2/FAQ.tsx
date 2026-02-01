'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Do I need programming knowledge to use OMNICAL STUDIO?',
    answer: 'No. The interface is completely visual. You upload content, configure behavior and integrate the widget with copy-paste. If you want to use APIs, complete documentation is available.',
  },
  {
    question: 'What languages does the chatbot support?',
    answer: 'The chatbot can respond in over 20 languages, including English, Spanish, French, German, and Italian. It automatically recognizes the user\'s language and responds accordingly.',
  },
  {
    question: 'How does the free trial work?',
    answer: '14 days without limitations. You can test all Professional plan features. No credit card required. At the end of the period, you can choose a plan or the chatbot will be deactivated.',
  },
  {
    question: 'Can I use my own data to train the chatbot?',
    answer: 'Yes. You can upload PDF, DOCX, TXT or provide URLs. Data is processed and indexed to enable accurate responses. All content remains private and is not shared with other customers.',
  },
  {
    question: 'Does the chatbot replace human support?',
    answer: 'The chatbot handles frequent questions and standard requests (about 60-70% of cases). For complex requests, you can configure automatic handoff to the human team via email or ticketing tool integration.',
  },
  {
    question: 'Can I cancel at any time?',
    answer: 'Yes. You can cancel your plan at any time from the dashboard. There are no commitments or penalties. Data remains accessible for 30 days after cancellation, then is permanently deleted.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 px-4 relative overflow-hidden">
      <div className="container mx-auto max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-slate-400"
          >
            Everything you need to know about OMNICAL STUDIO
          </motion.p>
        </div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="bg-slate-900 border border-white/10 rounded-xl px-6 hover:border-indigo-500/50 transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-white hover:no-underline py-5 hover:text-slate-200 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400 leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact Link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-400">
            Can&apos;t find the answer you&apos;re looking for?{' '}
            <a href="mailto:support@chatbotstudio.com" className="text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline font-semibold transition-all">
              Contact support
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
