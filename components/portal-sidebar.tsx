'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType } from 'react';
import { useState } from 'react';

type IconType = ComponentType<{ className?: string }>;

export interface PortalNavItem {
  label: string;
  href: string;
  icon: IconType;
  badge?: number;
  exact?: boolean;
}

export interface PortalNavGroup {
  label: string;
  icon: IconType;
  children: PortalNavItem[];
}

export type PortalNavEntry =
  | { item: PortalNavItem; group?: undefined }
  | { group: PortalNavGroup; item?: undefined };

export interface PortalNavSection {
  label?: string;
  entries: PortalNavEntry[];
}

const ACCENTS = {
  red: { bar: 'bg-red-500', avatarBg: 'bg-red-800/60', avatarText: 'text-red-300' },
  amber: { bar: 'bg-amber-400', avatarBg: 'bg-amber-700/40', avatarText: 'text-amber-300' },
  blue: { bar: 'bg-blue-400', avatarBg: 'bg-blue-700/50', avatarText: 'text-blue-200' },
} as const;

export type PortalAccent = keyof typeof ACCENTS;

function isActive(item: PortalNavItem, pathname: string) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/');
}

function NavLink({
  item,
  pathname,
  accentBar,
}: {
  item: PortalNavItem;
  pathname: string;
  accentBar: string;
}) {
  const active = isActive(item, pathname);
  return (
    <Link href={item.href}>
      <span
        className={cn(
          'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        )}
      >
        {active && (
          <span className={cn('absolute left-0 w-0.5 h-5 rounded-full', accentBar)} />
        )}
        <item.icon
          className={cn(
            'w-4 h-4 flex-shrink-0',
            active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'
          )}
        />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </span>
    </Link>
  );
}

function NavGroup({
  group,
  pathname,
  accentBar,
}: {
  group: PortalNavGroup;
  pathname: string;
  accentBar: string;
}) {
  const hasActive = group.children.some((c) => isActive(c, pathname));
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
          hasActive ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
        )}
      >
        <group.icon
          className={cn('w-4 h-4 flex-shrink-0', hasActive ? 'text-white' : 'text-gray-500')}
        />
        <span className="flex-1 text-left truncate">{group.label}</span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-gray-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
          {group.children.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} accentBar={accentBar} />
          ))}
        </div>
      )}
    </div>
  );
}

export interface PortalSidebarProps {
  portalLabel: string;
  accent: PortalAccent;
  sections: PortalNavSection[];
  pathname: string;
  userName: string;
  userSubtitle: string;
  onLogout: () => void;
  loggingOut?: boolean;
}

export function PortalSidebar({
  portalLabel,
  accent,
  sections,
  pathname,
  userName,
  userSubtitle,
  onLogout,
  loggingOut,
}: PortalSidebarProps) {
  const { bar, avatarBg, avatarText } = ACCENTS[accent];
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col h-full bg-sidebar overflow-hidden">
      {/* Branding */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 py-5 border-b border-white/5 flex-shrink-0 hover:bg-white/5 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
          <Image
            src="/logo.png"
            alt="Logo"
            width={36}
            height={36}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate leading-tight">
            St. Niño de Praga
          </p>
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">{portalLabel}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 relative">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600 select-none">
                {section.label}
              </p>
            )}
            {section.entries.map((entry, j) =>
              entry.item ? (
                <NavLink key={entry.item.href} item={entry.item} pathname={pathname} accentBar={bar} />
              ) : (
                <NavGroup key={j} group={entry.group} pathname={pathname} accentBar={bar} />
              )
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
              avatarBg
            )}
          >
            <span className={cn('text-[11px] font-bold', avatarText)}>{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">{userName}</p>
            <p className="text-[10px] text-gray-600 leading-none mt-0.5">{userSubtitle}</p>
          </div>
          <button
            onClick={onLogout}
            disabled={loggingOut}
            title="Logout"
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
