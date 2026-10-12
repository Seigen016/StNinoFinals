'use client';

import { useAuth } from '@/app/admin/hooks/useAuth';
import { PortalSidebar, type PortalNavSection } from '@/components/portal-sidebar';
import { useRefresh } from '@/lib/refresh-context';
import { supabase } from '@/lib/supabaseClient';
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  Layers,
  LayoutDashboard,
  List,
  Settings,
  User,
  UserRound,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/* ── Sidebar Content ────────────────────────────────────────── */
export const AdminSidebarContent = () => {
  const pathname = usePathname();
  const { admin } = useAuth();
  const { refreshKey } = useRefresh();
  const [pendingCounts, setPendingCounts] = useState({
    admissions: 0,
    enrollments: 0,
    grades: 0,
  });
  const [loggingOut, setLoggingOut] = useState(false);

  const adminName = admin
    ? admin.first_name && admin.last_name
      ? `${admin.first_name} ${admin.last_name}`
      : admin.name || admin.email?.split('@')[0] || 'Admin'
    : 'Admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      localStorage.removeItem('admin');
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch('/api/admin/pending-counts');
        const data = await res.json();
        if (data.success) setPendingCounts(data.counts);
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, [refreshKey]);

  const sections: PortalNavSection[] = [
    {
      entries: [
        { item: { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true } },
      ],
    },
    {
      label: 'People',
      entries: [
        {
          group: {
            label: 'User Management',
            icon: Users,
            children: [
              { label: 'Students', href: '/admin/students', icon: User },
              { label: 'Teachers', href: '/admin/teachers', icon: UserRound },
              { label: 'Guardians', href: '/admin/parents', icon: UserRound },
            ],
          },
        },
        {
          item: {
            label: 'Admissions',
            href: '/admin/admission',
            icon: List,
            badge: pendingCounts.admissions,
          },
        },
      ],
    },
    {
      label: 'Academics',
      entries: [
        { item: { label: 'Class List', href: '/admin/class-list', icon: Layers } },
        { item: { label: 'Subject Management', href: '/admin/classes', icon: BookOpen } },
        { item: { label: 'Sections', href: '/admin/sections', icon: Layers } },
        { item: { label: 'Rooms', href: '/admin/rooms', icon: DoorOpen } },
        {
          item: {
            label: 'Grade Approvals',
            href: '/admin/grades',
            icon: GraduationCap,
            badge: pendingCounts.grades,
          },
        },
        {
          item: {
            label: 'Enrollment',
            href: '/admin/enrollment',
            icon: ClipboardList,
            badge: pendingCounts.enrollments,
          },
        },
        { item: { label: 'Academic Period', href: '/admin/academic-period', icon: Calendar } },
        { item: { label: 'Enrollment History', href: '/admin/enrollment-history', icon: Archive } },
      ],
    },
    {
      label: 'Monitoring',
      entries: [
        { item: { label: 'Attendance', href: '/admin/attendance', icon: Calendar } },
        {
          group: {
            label: 'Reports & Analytics',
            icon: BarChart3,
            children: [
              { label: 'Overview', href: '/admin/reports', icon: BarChart3 },
              { label: 'Enrollment Report', href: '/admin/reports/population', icon: Users },
            ],
          },
        },
      ],
    },
    {
      label: 'System',
      entries: [
        { item: { label: 'Announcements', href: '/admin/announcements', icon: Bell } },
        { item: { label: 'Settings', href: '/admin/settings', icon: Settings } },
      ],
    },
  ];

  return (
    <PortalSidebar
      portalLabel="Admin Portal"
      accent="red"
      sections={sections}
      pathname={pathname}
      userName={adminName}
      userSubtitle="Administrator"
      onLogout={handleLogout}
      loggingOut={loggingOut}
    />
  );
};

const AdminSidebar = () => (
  <div className="hidden md:block w-56 h-full flex-shrink-0">
    <AdminSidebarContent />
  </div>
);

export default AdminSidebar;
