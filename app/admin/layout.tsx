'use client';
import AdminSidebar, { AdminSidebarContent } from '@/components/admin/sidebar';
import { MobileSidebar } from '@/components/admin/mobile-sidebar';
import { RefreshButton } from '@/components/RefreshButton';
import { RefreshProvider } from '@/lib/refresh-context';
import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { admin, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <RefreshProvider>
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar />
        {/* min-w-0 lets this column shrink below its widest child (wide tables),
            so the per-table overflow-x-auto wrappers actually scroll on mobile
            instead of being clipped by the overflow-hidden above. */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="md:hidden">
              <MobileSidebar>
                <AdminSidebarContent />
              </MobileSidebar>
            </div>
            <span className="md:hidden text-sm font-semibold text-gray-900">Admin Portal</span>
            <div className="flex-1" />
            <RefreshButton />
          </div>
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RefreshProvider>
  );
}
