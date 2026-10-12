'use client';

import { PasswordChangeWrapper } from '@/components/PasswordChangeWrapper';
import { RefreshButton } from '@/components/RefreshButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabaseClient';
import { RefreshProvider } from '@/lib/refresh-context';
import { useConfirm } from '@/lib/use-confirm';
import { Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import TeacherSidebarContent from './components/TeacherSidebar';

interface Teacher {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  subject?: string;
  subjects?: string;
  [key: string]: any;
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { showConfirm } = useConfirm();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname === '/teacher/login' || pathname === '/login';

  // Check if teacher is logged in
  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false);
      return;
    }

    const storedTeacher = localStorage.getItem('teacher');
    if (storedTeacher) {
      try {
        const teacherData = JSON.parse(storedTeacher);
        setTeacher(teacherData);
      } catch (error) {
        console.error('Error parsing stored teacher data:', error);
        localStorage.removeItem('teacher');
        router.push('/login?role=teacher');
      }
    } else {
      router.push('/login?role=teacher');
    }
    setIsLoading(false);
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      setTeacher(null);
      localStorage.removeItem('teacher');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  // Login page doesn't need the wrapper
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  // If not authenticated, don't render (will redirect)
  if (!teacher) {
    return null;
  }

  return (
    <RefreshProvider>
      <PasswordChangeWrapper userId={String(teacher.id)}>
        <div className="flex h-screen overflow-hidden">

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 h-full flex-shrink-0">
            <TeacherSidebarContent teacher={teacher} onLogout={handleLogout} />
          </aside>

          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
              <div className="md:hidden flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="Toggle menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-56">
                    <TeacherSidebarContent teacher={teacher} onLogout={handleLogout} />
                  </SheetContent>
                </Sheet>
                <span className="text-sm font-semibold text-gray-900">Teacher Portal</span>
              </div>
              <div className="flex-1" />
              <RefreshButton />
            </div>

            <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </PasswordChangeWrapper>
    </RefreshProvider>
  );
}
