'use client';

import { RefreshProvider } from '@/lib/refresh-context';

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RefreshProvider>{children}</RefreshProvider>;
}
