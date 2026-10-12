'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { useAlert } from '@/lib/use-alert';
import { cn } from '@/lib/utils';
import { AlertTriangle, LogIn, LogOut, Radio, RefreshCw, User } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface SecurityAlert {
  rfidTag: string;
  strikes: number;
  occurredAt: string;
}

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
  scanType?: 'timein' | 'timeout' | null;
  timeIn?: string | null;
  timeOut?: string | null;
  isTeacher?: boolean;
  subject?: string;
  role?: string;
}

type FilterType = 'all' | 'timein' | 'timeout';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export function RfidDisplayTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [latestScan, setLatestScan] = useState<AttendanceRecord | null>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [timeoutModeActive, setTimeoutModeActive] = useState(false);
  const [timeoutCountdown, setTimeoutCountdown] = useState(0);
  const [securityAlert, setSecurityAlert] = useState<SecurityAlert | null>(null);
  const { showAlert } = useAlert();

  const fetchLive = useCallback(async (onlyNew = false) => {
    setLoadingAttendance(true);
    try {
      const url = onlyNew && lastScanTime
        ? `/api/admin/attendance-live?since=${encodeURIComponent(lastScanTime)}&limit=1`
        : `/api/admin/attendance-live?limit=1`;
      const res = await fetch(url);
      if (!res.ok) return;
      const ct = res.headers.get('content-type');
      if (!ct?.includes('application/json')) return;
      const result = await res.json();
      if (result.success && result.records?.length > 0) {
        const latest = result.records[0];
        setLatestScan((prev) => {
          const isNew = !prev || latest.id !== prev.id || latest.scanTime !== prev.scanTime;
          return isNew ? latest : prev;
        });
        setRecords((prev) => {
          const exists = prev.some((p) => p.id === latest.id);
          return exists
            ? prev.map((p) => (p.id === latest.id ? latest : p))
            : [latest, ...prev].slice(0, 50);
        });
        setLastScanTime(latest.scanTime);
      }
    } catch { /* silent */ } finally {
      setLoadingAttendance(false);
    }
  }, [lastScanTime]);

  useEffect(() => { fetchLive(false); }, [fetchLive]);
  useEffect(() => {
    if (latestScan) {
      const t = setTimeout(() => setLatestScan(null), 10000);
      return () => clearTimeout(t);
    }
  }, [latestScan]);
  useEffect(() => {
    const ch = supabase
      .channel('rfid-attendance-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, () => fetchLive(false))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchLive]);
  useEffect(() => {
    const iv = setInterval(() => fetchLive(true), 10000);
    return () => clearInterval(iv);
  }, [fetchLive]);

  // Security alert subscription
  useEffect(() => {
    const ch = supabase
      .channel('rfid-tab-security')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'security_events' }, (payload: any) => {
        const row = payload.new;
        if (row?.event_type === 'three_strike_alert') {
          setSecurityAlert({ rfidTag: row.rfid_tag, strikes: row.metadata?.strike_count ?? 3, occurredAt: row.occurred_at });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const enableTimeoutMode = async () => {
    try {
      const res = await fetch('/api/admin/attendance-live', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable-timeout' }),
      });
      const result = await res.json();
      if (result.success) {
        setTimeoutModeActive(true);
        setTimeoutCountdown(5);
        const iv = setInterval(() => {
          setTimeoutCountdown((p) => {
            if (p <= 1) { clearInterval(iv); setTimeoutModeActive(false); return 0; }
            return p - 1;
          });
        }, 1000);
      } else {
        showAlert({ message: 'Failed to enable timeout mode.', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Error enabling timeout mode.', type: 'error' });
    }
  };

  const filtered = useMemo(() =>
    filterType === 'all' ? records : records.filter((r) => r.scanType === filterType),
    [records, filterType]
  );

  return (
    <div className="bg-gray-950 text-white rounded-2xl overflow-hidden">

      {/* ── Top Bar ───────────────────────────────────────────── */}
      <div className="border-b border-white/10 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Left: title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <Radio className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-none">RFID Scan Display</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Live attendance monitoring</p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {/* Filter toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
            {([
              { val: 'all',     label: 'All' },
              { val: 'timein',  label: 'In',  icon: LogIn  },
              { val: 'timeout', label: 'Out', icon: LogOut },
            ] as const).map(({ val, label, icon: Icon }) => (
              <button
                key={val}
                onClick={() => setFilterType(val)}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                  filterType === val
                    ? val === 'timein'  ? 'bg-emerald-600 text-white'
                    : val === 'timeout' ? 'bg-orange-500 text-white'
                    : 'bg-white/15 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>

          {/* Clock */}
          <div className="text-right px-2">
            <p className="text-[10px] text-gray-500">Current Time</p>
            <p className="text-sm font-mono font-semibold text-white" suppressHydrationWarning>
              {currentTime || '--:--:--'}
            </p>
          </div>

          {/* Timeout mode */}
          <button
            onClick={enableTimeoutMode}
            disabled={timeoutModeActive}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
              timeoutModeActive
                ? 'bg-orange-500/80 text-white cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            {timeoutModeActive ? `Time Out: ${timeoutCountdown}s` : 'Record Time Out (5s)'}
          </button>

          {/* Refresh */}
          <button
            onClick={() => fetchLive(false)}
            disabled={loadingAttendance}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loadingAttendance && 'animate-spin')} />
            Refresh
          </button>

          {/* Test Alert */}
          <button
            onClick={async () => {
              const res = await fetch('/api/admin/test-security-alert', { method: 'POST' });
              const data = await res.json();
              if (!data.success) showAlert({ message: data.error, type: 'error' });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/60 hover:bg-red-950 border border-red-800/50 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Test Alert
          </button>
        </div>
      </div>

      {/* ── Main Display ──────────────────────────────────────── */}
      <div className="p-6 min-h-[400px] flex items-center justify-center">
        {latestScan ? (
          <div className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-8">

              {/* Photo */}
              <div className="relative flex-shrink-0">
                {latestScan.studentPhoto ? (
                  <Image
                    src={latestScan.studentPhoto}
                    alt={latestScan.studentName || 'Person'}
                    width={180}
                    height={180}
                    className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl object-cover shadow-2xl border-4 border-white/10 ring-2 ring-red-500/40"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-2xl bg-white/5 border-4 border-white/10 ring-2 ring-red-500/40 shadow-2xl flex items-center justify-center">
                    <span className="text-5xl font-bold text-white/20">{initials(latestScan.studentName || '?')}</span>
                  </div>
                )}
                {/* Scan type badge */}
                <div className={cn(
                  'absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap border border-white/20',
                  latestScan.scanType === 'timein'  ? 'bg-emerald-600 text-white'
                  : latestScan.scanType === 'timeout' ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-200'
                )}>
                  {latestScan.scanType === 'timein' ? '↑ TIME IN'
                    : latestScan.scanType === 'timeout' ? '↓ TIME OUT'
                    : 'SCANNED'}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 space-y-5 text-center sm:text-left mt-4 sm:mt-0">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Name</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                    {latestScan.studentName || 'Unknown'}
                  </h2>
                </div>

                {!latestScan.isTeacher ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Grade Level', value: latestScan.gradeLevel || 'N/A' },
                      { label: 'Section',     value: latestScan.section || 'N/A'     },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
                        <p className="text-lg font-bold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Subject</p>
                    <p className="text-lg font-bold text-white">{latestScan.subject || 'N/A'}</p>
                  </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Scan Time</p>
                  <p className="text-2xl font-bold text-white font-mono">{fmtTime(latestScan.scanTime)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(latestScan.scanTime)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10">
              <Radio className="w-8 h-8 text-gray-600 animate-pulse" />
            </div>
            <p className="text-base text-gray-400 font-medium">Waiting for RFID scan…</p>
            <p className="text-xs text-gray-600">Scan an RFID card to see the latest attendance record</p>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="border-t border-white/10 px-6 py-2.5 flex items-center justify-between">
          <p className="text-[11px] text-gray-600">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} loaded
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[11px] text-gray-600">Real-time via Supabase</p>
          </div>
        </div>
      )}

      {/* Three-Strike Security Alert */}
      <Dialog open={!!securityAlert} onOpenChange={(open) => { if (!open) setSecurityAlert(null); }}>
        <DialogContent className="max-w-md border-2 border-red-600 bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400 text-xl">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              SECURITY ALERT
            </DialogTitle>
            <DialogDescription className="text-red-300 font-medium">
              3 consecutive unauthorized RFID scan attempts detected!
            </DialogDescription>
          </DialogHeader>
          {securityAlert && (
            <div className="space-y-4 pt-2">
              <div className="bg-red-950 border border-red-700 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">RFID Tag</span>
                  <span className="font-mono font-bold text-red-300">{securityAlert.rfidTag}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Attempts</span>
                  <span className="font-bold text-red-400">{securityAlert.strikes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Time</span>
                  <span className="text-white">
                    {new Date(securityAlert.occurredAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                  </span>
                </div>
              </div>
              <button
                className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
                onClick={() => setSecurityAlert(null)}
              >
                Acknowledge &amp; Dismiss
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
