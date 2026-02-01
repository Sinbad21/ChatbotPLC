"use client";

import { motion } from 'framer-motion';
import { useLandingTranslation } from '@/hooks/useLandingTranslation';
import {
  Check,
  Sparkles,
  Zap,
  Shield,
  Globe as GlobeIcon,
  BarChart3,
  FileText,
  MessageSquare,
  Star,
  ChevronDown,
  ArrowRight,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AddOnsModulesSection } from '@/components/pricing/AddOnsModulesSection';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Hero Component
export function Hero() {
  const { t } = useLandingTranslation();

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5B4BFF]/10 via-background to-background" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('hero.badge')}
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('hero.headline')}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('hero.subheadline')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-[#5B4BFF] hover:bg-[#4B3BEF] gap-2">
                {t('hero.ctaPrimary')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('nav.pricing', 'Pricing')}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2">
              <Play className="w-4 h-4" />
              {t('hero.ctaSecondary')}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('hero.microCopy')}
          </p>
        </motion.div>

        {/* Hero Image Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            <div className="aspect-video bg-gradient-to-br from-[#5B4BFF]/20 to-background flex items-center justify-center">
              <MessageSquare className="w-24 h-24 text-[#5B4BFF]/30" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Trust Badges
export function TrustBadges() {
  const { t } = useLandingTranslation();

  return (
    <section className="py-12 px-4 border-b border-border">
      <div className="container mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-8">
          {t('trust.title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
          {['TechCorp', 'StartupXYZ', 'Acme Inc', 'CloudSystems', 'DataCo'].map((name) => (
            <div key={name} className="text-lg font-semibold">
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Value Props
export function ValueProps() {
  const { t } = useLandingTranslation();
  const items = t('valueProps.items');

  const icons = [FileText, Zap, MessageSquare, BarChart3, GlobeIcon, Shield];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('valueProps.title')}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((item: any, i: number) => {
            const Icon = icons[i] || FileText;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-[#5B4BFF] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Demo Chat Component (simplified)
export function DemoChat() {
  const { t } = useLandingTranslation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! Ask me anything about OMNICAL STUDIO.' },
  ]);

  return (
    <section id="demo" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">{t('demo.title')}</h2>
          <p className="text-muted-foreground">{t('demo.subtitle')}</p>
        </div>

        <Card className="p-6">
          <div className="h-64 overflow-y-auto mb-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-[#5B4BFF] text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder={t('demo.placeholder')}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B4BFF]"
          />
        </Card>
      </div>
    </section>
  );
}

// Features
export function Features() {
  const { t } = useLandingTranslation();
  const items = t('features.items');

  return (
    <section id="features" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {items?.map((item: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Integrations
export function Integrations() {
  const { t } = useLandingTranslation();

  return (
    <section className="py-12 px-4 border-y border-border">
      <div className="container mx-auto text-center">
        <h3 className="text-2xl font-bold mb-6">{t('integrations.title')}</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {['WhatsApp', 'Telegram', 'Slack', 'Discord'].map((name) => (
            <Badge key={name} variant="outline" className="text-sm px-4 py-2">
              {name} <span className="ml-2 text-xs">({t('integrations.comingSoon')})</span>
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Component (with toggle)
export function Pricing() {
  const { t } = useLandingTranslation();
  const [annual, setAnnual] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  type Segment = 'local' | 'agency' | 'saas';
  type Goal = 'bookings' | 'leads' | 'support';

  const segment = useMemo<Segment>(() => {
    const value = searchParams.get('segment');
    if (value === 'local' || value === 'agency' || value === 'saas') return value;
    return 'local';
  }, [searchParams]);

  const goal = useMemo<Goal>(() => {
    const value = searchParams.get('goal');
    if (value === 'bookings' || value === 'leads' || value === 'support') return value;
    return 'leads';
  }, [searchParams]);

  const plans = t('pricing.plans');

  const setPersonalization = (next: { segment?: Segment; goal?: Goal }) => {
    const nextSegment = next.segment ?? segment;
    const nextGoal = next.goal ?? goal;
    const params = new URLSearchParams(searchParams.toString());
    params.set('segment', nextSegment);
    params.set('goal', nextGoal);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const focusAll = t(`pricing.personalize.focus.${segment}.${goal}`) as string[] | undefined;
  const coreCountByPlanId: Record<string, number> = {
    base: 2,
    pro: 3,
    'pro-plus': 4,
    business: 5,
    enterprise: 5,
  };

  return (
    <section id="pricing" className="py-20 px-4">
      <span id="prezzi" aria-hidden="true" />
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t('pricing.subtitle')}
          </p>

          <div className="flex items-center justify-center mb-10">
            <Link href="/pricing">
              <Button
                size="lg"
                className="h-12 px-10 text-base font-semibold bg-[#5B4BFF] hover:bg-[#4B3BEF] shadow-lg shadow-black/15 ring-1 ring-[#5B4BFF]/25 w-full sm:w-auto"
              >
               {t('pricing.viewFull', 'Info complete prezzi qui')}
              </Button>
            </Link>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={!annual ? 'font-semibold' : 'text-muted-foreground'}>
              {t('pricing.monthly')}
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                annual ? 'bg-[#5B4BFF]' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  annual ? 'translate-x-7' : ''
                }`}
              />
            </button>
            <span className={annual ? 'font-semibold' : 'text-muted-foreground'}>
              {t('pricing.annually')}
            </span>
            {annual && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                {t('pricing.annualDiscount')}
              </Badge>
            )}
          </div>

          {/* Personalization selectors */}
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background/50 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium mb-2">{t('pricing.personalize.activityLabel')}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {(['local', 'agency', 'saas'] as const).map((id) => (
                    <Button
                      key={id}
                      type="button"
                      variant={segment === id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPersonalization({ segment: id })}
                      className={segment === id ? 'bg-foreground text-background hover:bg-foreground/90' : ''}
                    >
                      {t(`pricing.personalize.segments.${id}`)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t('pricing.personalize.goalLabel')}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {(['bookings', 'leads', 'support'] as const).map((id) => (
                    <Button
                      key={id}
                      type="button"
                      variant={goal === id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPersonalization({ goal: id })}
                      className={goal === id ? 'bg-foreground text-background hover:bg-foreground/90' : ''}
                    >
                      {t(`pricing.personalize.goals.${id}`)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {t('pricing.personalize.preview')}{' '}
              <span className="font-medium text-foreground">
                {t(`pricing.personalize.segments.${segment}`)} Â· {t(`pricing.personalize.goals.${goal}`)}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {plans?.map((plan: any, i: number) => (
            <Card
              key={i}
              className={`p-8 relative ${
                plan.popular ? 'border-[#5B4BFF] border-2 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5B4BFF]">
                  Popular
                </Badge>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                {typeof (annual ? plan.priceAnnual : plan.price) === 'number' ? (
                  <>
                    <span className="text-4xl font-bold">
                      ${annual ? plan.priceAnnual : plan.price}
                    </span>
                    <span className="text-muted-foreground">{t('pricing.perMonth')}</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {annual ? t('pricing.billedAnnually') : t('pricing.billedMonthly')}
                    </p>
                  </>
                ) : (
                  <span className="text-3xl font-bold">
                    {(annual ? plan.priceAnnual : plan.price) ? (annual ? plan.priceAnnual : plan.price) : t('pricing.customPrice', 'Custom')}
                  </span>
                )}
              </div>



              <Button
                className={`w-full mb-6 ${
                  plan.popular
                    ? 'bg-[#5B4BFF] hover:bg-[#4B3BEF]'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {plan.cta}
              </Button>

              <ul className="space-y-3">
                {(() => {
                  const planId = typeof plan.id === 'string' ? plan.id : '';
                  const coreCount = coreCountByPlanId[planId] ?? 3;
                  const coreForPlan = Array.isArray(focusAll) ? focusAll.slice(0, coreCount) : [];
                  const rawFeatures = Array.isArray(plan.features) ? plan.features : [];
                  const merged = [...coreForPlan, ...rawFeatures];
                  const unique = merged.filter((value, idx) => merged.indexOf(value) === idx);
                  return unique;
                })().map((feature: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>


        <div className="mt-8 flex justify-center">
          <Link href="/pricing">
            <Button size="lg" className="h-12 px-10 text-base font-semibold bg-[#5B4BFF] hover:bg-[#4B3BEF]">
              {t('pricing.viewFull', 'Info complete prezzi qui')}
            </Button>
          </Link>
        </div>
        <AddOnsModulesSection />
      </div>
    </section>
  );
}

// Testimonials
export function Testimonials() {
  const { t } = useLandingTranslation();
  const items = t('testimonials.items');

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('testimonials.title')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.slice(0, 3).map((item: any, i: number) => (
            <Card key={i} className="p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">{item.text}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5B4BFF]/20 flex items-center justify-center font-semibold text-[#5B4BFF]">
                  {item.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ
export function FAQ() {
  const { t } = useLandingTranslation();
  const items = t('faq.items');

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('faq.title')}
        </h2>

        <Accordion type="single" collapsible className="space-y-4">
          {items?.map((item: any, i: number) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// Final CTA
export function FinalCTA() {
  const { t } = useLandingTranslation();

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-[#5B4BFF]/10 to-background">
      <div className="container mx-auto text-center max-w-3xl">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          {t('finalCta.title')}
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          {t('finalCta.subtitle')}
        </p>
        <Link href="/auth/register">
          <Button size="lg" className="bg-[#5B4BFF] hover:bg-[#4B3BEF] gap-2">
            {t('finalCta.cta')}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <p className="text-sm text-muted-foreground mt-4">
          {t('finalCta.microCopy')}
        </p>
      </div>
    </section>
  );
}

// Footer
export function Footer() {
  const { t } = useLandingTranslation();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">{t('footer.features')}</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground">{t('footer.pricing')}</Link></li>
              <li><Link href="/docs" className="hover:text-foreground">{t('footer.docs')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">{t('footer.about')}</Link></li>
              <li><Link href="/blog" className="hover:text-foreground">{t('footer.blog')}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">{t('footer.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/privacy" className="hover:text-foreground">{t('footer.privacy')}</Link></li>
              <li><Link href="/legal/terms" className="hover:text-foreground">{t('footer.terms')}</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-foreground">{t('footer.cookies', 'Cookie Policy')}</Link></li>
              <li><Link href="/legal/gdpr" className="hover:text-foreground">{t('footer.gdpr')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.newsletter.title')}</h4>
            <p className="text-sm text-muted-foreground mb-3">
              {t('footer.newsletter.subtitle')}
            </p>
            <input
              type="email"
              placeholder={t('footer.newsletter.placeholder')}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg mb-2"
            />
            <Button size="sm" className="w-full bg-[#5B4BFF] hover:bg-[#4B3BEF]">
              {t('footer.newsletter.cta')}
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t('footer.rights')}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{t('footer.poweredBy')}</span>
            <Badge variant="outline">Cloudflare</Badge>
            <Badge variant="outline">Neon</Badge>
            <Badge variant="outline">OpenAI</Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
export default function LandingPage() {
  useEffect(() => {
    const scrollToHash = () => {
      const raw = typeof window !== 'undefined' ? window.location.hash : '';
      const id = raw.startsWith('#') ? decodeURIComponent(raw.slice(1)) : '';
      if (!id) return;

      const el = document.getElementById(id);
      if (!el) return;

      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    scrollToHash();
    window.addEventListener('hashchange', scrollToHash);
    return () => window.removeEventListener('hashchange', scrollToHash);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <TrustBadges />
      <ValueProps />
      <DemoChat />
      <Features />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}


