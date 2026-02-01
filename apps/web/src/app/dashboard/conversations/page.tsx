import { Suspense } from 'react';
import ConversationsClient from './ConversationsClient';

export const dynamic = 'force-static';

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading conversations...</div>
        </div>
      }
    >
      <ConversationsClient />
    </Suspense>
  );
}
