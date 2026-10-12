'use client';

import { PortalSidebar, type PortalNavSection } from '@/components/portal-sidebar';
import type { ComponentType } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

interface Student {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  student_number?: string;
  [key: string]: any;
}

interface StudentSidebarContentProps {
  student: Student;
  navItems: readonly NavItem[];
  currentPath: string;
  onLogout: () => void;
}

export function StudentSidebarContent({
  student,
  navItems,
  currentPath,
  onLogout,
}: StudentSidebarContentProps) {
  const studentName =
    student.first_name && student.last_name
      ? `${student.first_name} ${student.last_name}`
      : student.email;

  const sections: PortalNavSection[] = [
    {
      entries: navItems.map((item) => ({
        item: {
          label: item.label,
          href: item.href,
          icon: item.icon,
          exact: item.href === '/student/dashboard',
        },
      })),
    },
  ];

  return (
    <PortalSidebar
      portalLabel="Student Portal"
      accent="blue"
      sections={sections}
      pathname={currentPath}
      userName={studentName}
      userSubtitle={student.student_number ? `#${student.student_number}` : 'Student'}
      onLogout={onLogout}
    />
  );
}
