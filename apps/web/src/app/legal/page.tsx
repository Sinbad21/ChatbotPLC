'use client';

import Link from 'next/link';

export default function LegalIndexPage() {
  const items = [
    {
      title: 'Privacy Policy',
      description: 'How we collect and use personal data.',
      href: '/legal/privacy',
    },
    {
      title: 'Terms of Service',
      description: 'Rules and conditions for using the service.',
      href: '/legal/terms',
    },
    {
      title: 'GDPR',
      description: 'Your GDPR rights and our compliance statement.',
      href: '/legal/gdpr',
    },
    {
      title: 'Cookie Policy',
      description: 'What cookies we use and how consent works.',
      href: '/legal/cookies',
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="font-serif text-4xl sm:text-5xl text-white mb-3">Legal</h1>
      <p className="text-platinum-300 mb-10">Find our policies and compliance information.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <div className="p-6 h-full border border-platinum-800 bg-platinum-900/20 hover:border-platinum-400/60 hover:bg-platinum-900/30 transition-colors">
              <div className="text-lg font-semibold text-white mb-1">{item.title}</div>
              <div className="text-sm text-platinum-300">{item.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
