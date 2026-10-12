'use client';

import { PasswordChangeWrapper } from '@/components/PasswordChangeWrapper';
import { RefreshButton } from '@/components/RefreshButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabaseClient';
import { RefreshProvider } from '@/lib/refresh-context';
import { useConfirm } from '@/lib/use-confirm';
import {
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StudentSidebarContent } from './components/StudentSidebar';

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/student/dashboard',
  },
  {
    id: 'enrollment',
    label: 'Enrollment',
    icon: FileText,
    href: '/student/enrollment',
  },
  // {
  //   id: 'schedule',
  //   label: 'Schedule Calendar',
  //   icon: Calendar,
  //   href: '/student/schedule',
  // },
  {
    id: 'grades',
    label: 'Grades & Reports',
    icon: GraduationCap,
    href: '/student/grades',
  },
  { id: 'profile', label: 'Profile', icon: User, href: '/student/profile' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/student/help' },
] as const;

interface Student {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  student_number?: string;
  [key: string]: any;
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedStudent = localStorage.getItem('student');
    if (!storedStudent) {
      // Only redirect if not on the main student page
      if (pathname !== '/student') {
        router.replace('/login');
      }
      setIsLoading(false);
      return;
    }

    try {
      const studentData = JSON.parse(storedStudent);
      setStudent(studentData);
    } catch (error) {
      console.error('Error parsing student data:', error);
      localStorage.removeItem('student');
      router.replace('/login');
    }
    setIsLoading(false);
  }, [pathname, router]);
  const { showConfirm } = useConfirm();

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      message: 'Are you sure you want to log out?',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (confirmed) {
      // Clear state first
      setStudent(null);
      localStorage.removeItem('student');
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  // If on login page, show children without layout
  if (pathname === '/student') {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold text-red-800">Loading...</div>
      </div>
    );
  }

  // If no student and not on login page, children will handle redirect
  if (!student) {
    return <>{children}</>;
  }

  console.log('[Student Layout] Student data:', student);
  console.log(
    '[Student Layout] Student ID:',
    student.id,
    'Type:',
    typeof student.id
  );

  return (
    <RefreshProvider>
      <PasswordChangeWrapper userId={String(student.id)}>
        <div className="flex h-screen overflow-hidden bg-[#F9FAFB]">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-56 h-full flex-shrink-0">
            <StudentSidebarContent
              student={student}
              navItems={NAV_ITEMS}
              currentPath={pathname}
              onLogout={handleLogout}
            />
          </aside>

          {/* Main Content */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Top bar (mobile + desktop refresh) */}
            <header className="flex items-center px-4 py-3 bg-white border-b border-gray-200">
              <div className="md:hidden flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-56 p-0">
                    <StudentSidebarContent
                      student={student}
                      navItems={NAV_ITEMS}
                      currentPath={pathname}
                      onLogout={handleLogout}
                    />
                  </SheetContent>
                </Sheet>
                <h1 className="text-sm font-bold text-gray-800">Student Portal</h1>
              </div>
              <div className="flex-1" />
              <RefreshButton />
              <Button variant="ghost" size="icon" className="md:hidden ml-1" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </PasswordChangeWrapper>
    </RefreshProvider>
  );
}
