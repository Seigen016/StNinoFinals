'use client';

import { LiveAttendanceTab } from '@/components/admin/attendance/LiveAttendanceTab';
import { RfidDisplayTab } from '@/components/admin/attendance/RfidDisplayTab';
import { StudentAttendanceTab } from '@/components/admin/attendance/StudentAttendanceTab';
import { TeacherAttendanceTab } from '@/components/admin/attendance/TeacherAttendanceTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ArrowLeft, Monitor, Radio, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const VALID_TABS = ['live', 'rfid', 'student', 'teacher'] as const;
type TabValue = (typeof VALID_TABS)[number];

const TABS = [
  { value: 'live', label: 'Live Attendance', icon: Radio },
  { value: 'rfid', label: 'RFID Display', icon: Monitor },
  { value: 'student', label: 'Student Reports', icon: Users },
  { value: 'teacher', label: 'Teacher Reports', icon: UserCheck },
] satisfies { value: TabValue; label: string; icon: any }[];

function AttendancePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get('tab') ?? 'live';
  const activeTab: TabValue = (VALID_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as TabValue)
    : 'live';

  const handleTabChange = (value: string) => {
    router.replace(`/admin/attendance?tab=${value}`);
  };

  const activeTabMeta = TABS.find((t) => t.value === activeTab)!;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Sticky Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <Link href="/admin">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <div>
            <h1 className="text-sm font-semibold text-gray-900 leading-none">
              Attendance
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-none">
              Monitor and report student &amp; teacher attendance
            </p>
          </div>

          {/* Active tab pill shown on mobile */}
          <div className="ml-auto flex items-center gap-1.5 sm:hidden">
            <activeTabMeta.icon className="w-3.5 h-3.5 text-red-700" />
            <span className="text-xs font-medium text-red-700">
              {activeTabMeta.label}
            </span>
          </div>
        </div>
      </header>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tab bar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5 p-1.5">
            <TabsList className="w-full bg-transparent h-auto p-0 grid grid-cols-2 sm:grid-cols-4 gap-1">
              {TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-[color,background-color,box-shadow] duration-150 ease-out',
                    'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                    'data-[state=active]:bg-red-800 data-[state=active]:text-white data-[state=active]:shadow-sm'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content */}
          <TabsContent value="live" className="mt-0">
            <LiveAttendanceTab />
          </TabsContent>
          <TabsContent value="rfid" className="mt-0">
            <RfidDisplayTab />
          </TabsContent>
          <TabsContent value="student" className="mt-0">
            <StudentAttendanceTab />
          </TabsContent>
          <TabsContent value="teacher" className="mt-0">
            <TeacherAttendanceTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-9 h-9 border-2 border-red-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400">Loading attendance…</p>
          </div>
        </div>
      }
    >
      <AttendancePageContent />
    </Suspense>
  );
}
