'use client';

import { Navbar } from '@/components/landing-v2/Navbar';
import { Footer } from '@/components/landing-v2/Footer';
import { Book, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Book className="w-16 h-16 mx-auto mb-6 text-[#5B4BFF]" />

          <h1 className="text-4xl font-bold mb-4">Documentation</h1>
          <p className="text-lg text-muted-foreground mb-12">
            Complete guides and API references to help you get started
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="p-6 text-left">
              <h3 className="text-xl font-semibold mb-2">Quick Start Guide</h3>
              <p className="text-muted-foreground mb-4">
                Get your first chatbot up and running in under 5 minutes
              </p>
              <Button variant="outline" className="gap-2">
                Read Guide
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Card>

            <Card className="p-6 text-left">
              <h3 className="text-xl font-semibold mb-2">API Reference</h3>
              <p className="text-muted-foreground mb-4">
                Complete API documentation with examples and SDKs
              </p>
              <Button variant="outline" className="gap-2">
                View API Docs
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Card>

            <Card className="p-6 text-left">
              <h3 className="text-xl font-semibold mb-2">Widget Integration</h3>
              <p className="text-muted-foreground mb-4">
                Embed and customize the chat widget on your website
              </p>
              <Button variant="outline" className="gap-2">
                Learn More
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Card>

            <Card className="p-6 text-left">
              <h3 className="text-xl font-semibold mb-2">Training Data</h3>
              <p className="text-muted-foreground mb-4">
                Best practices for training your chatbot on your data
              </p>
              <Button variant="outline" className="gap-2">
                Read Guide
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Card>
          </div>

          <div className="bg-muted/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">Documentation Coming Soon</h2>
            <p className="text-muted-foreground mb-6">
              We're working on comprehensive documentation. For now, check out the{' '}
              <Link href="https://github.com/yourusername/chatbot-studio" className="text-[#5B4BFF] hover:underline">
                GitHub repository
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="text-[#5B4BFF] hover:underline">
                contact support
              </Link>
              {' '}for help.
            </p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
