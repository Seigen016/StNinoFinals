'use client';

import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Radio, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  scanTime: string;
  status: string;
  rfidCard: string;
  studentPhoto?: string;
  role?: string;
  scanType?: 'timein' | 'timeout' | null;
}

const SCAN_TYPE_META = {
  timein: {
    label: 'Time In',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  timeout: {
    label: 'Time Out',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
} as const;

const STATUS_META: Record<string, { bg: string; text: string; dot: string }> = {
  PR: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  LA: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  AC: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  EX: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
};
const getStatus = (code: string) =>
  STATUS_META[code] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  };

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function LiveAttendanceTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotlight, setSpotlight] = useState<AttendanceRecord | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastIdRef = useRef<string | null>(null);
  // No range = latest scans (live view). The query is mirrored in a ref because
  // the polling interval and realtime callback keep the first closure.
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const rangeQueryRef = useRef('');

  const fetchToday = async () => {
    const rangeQuery = rangeQueryRef.current;
    try {
      const res = await fetch(
        rangeQuery ? `/api/admin/attendance-live?limit=1000&${rangeQuery}` : '/api/admin/attendance-live?limit=50'
      );
      const result = await res.json();
      if (rangeQueryRef.current !== rangeQuery) return; // filter changed while loading
      if (result.success && result.records) {
        setRecords(result.records);
        // Only spotlight new scans in the live view, not when browsing a range
        if (!rangeQuery && result.records.length > 0) {
          const newest = result.records[0];
          if (lastIdRef.current !== newest.id) {
            lastIdRef.current = newest.id;
            pin(newest);
          }
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const pin = (record: AttendanceRecord) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSpotlight(record);
    timerRef.current = setTimeout(() => setSpotlight(null), 10000);
  };

  useEffect(() => {
    fetchToday();
    const channel = supabase
      .channel('live-attendance-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance_records' },
        fetchToday
      )
      .subscribe();
    const interval = setInterval(fetchToday, 5000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const applyRange = (next: DateRange | undefined) => {
    rangeQueryRef.current = next?.from
      ? `startDate=${format(next.from, 'yyyy-MM-dd')}&endDate=${format(next.to ?? next.from, 'yyyy-MM-dd')}`
      : '';
    setRange(next?.from ? next : undefined);
    setIsPickerOpen(false);
    setLoading(true);
    fetchToday();
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatFullDate = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
      {/* ── Scan List ─────────────────────────────────────────── */}
      <div className="md:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        {/* List header */}
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-gray-800">Scan History</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {records.length} records{range ? '' : ' · latest'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Popover open={isPickerOpen} onOpenChange={(o) => { setIsPickerOpen(o); if (o) setTempRange(range); }} modal>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-gray-700 bg-white border border-gray-300 hover:border-red-700 rounded-lg transition-colors">
                  <CalendarIcon className="w-3 h-3" />
                  {range?.from
                    ? range.to && range.to.getTime() !== range.from.getTime()
                      ? `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`
                      : format(range.from, 'MMM d, yyyy')
                    : 'Latest'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={tempRange?.from || range?.from}
                  selected={tempRange}
                  onSelect={setTempRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
                <div className="p-3 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setIsPickerOpen(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 text-xs bg-red-800 hover:bg-red-900" onClick={() => applyRange(tempRange)} disabled={!tempRange?.from}>Apply</Button>
                </div>
              </PopoverContent>
            </Popover>
            {range && (
              <button
                type="button"
                onClick={() => applyRange(undefined)}
                className="text-[10px] text-gray-400 hover:text-gray-700 px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scroll area */}
        <div
          className="flex-1 overflow-y-auto p-3 space-y-1.5"
          style={{ maxHeight: '65vh' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-red-800 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10">
              <Radio className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">{range ? 'No scans in this date range' : 'No scans yet'}</p>
            </div>
          ) : (
            records.map((rec, i) => {
              const meta = getStatus(rec.status);
              const isSpotlit = spotlight?.id === rec.id;
              return (
                <button
                  key={rec.id}
                  onClick={() => pin(rec)}
                  className={cn(
                    'w-full text-left rounded-xl px-3 py-2.5 transition-all border',
                    isSpotlit
                      ? 'bg-red-50 border-red-200 shadow-sm'
                      : 'bg-gray-50/60 border-transparent hover:bg-gray-100 hover:border-gray-200'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                        isSpotlit
                          ? 'bg-red-200 text-red-800'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {initials(rec.studentName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">
                        {rec.studentName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {rec.gradeLevel} · {rec.section}
                      </p>
                    </div>
                    {i === 0 && !range && (
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {rec.scanType && SCAN_TYPE_META[rec.scanType] ? (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1',
                          SCAN_TYPE_META[rec.scanType].bg,
                          SCAN_TYPE_META[rec.scanType].text
                        )}
                      >
                        <span
                          className={cn(
                            'w-1.5 h-1.5 rounded-full inline-block',
                            SCAN_TYPE_META[rec.scanType].dot
                          )}
                        />
                        {SCAN_TYPE_META[rec.scanType].label}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          meta.bg,
                          meta.text
                        )}
                      >
                        {rec.status}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500 font-medium">
                      {new Date(rec.scanTime).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {formatTime(rec.scanTime)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Spotlight Panel ───────────────────────────────────── */}
      <div className="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-xs font-semibold text-gray-800">
              User Information
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Displays 10s after new scan · click any record to inspect
            </p>
          </div>
          {spotlight && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700">
                Active scan
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          {spotlight ? (
            <div className="w-full max-w-lg">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {spotlight.studentPhoto ? (
                    <Image
                      src={spotlight.studentPhoto}
                      alt={spotlight.studentName}
                      width={140}
                      height={140}
                      className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-md border-4 border-white ring-2 ring-red-100"
                    />
                  ) : (
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-red-50 border-4 border-white ring-2 ring-red-100 shadow-md flex items-center justify-center">
                      <span className="text-4xl font-bold text-red-300">
                        {initials(spotlight.studentName)}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow">
                    <Radio className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 text-center sm:text-left space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {spotlight.studentName}
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {spotlight.role === 'teacher'
                        ? 'Employee No.'
                        : 'Student ID'}
                      : {spotlight.studentId}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          Grade
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {spotlight.gradeLevel || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                          Section
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        {spotlight.section || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[10px] font-semibold text-red-700 uppercase tracking-wide">
                        Scan Time
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatTime(spotlight.scanTime)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFullDate(spotlight.scanTime)}
                    </p>
                    <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between">
                      {spotlight.scanType &&
                      SCAN_TYPE_META[spotlight.scanType] ? (
                        <span
                          className={cn(
                            'text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5',
                            SCAN_TYPE_META[spotlight.scanType].bg,
                            SCAN_TYPE_META[spotlight.scanType].text
                          )}
                        >
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              SCAN_TYPE_META[spotlight.scanType].dot
                            )}
                          />
                          {SCAN_TYPE_META[spotlight.scanType].label}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'text-xs font-bold px-2.5 py-1 rounded-full',
                            getStatus(spotlight.status).bg,
                            getStatus(spotlight.status).text
                          )}
                        >
                          {spotlight.status}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono">
                        {spotlight.rfidCard}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Radio className="w-7 h-7 text-gray-300 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                Waiting for RFID scan…
              </p>
              <p className="text-xs text-gray-400">
                Student information will appear here when scanned
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
