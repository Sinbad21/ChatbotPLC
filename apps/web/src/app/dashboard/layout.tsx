// Force dynamic rendering for all dashboard routes
// This ensures SSR for pages that fetch user data, DB, bots, scraping, bookings
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import DashboardLayoutClient from './DashboardLayoutClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
