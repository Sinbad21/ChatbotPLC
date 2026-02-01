'use client';

import { Navbar } from '@/components/landing-v2/Navbar';
import { Footer } from '@/components/landing-v2/Footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Target, Lightbulb, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          <article className="prose prose-slate dark:prose-invert max-w-none">
            <h1>About OMNICAL STUDIO</h1>
            <p className="text-xl text-muted-foreground">
              Building the future of AI-powered customer engagement
            </p>

            <div className="not-prose my-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <Target className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold mb-2">Our Mission</h3>
                <p className="text-sm text-muted-foreground">
                  To democratize AI chatbot technology and make it accessible to businesses
                  of all sizes.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Lightbulb className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold mb-2">Our Vision</h3>
                <p className="text-sm text-muted-foreground">
                  A world where every business can provide instant, intelligent customer
                  support 24/7.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Users className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold mb-2">Our Team</h3>
                <p className="text-sm text-muted-foreground">
                  A diverse team of AI researchers, engineers, and customer success experts
                  passionate about technology.
                </p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Heart className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold mb-2">Our Values</h3>
                <p className="text-sm text-muted-foreground">
                  Innovation, transparency, customer-centricity, and ethical AI development.
                </p>
              </div>
            </div>

            <h2>Our Story</h2>
            <p>
              OMNICAL STUDIO was founded in 2024 with a simple idea: customer support should be
              instant, intelligent, and accessible to everyone. We noticed that while large
              enterprises had access to sophisticated AI chatbots, small and medium businesses
              were left behind due to high costs and technical complexity.
            </p>

            <p>
              We set out to change that by building a platform that combines cutting-edge AI
              technology with an intuitive interface that anyone can use. Today, thousands of
              businesses use OMNICAL STUDIO to provide better customer service, generate more
              leads, and grow their business.
            </p>

            <h2>Our Technology</h2>
            <p>
              We leverage the latest advancements in AI and natural language processing, including:
            </p>
            <ul>
              <li>
                <strong>Multiple AI Models</strong> - Integration with OpenAI GPT, Anthropic Claude,
                and Google Gemini for best-in-class natural language understanding
              </li>
              <li>
                <strong>RAG Technology</strong> - Retrieval-Augmented Generation for accurate,
                context-aware responses based on your documents
              </li>
              <li>
                <strong>Edge Computing</strong> - Powered by Cloudflare Workers for ultra-low latency
                responses worldwide
              </li>
              <li>
                <strong>Enterprise Security</strong> - SOC 2 compliant infrastructure with end-to-end
                encryption
              </li>
            </ul>

            <h2>Why Choose Us</h2>
            <p>
              Unlike other chatbot platforms, we focus on simplicity without sacrificing power.
              You can have a fully functional AI chatbot up and running in minutes, not weeks.
              Our platform scales with your business, from startups to enterprises.
            </p>

            <h2>Our Commitment to Privacy</h2>
            <p>
              We take data privacy seriously. We are fully GDPR compliant, and your data is always
              encrypted in transit and at rest. We never sell your data to third parties, and you
              maintain full ownership of your content at all times.
            </p>

            <h2>Get in Touch</h2>
            <p>
              Want to learn more or have questions? We'd love to hear from you:
            </p>
            <ul>
              <li>
                Email: <a href="mailto:hello@chatbot-studio.com">hello@chatbot-studio.com</a>
              </li>
              <li>
                Visit our <Link href="/contact">contact page</Link> for more ways to reach us
              </li>
            </ul>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
