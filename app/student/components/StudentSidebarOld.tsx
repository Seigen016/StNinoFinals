'use client';

import {
  Calendar,
  FileText,
  GraduationCap,
  LayoutDashboard,
  User,
} from 'lucide-react';

type NavItem = 'dashboard' | 'enrollment' | 'schedule' | 'grades' | 'profile';

interface StudentSidebarContentOldProps {
  activeNav: NavItem;
  handleNavChange: (navId: NavItem) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'enrollment', label: 'Enrollment', icon: FileText },
  { id: 'schedule', label: 'Schedule Calendar', icon: Calendar },
  { id: 'grades', label: 'Grades & Reports', icon: GraduationCap },
  { id: 'profile', label: 'Profile', icon: User },
] as const;

export function StudentSidebarContentOld({
  activeNav,
  handleNavChange,
}: StudentSidebarContentOldProps) {
  return (
    <div className="bg-white w-full min-h-screen">
      <nav className="mt-6" role="navigation" aria-label="Student sections">
        <div className="px-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                className={`w-full flex items-center px-3 py-2.5 text-left text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isActive
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4 mr-3" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
