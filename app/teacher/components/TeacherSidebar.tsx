'use client';

import { PortalSidebar, type PortalNavSection } from '@/components/portal-sidebar';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

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

const SECTIONS: PortalNavSection[] = [
  {
    entries: [
      { item: { label: 'Dashboard', href: '/teacher', icon: LayoutDashboard, exact: true } },
    ],
  },
  {
    label: 'Teaching',
    entries: [
      { item: { label: 'My Classes', href: '/teacher/classes', icon: BookOpen } },
      { item: { label: 'Manage Grades', href: '/teacher/grades', icon: GraduationCap } },
      { item: { label: 'Attendance', href: '/teacher/attendance', icon: CalendarDays } },
      { item: { label: 'Reports', href: '/teacher/reports', icon: BarChart3 } },
    ],
  },
  {
    label: 'Personal',
    entries: [
      { item: { label: 'My Account', href: '/teacher/account', icon: User } },
      { item: { label: 'Help & Support', href: '/teacher/help', icon: HelpCircle } },
    ],
  },
];

interface TeacherSidebarContentProps {
  teacher?: Teacher | null;
  onLogout: () => void;
}

export default function TeacherSidebarContent({ teacher, onLogout }: TeacherSidebarContentProps) {
  const pathname = usePathname();

  const teacherName = teacher
    ? teacher.first_name && teacher.last_name
      ? `${teacher.first_name} ${teacher.last_name}`
      : teacher.name || teacher.email?.split('@')[0] || 'Teacher'
    : 'Teacher';

  return (
    <PortalSidebar
      portalLabel="Teacher Portal"
      accent="amber"
      sections={SECTIONS}
      pathname={pathname}
      userName={teacherName}
      userSubtitle={teacher?.subjects || teacher?.subject || 'Teacher'}
      onLogout={onLogout}
    />
  );
}
