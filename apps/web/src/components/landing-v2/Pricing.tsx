'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    description: 'For small teams and pilots.',
    priceMonthly: 49,
    priceYearly: 39,
    features: [
      '1 Active Agent',
      '1,000 Messages/mo',
      'Email Support',
      'Basic Analytics',
      'Web Widget',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    description: 'For scaling businesses.',
    priceMonthly: 149,
    priceYearly: 119,
    features: [
      '5 Active Agents',
      '50,000 Messages/mo',
      'Priority Support',
      'Advanced Analytics',
      'Custom Integrations',
      'API Access',
      'Custom Branding',
    ],
    cta: 'Get Started',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations.',
    priceMonthly: null,
    priceYearly: null,
    features: [
      'Unlimited Agents',
      'Unlimited Volume',
      'Dedicated Success Manager',
      'SLA Guarantee',
      'On-premise Options',
      'Custom Contract',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 text-lg mb-8"
          >
            Choose the plan that fits your scale.
          </motion.p>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1 p-1 bg-slate-800 rounded-lg"
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs text-emerald-400 font-semibold">-20%</span>
            </button>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-xl border flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-slate-800 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-105 z-10'
                  : 'bg-slate-900 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <div className="self-start px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wide mb-4">
                  {plan.badge}
                </div>
              )}

              <h3 className="text-lg font-semibold text-white mb-2">
                {plan.name}
              </h3>
              <p className="text-slate-400 text-sm mb-6">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                {plan.priceMonthly ? (
                  <>
                    <span className="text-4xl font-bold text-white">
                      ${billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">/month</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-white">Contact Us</span>
                )}
              </div>

              {billingCycle === 'yearly' && plan.priceYearly && (
                <p className="text-xs text-slate-500 -mt-4 mb-6">
                  Billed annually (${plan.priceYearly * 12})
                </p>
              )}

              <div className="h-px bg-white/5 mb-6" />

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check size={16} className="text-indigo-500 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.priceMonthly ? '/auth/register' : '#contact'}>
                <Button
                  className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                      : 'bg-white text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-slate-500">
            All plans include 14-day free trial. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
