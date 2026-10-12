'use client';

import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Lock,
  LockOpen,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Period {
  id: string;
  schoolYear: string;
  quarter: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isGradingOpen: boolean;
  status: 'active' | 'ended' | 'upcoming';
}

const QUARTER_NAMES = ['', 'Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
const SEM_LABELS: Record<number, string> = { 1: '1st Sem', 2: '1st Sem', 3: '2nd Sem', 4: '2nd Sem' };

function fmt(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AcademicPeriodPage() {
  const [periods, setPeriods]         = useState<Period[]>([]);
  const [schoolYear, setSchoolYear]   = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [advancing, setAdvancing]     = useState(false);
  const [savingId, setSavingId]       = useState<number | null>(null);
  const [feedback, setFeedback]       = useState<{ ok: boolean; msg: string } | null>(null);
  const [editDates, setEditDates]     = useState<Record<number, { start: string; end: string }>>({});
  const [confirmAdvance, setConfirmAdvance] = useState(false);
  const [confirmEndYear, setConfirmEndYear] = useState(false);
  const [endingYear, setEndingYear]         = useState(false);
  const [noActiveSY, setNoActiveSY]         = useState(false);
  const [newSY, setNewSY]                   = useState('');
  const [startingYear, setStartingYear]     = useState(false);

  const activePeriod = periods.find(p => p.isActive);

  // The quarter the system is actually showing everyone right now, computed
  // from dates — may differ from `activePeriod` (the manually-toggled flag)
  // during the gap between two quarters.
  const effectivePeriod =
    periods.find(p => p.status === 'active') ??
    [...periods].reverse().find(p => p.status === 'ended');

  const load = async (sy?: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const url = sy ? `/api/admin/academic-periods?schoolYear=${encodeURIComponent(sy)}` : '/api/admin/academic-periods';
      const res  = await fetch(url);
      const data = await res.json() as { success: boolean; data?: Period[]; schoolYear?: string; error?: string };
      if (data.success) {
        setNoActiveSY(false);
        setPeriods(data.data ?? []);
        setSchoolYear(data.schoolYear ?? '');
        const initial: Record<number, { start: string; end: string }> = {};
        for (const p of (data.data ?? [])) {
          initial[p.quarter] = { start: p.startDate ?? '', end: p.endDate ?? '' };
        }
        setEditDates(initial);
      } else if (!data.success && (res.status === 404 || data.error?.includes('No active school year'))) {
        // No active school year — expected state after end-of-year
        setNoActiveSY(true);
        setPeriods([]);
        setSchoolYear('');
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to load periods' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSaveDates = async (quarter: number) => {
    const period = periods.find(p => p.quarter === quarter);
    if (!period) return;
    setSavingId(quarter);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/academic-periods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolYear: period.schoolYear,
          quarter,
          startDate: editDates[quarter]?.start || null,
          endDate:   editDates[quarter]?.end   || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ ok: true, msg: `${QUARTER_NAMES[quarter]} dates saved.` });
        load(schoolYear);
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to save' });
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleGrading = async (period: Period) => {
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/academic-periods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolYear:     period.schoolYear,
          quarter:        period.quarter,
          isGradingOpen:  !period.isGradingOpen,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ ok: true, msg: `Grade entry ${!period.isGradingOpen ? 'opened' : 'locked'} for ${QUARTER_NAMES[period.quarter]}.` });
        load(schoolYear);
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to update' });
      }
    } catch { /**/ }
  };

  const handleAdvance = async () => {
    if (!confirmAdvance) { setConfirmAdvance(true); return; }
    setAdvancing(true);
    setConfirmAdvance(false);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/academic-periods/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockGrading: true }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          ok: true,
          msg: `Advanced from ${QUARTER_NAMES[data.previous.quarter]} → ${QUARTER_NAMES[data.current.quarter]}. Grade entry for ${QUARTER_NAMES[data.previous.quarter]} has been locked.`,
        });
        load(schoolYear);
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to advance' });
      }
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message ?? 'Network error' });
    } finally {
      setAdvancing(false);
    }
  };

  const handleStartNewYear = async () => {
    if (!newSY.trim()) return;
    setStartingYear(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/academic-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolYear: newSY.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNoActiveSY(false);
        setNewSY('');
        load(data.schoolYear);
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to start school year' });
      }
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message ?? 'Network error' });
    } finally {
      setStartingYear(false);
    }
  };

  const handleEndSchoolYear = async () => {
    if (!confirmEndYear) { setConfirmEndYear(true); return; }
    setEndingYear(true);
    setConfirmEndYear(false);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/academic-periods/end-school-year', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFeedback({ ok: true, msg: data.message });
        load(schoolYear);
      } else {
        setFeedback({ ok: false, msg: data.error ?? 'Failed to end school year' });
      }
    } catch (e: any) {
      setFeedback({ ok: false, msg: e?.message ?? 'Network error' });
    } finally {
      setEndingYear(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  const nextQuarter = activePeriod && activePeriod.quarter < 4 ? activePeriod.quarter + 1 : null;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Academic Period
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage quarters for <span className="font-semibold text-gray-700">SY {schoolYear}</span>
          </p>
        </div>

        {/* Advance button */}
        {nextQuarter && (
          <div className="flex flex-col items-end gap-1">
            {confirmAdvance && (
              <p className="text-xs text-amber-600 font-medium">
                This will lock grade entry for {QUARTER_NAMES[activePeriod!.quarter]}. Click again to confirm.
              </p>
            )}
            <Button
              onClick={handleAdvance}
              disabled={advancing}
              className={`shrink-0 ${confirmAdvance ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary/90'} text-white`}
            >
              {advancing
                ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Advancing…</>
                : <><Zap className="w-3.5 h-3.5 mr-2" />
                    Advance to {QUARTER_NAMES[nextQuarter]}
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </>}
            </Button>
          </div>
        )}
        {activePeriod?.quarter === 4 && (
          <div className="flex flex-col items-end gap-1">
            {confirmEndYear && (
              <p className="text-xs text-red-600 font-medium text-right max-w-xs">
                This will unenroll ALL students and lock Q4. This cannot be undone. Click again to confirm.
              </p>
            )}
            <Button
              onClick={handleEndSchoolYear}
              disabled={endingYear}
              className={`shrink-0 ${confirmEndYear ? 'bg-red-600 hover:bg-red-700' : 'bg-red-800 hover:bg-red-700'} text-white`}
            >
              {endingYear
                ? <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Ending Year…</>
                : <><GraduationCap className="w-3.5 h-3.5 mr-2" />End School Year</>}
            </Button>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm ${
          feedback.ok
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.ok
            ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
            : <AlertCircle  className="w-4 h-4 mt-0.5 shrink-0 text-red-500"   />}
          {feedback.msg}
        </div>
      )}

      {/* No active school year — start a new one */}
      {noActiveSY && (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">No active school year</p>
            <p className="text-sm text-gray-500 mt-1">The previous school year has ended. Start a new one to re-open enrollment and grade entry.</p>
          </div>
          <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
            <input
              type="text"
              value={newSY}
              onChange={(e) => setNewSY(e.target.value)}
              placeholder="e.g. 2026-2027"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <Button
              onClick={handleStartNewYear}
              disabled={startingYear || !newSY.trim()}
              className="bg-primary hover:bg-primary/90 text-white shrink-0"
            >
              {startingYear
                ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Starting…</>
                : 'Start Year'}
            </Button>
          </div>
        </div>
      )}

      {/* Quarter cards */}
      {periods.length > 0 && (
        <div className="space-y-3">
          {periods.map(period => {
            const isEffective   = effectivePeriod?.quarter === period.quarter;
            const isLive        = isEffective && period.status === 'active';
            const isEndedGap    = isEffective && period.status === 'ended';
            const isPast        = !isEffective && period.status === 'ended';
            const isFuture      = period.status === 'upcoming';
            const isReadOnly    = period.status === 'ended';
            const dates         = editDates[period.quarter] ?? { start: '', end: '' };

            return (
              <div
                key={period.quarter}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                  isLive ? 'border-gray-900 ring-1 ring-gray-900/10'
                    : isEndedGap ? 'border-amber-400 ring-1 ring-amber-400/20'
                    : 'border-gray-200'
                }`}
              >
                {/* Quarter header */}
                <div className={`flex items-center justify-between px-5 py-3.5 ${isLive ? 'bg-gray-900' : isEndedGap ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      isLive ? 'bg-white text-gray-900'
                        : isEndedGap ? 'bg-amber-400 text-white'
                        : isPast ? 'bg-gray-300 text-gray-600'
                        : 'bg-white text-gray-400 border border-gray-200'
                    }`}>
                      Q{period.quarter}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isLive ? 'text-white' : isEndedGap ? 'text-amber-900' : 'text-gray-700'}`}>
                        {QUARTER_NAMES[period.quarter]}
                        <span className={`ml-2 text-[10px] font-medium uppercase tracking-wide ${isLive ? 'text-gray-300' : isEndedGap ? 'text-amber-600' : 'text-gray-400'}`}>
                          {SEM_LABELS[period.quarter]}
                        </span>
                      </p>
                      <p className={`text-xs ${isLive ? 'text-gray-400' : isEndedGap ? 'text-amber-700' : 'text-gray-400'}`}>
                        {fmt(period.startDate)} – {fmt(period.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Active
                      </span>
                    )}
                    {isEndedGap && (
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        Ended
                      </span>
                    )}
                    {isPast && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    )}
                    {isFuture && (
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Upcoming</span>
                    )}
                  </div>
                </div>

                {/* Quarter body */}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Date editors */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-400 whitespace-nowrap">Start</label>
                      <input
                        type="date"
                        value={dates.start}
                        onChange={e => setEditDates(prev => ({ ...prev, [period.quarter]: { ...prev[period.quarter], start: e.target.value } }))}
                        disabled={isReadOnly}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                    <span className="text-gray-300 text-xs">–</span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-gray-400 whitespace-nowrap">End</label>
                      <input
                        type="date"
                        value={dates.end}
                        onChange={e => setEditDates(prev => ({ ...prev, [period.quarter]: { ...prev[period.quarter], end: e.target.value } }))}
                        disabled={isReadOnly}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                    {!isReadOnly && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSaveDates(period.quarter)}
                        disabled={savingId === period.quarter}
                        className="h-7 text-xs px-2.5"
                      >
                        {savingId === period.quarter
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : 'Save'}
                      </Button>
                    )}
                  </div>

                  {/* Grade entry toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Grade entry
                    </span>
                    {isReadOnly ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-400">
                        {period.isGradingOpen
                          ? <><LockOpen className="w-3 h-3" /> Open</>
                          : <><Lock className="w-3 h-3" /> Locked</>}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleGrading(period)}
                        className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out ${
                          period.isGradingOpen
                            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {period.isGradingOpen
                          ? <><LockOpen className="w-3 h-3" /> Open</>
                          : <><Lock     className="w-3 h-3" /> Locked</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* Current-quarter hint */}
                {isLive && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      All modules (grades, attendance, dashboard) are currently showing <strong className="text-gray-600">{QUARTER_NAMES[period.quarter]}</strong> data.
                    </div>
                  </div>
                )}
                {isEndedGap && (
                  <div className="px-5 pb-4">
                    <div className="flex items-center gap-1.5 text-xs text-amber-700">
                      <Clock className="w-3.5 h-3.5" />
                      {QUARTER_NAMES[period.quarter]} ended on {fmt(period.endDate)}. No quarter is active yet — grade entry and enrollment are paused until the next quarter starts.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-xs text-gray-500 space-y-1.5">
        <p className="font-semibold text-gray-700 text-sm">How this works</p>
        <p>• <strong>Dates drive everything automatically.</strong> The quarter whose Start–End range includes today becomes active for the whole school the moment that date arrives — no button click needed.</p>
        <p>• <strong>Gap between quarters</strong> — if one quarter's dates have passed and the next one's haven't started yet, that quarter is shown as <strong className="text-amber-700">Ended</strong> everywhere (dashboards, grade entry, enrollment) until the next quarter's start date arrives.</p>
        <p>• <strong>Advance quarter</strong> is a manual override — only needed if a quarter has no dates set, or to correct a mistake. It has no effect on a quarter whose dates say otherwise.</p>
        <p>• <strong>Grade entry lock</strong> — when locked, teachers cannot submit or edit grades for that quarter. Approved grades remain visible.</p>
        <p>• <strong>Grade 11 and 12</strong> see Q1+Q2 as "1st Semester" and Q3+Q4 as "2nd Semester" in their dashboard.</p>
      </div>

    </div>
  );
}
