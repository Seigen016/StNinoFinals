'use client';

import { cn } from '@/lib/utils';
import { FileText, GraduationCap, LayoutDashboard, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface GuardianSidebarContentProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'enrollment', label: 'Enrollment',      icon: FileText         },
  { id: 'grades',     label: 'Grades & Reports', icon: GraduationCap  },
  { id: 'profile',    label: 'Profile',          icon: User            },
] as const;

export function GuardianSidebarContent({
  activeNav,
  setActiveNav,
}: GuardianSidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 overflow-hidden">

      {/* Branding */}
      <Link href="/" className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 flex-shrink-0 hover:bg-gray-50 transition-colors">
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-red-100">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-800 truncate leading-tight">
            St. Niño de Praga
          </p>
          <p className="text-[10px] text-gray-400 leading-none mt-0.5">
            Guardian Portal
          </p>
        </div>
      </Link>

      {/* Section label */}
      <p className="px-4 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 select-none">
        Navigation
      </p>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={cn(
                'group relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left',
                active
                  ? 'bg-red-50 text-red-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
              )}
            >
              {active && (
                <span className="absolute left-0 w-0.5 h-5 bg-red-500 rounded-full" />
              )}
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  active ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500',
                )}
              />
              <span className="flex-1 truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-red-600" />
          </div>
          <span className="text-xs text-gray-400 truncate">Guardian</span>
        </div>
      </div>
    </div>
  );
}
