'use client';

import { Navbar } from '@/components/landing-v2/Navbar';
import { Footer } from '@/components/landing-v2/Footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';

// Placeholder blog posts - replace with actual data from CMS/database
const blogPosts = [
  {
    id: '1',
    title: 'Getting Started with AI Chatbots: A Comprehensive Guide',
    excerpt:
      'Learn how to create your first AI chatbot and start automating customer support in minutes.',
    author: 'OMNICAL STUDIO Team',
    date: '2025-01-15',
    readTime: '5 min read',
    category: 'Tutorial',
    slug: 'getting-started-with-ai-chatbots',
  },
  {
    id: '2',
    title: 'The Future of Customer Service: AI-Powered Support',
    excerpt:
      'Discover how AI is transforming customer service and what it means for your business.',
    author: 'OMNICAL STUDIO Team',
    date: '2025-01-10',
    readTime: '7 min read',
    category: 'Insights',
    slug: 'future-of-customer-service',
  },
  {
    id: '3',
    title: 'RAG Technology Explained: How Chatbots Learn from Your Documents',
    excerpt:
      'A deep dive into Retrieval-Augmented Generation and how it powers intelligent chatbots.',
    author: 'OMNICAL STUDIO Team',
    date: '2025-01-05',
    readTime: '10 min read',
    category: 'Technical',
    slug: 'rag-technology-explained',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-8 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>

          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Insights, tutorials, and updates from the OMNICAL STUDIO team
            </p>
          </div>

          {/* Blog posts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {post.category}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.readTime}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all"
                  >
                    Read more
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Empty state when no posts */}
          {blogPosts.length === 0 && (
            <div className="text-center py-16 border rounded-lg bg-card">
              <h2 className="text-2xl font-semibold mb-2">No blog posts yet</h2>
              <p className="text-muted-foreground mb-6">
                Check back soon for insights, tutorials, and updates!
              </p>
              <Link href="/">
                <Button>Back to Home</Button>
              </Link>
            </div>
          )}

          {/* Pagination placeholder */}
          {blogPosts.length > 0 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" disabled>
                Previous
              </Button>
              <Button variant="outline">1</Button>
              <Button variant="outline" disabled>
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
