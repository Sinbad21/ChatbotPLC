import { Suspense } from 'react';
import ScrapingClient from './ScrapingClient';

export const dynamic = 'force-static';

export default function ScrapingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading scraping tools...</div>
        </div>
      }
    >
      <ScrapingClient />
    </Suspense>
  );
}
