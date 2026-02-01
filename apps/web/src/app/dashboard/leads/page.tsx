import { Suspense } from 'react';
import LeadsClient from './LeadsClient';

export const dynamic = 'force-static';

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading leads...</div>
        </div>
      }
    >
      <LeadsClient />
    </Suspense>
  );
}
