'use client';

import { Button } from '@/components/ui/button';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import {
  ArrowLeft,
  CalendarIcon,
  CheckCircle2,
  RefreshCw,
  Search,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';

interface Student {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  dailyAttendance: Record<string, string>;
  records: any[];
}

interface AttendanceReportsData {
  general: {
    totalStudents: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalDays: number;
    presentPercentage: number;
    absentPercentage: number;
  };
  students: Student[];
  selectedStudent: Student | null;
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    gradeLevels: string[];
    sections: string[];
  };
}

const CODE_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PR: { label: 'Time In / Time Out', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  AC: { label: 'Absent',       bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
  LA: { label: 'Late',         bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  EX: { label: 'Excused',      bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  HO: { label: 'Holiday',      bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400'    },
  EA: { label: 'Early Absent', bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  DA: { label: 'Day Absent',   bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-400'     },
  SU: { label: 'Suspended',    bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-700'    },
  VA: { label: 'Vacation',     bg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-400'     },
  CR: { label: 'Credit',       bg: 'bg-purple-100',  text: 'text-purple-700',  dot: 'bg-purple-400'  },
};

const getCodeMeta = (code: string) =>
  CODE_META[code] ?? { label: code, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AttendanceReportsPage() {
  const [data, setData] = useState<AttendanceReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<string>('all');
  const [section, setSection] = useState<string>('all');
  const [dailySearch, setDailySearch] = useState<string>('');

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ from: start, to: end });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateRange?.from) {
        const y = dateRange.from.getFullYear();
        const m = String(dateRange.from.getMonth() + 1).padStart(2, '0');
        const d = String(dateRange.from.getDate()).padStart(2, '0');
        params.append('startDate', `${y}-${m}-${d}`);
      }
      if (dateRange?.to) {
        const y = dateRange.to.getFullYear();
        const m = String(dateRange.to.getMonth() + 1).padStart(2, '0');
        const d = String(dateRange.to.getDate()).padStart(2, '0');
        params.append('endDate', `${y}-${m}-${d}`);
      }
      if (selectedStudentId) params.append('studentId', selectedStudentId);
      if (gradeLevel && gradeLevel !== 'all') params.append('gradeLevel', gradeLevel);
      if (section && section !== 'all') params.append('section', section);

      const response = await fetch(`/api/admin/attendance-reports?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        setError(null);
        if (!selectedStudentId && result.data.students.length > 0) {
          setSelectedStudentId(result.data.students[0].studentId);
        }
      } else {
        setError(result.error || 'Failed to fetch attendance data');
        setData(null);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred while fetching attendance data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) fetchData();
  }, [dateRange, selectedStudentId, gradeLevel, section]);

  const selectedStudent = useMemo(() => {
    if (!data || !selectedStudentId) return null;
    return data.students.find((s) => s.studentId === selectedStudentId) || data.selectedStudent;
  }, [data, selectedStudentId]);

  const dateColumns = useMemo(() => {
    if (!data) return [];
    const dates: string[] = [];
    const start = new Date(data.dateRange.start);
    const end = new Date(data.dateRange.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    return dates;
  }, [data]);

  const attendanceBreakdown = useMemo(() => {
    if (!selectedStudent) return null;
    const breakdown: Record<string, number> = {};
    Object.values(selectedStudent.dailyAttendance).forEach((code) => {
      breakdown[code] = (breakdown[code] || 0) + 1;
    });
    return breakdown;
  }, [selectedStudent]);

  const exportToExcel = async () => {
    if (!data || !data.students.length) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'end';
    await downloadExcel(`attendance-${fromStr}-to-${toStr}`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'STUDENT ATTENDANCE REPORT',
        `Period: ${fromStr} to ${toStr}`,
        `Generated: ${generated}`,
      ],
      columns: ['#', 'Name', 'Grade', 'Section', 'Total Days', 'Time In', 'Absent', 'Late', 'Excused', '%',
        ...dateColumns.map((d) => format(new Date(d), 'MM/dd'))],
      colWidths: [6, 32, 16, 16, 14, 12, 12, 10, 12, 10, ...dateColumns.map(() => 10)],
      rows: data.students.map((s, i) => [
        i + 1, s.studentName, s.gradeLevel, s.section,
        s.totalDays, s.present, s.absent, s.late, s.excused,
        `${s.percentage}%`, ...dateColumns.map((d) => s.dailyAttendance[d] || '-'),
      ]),
      headerColor: 'red',
    });
  };

  const exportToPDF = () => {
    if (!data || !data.students.length) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
    const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : 'end';

    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.', 148.5, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text('STUDENT ATTENDANCE REPORT', 148.5, 21, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${fromStr} to ${toStr}`, 148.5, 27, { align: 'center' });
    doc.text(`Generated: ${generated}`, 148.5, 32, { align: 'center' });

    autoTable(doc, {
      startY: 38,
      head: [['#', 'Student Name', 'Grade', 'Section', 'Total Days', 'Time In', 'Absent', 'Late', 'Excused', '%']],
      body: data.students.map((s, i) => [i + 1, s.studentName, s.gradeLevel, s.section, s.totalDays, s.present, s.absent, s.late, s.excused, `${s.percentage}%`]),
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' }, 9: { halign: 'center' } },
      margin: { left: 15, right: 15 },
    });

    doc.save(`attendance-${fromStr}-to-${toStr}.pdf`);
  };

  /* ─── Loading skeleton ──────────────────────────────────────── */
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-2 border-red-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading attendance data…</p>
        </div>
      </div>
    );
  }

  /* ─── Page ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* ── Sticky Header ───────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">Attendance Reports</h1>
              {data && (
                <p className="text-[11px] text-gray-400 truncate leading-none mt-0.5">
                  {dateRange?.from && dateRange?.to &&
                    `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`}
                  {data.general.totalStudents > 0 && ` · ${data.general.totalStudents} students`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg active:scale-95 transition-[background-color,transform] duration-150 ease-out disabled:opacity-50"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
            {data && data.students.length > 0 && (
              <ExportDropdown onPDF={exportToPDF} onExcel={exportToExcel} size="sm" />
            )}
          </div>
        </div>
      </header>

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center gap-2 flex-wrap">
          {/* Quick chips */}
          {[
            {
              label: 'This Week',
              fn: () =>
                setDateRange({
                  from: startOfWeek(new Date(), { weekStartsOn: 1 }),
                  to: endOfWeek(new Date(), { weekStartsOn: 1 }),
                }),
            },
            {
              label: 'Last Week',
              fn: () => {
                const lw = subWeeks(new Date(), 1);
                setDateRange({
                  from: startOfWeek(lw, { weekStartsOn: 1 }),
                  to: endOfWeek(lw, { weekStartsOn: 1 }),
                });
              },
            },
            {
              label: 'Last 30 Days',
              fn: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setDateRange({ from: start, to: end });
              },
            },
          ].map(({ label, fn }) => (
            <button
              key={label}
              onClick={fn}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:border-red-700 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-[color,background-color,border-color,transform] duration-150 ease-out"
            >
              {label}
            </button>
          ))}

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Date range picker */}
          <Popover
            open={isDatePickerOpen}
            onOpenChange={(open) => {
              setIsDatePickerOpen(open);
              if (open) setTempDateRange(dateRange);
            }}
            modal={true}
          >
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg active:scale-95 transition-[color,background-color,border-color,transform] duration-150 ease-out',
                  dateRange?.from
                    ? 'text-gray-700 bg-white border-gray-300 hover:border-red-700'
                    : 'text-gray-400 bg-gray-50 border-gray-200'
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
                    : format(dateRange.from, 'MMM d, yyyy')
                  : 'Select date range'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                defaultMonth={tempDateRange?.from || dateRange?.from}
                selected={tempDateRange}
                onSelect={setTempDateRange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setTempDateRange(dateRange);
                    setIsDatePickerOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-red-800 hover:bg-red-900"
                  onClick={() => {
                    if (tempDateRange?.from && tempDateRange?.to) {
                      setDateRange(tempDateRange);
                      setIsDatePickerOpen(false);
                    }
                  }}
                  disabled={!tempDateRange?.from || !tempDateRange?.to}
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Grade Level */}
          <Select value={gradeLevel} onValueChange={setGradeLevel}>
            <SelectTrigger className="h-8 text-xs w-36 border-gray-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {data?.filters.gradeLevels.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Section */}
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="h-8 text-xs w-36 border-gray-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {data?.filters.sections.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-5">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Error loading data</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 active:scale-95 transition-[background-color,transform] duration-150 ease-out"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!error && (!data || data.students.length === 0) && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-600">No attendance records found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Students appear here once they scan their RFID cards. Try adjusting the date range or filters.
            </p>
          </div>
        )}

        {data && data.students.length > 0 && (
          <>
            {/* ── KPI Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Students */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Students</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 leading-none">{data.general.totalStudents}</p>
                <p className="text-xs text-gray-400 mt-2">{dateColumns.length} school days tracked</p>
              </div>

              {/* Present */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Attendance Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-emerald-600 leading-none">
                  {data.general.presentPercentage.toFixed(1)}%
                </p>
                <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${data.general.presentPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{data.general.totalPresent} records</p>
              </div>

              {/* Absent */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Absent Rate</span>
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                </div>
                <p className="text-4xl font-bold text-red-600 leading-none">
                  {data.general.absentPercentage.toFixed(1)}%
                </p>
                <div className="mt-2.5 w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${data.general.absentPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">{data.general.totalAbsent} records</p>
              </div>

            </div>

            {/* ── Top Performers + Student Detail ───────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

              {/* Leaderboard */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-gray-900">Top Performers</h2>
                  <span className="ml-auto text-xs text-gray-400">Ranked by attendance rate</span>
                </div>
                <div className="p-5 space-y-2.5">
                  {data.students
                    .slice()
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 8)
                    .map((student, index) => (
                      <div
                        key={student.studentId}
                        className={cn(
                          'flex items-center gap-3 rounded-xl px-4 py-3 transition-[background-color] duration-150 ease-out cursor-pointer group',
                          index === 0 && 'bg-amber-50 hover:bg-amber-100/70',
                          index === 1 && 'bg-slate-50 hover:bg-slate-100/70',
                          index === 2 && 'bg-orange-50 hover:bg-orange-100/70',
                          index >= 3 && 'hover:bg-gray-50',
                          selectedStudentId === student.studentId && index >= 3 && 'bg-red-50',
                        )}
                        onClick={() => setSelectedStudentId(student.studentId)}
                      >
                        {/* Rank badge */}
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm',
                            index === 0 && 'bg-amber-400 text-white',
                            index === 1 && 'bg-slate-400 text-white',
                            index === 2 && 'bg-orange-400 text-white',
                            index >= 3 && 'bg-gray-200 text-gray-600'
                          )}
                        >
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                            index === 0 && 'bg-amber-200 text-amber-800',
                            index === 1 && 'bg-slate-200 text-slate-700',
                            index === 2 && 'bg-orange-200 text-orange-800',
                            index >= 3 && 'bg-red-100 text-red-800'
                          )}
                        >
                          {initials(student.studentName)}
                        </div>

                        {/* Name + grade */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{student.studentName}</p>
                          <p className="text-[10px] text-gray-400">{student.gradeLevel} · {student.section}</p>
                        </div>

                        {/* Progress bar */}
                        <div className="hidden sm:flex items-center gap-2 w-32 flex-shrink-0">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={cn(
                                'h-1.5 rounded-full transition-[width] duration-500 ease-out',
                                student.percentage >= 90 ? 'bg-emerald-500' :
                                student.percentage >= 75 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${student.percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Percentage */}
                        <span
                          className={cn(
                            'text-sm font-bold flex-shrink-0 w-12 text-right',
                            student.percentage >= 90 ? 'text-emerald-600' :
                            student.percentage >= 75 ? 'text-amber-600' : 'text-red-600'
                          )}
                        >
                          {student.percentage}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Student Detail Panel */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Student Detail</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Click any student to inspect</p>
                </div>

                {selectedStudent ? (
                  <div className="p-5 space-y-5">
                    {/* Student header */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-sm font-bold text-red-800 flex-shrink-0">
                        {initials(selectedStudent.studentName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-tight truncate">
                          {selectedStudent.studentName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {selectedStudent.gradeLevel} · {selectedStudent.section}
                        </p>
                      </div>
                    </div>

                    {/* Mini KPIs */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Days',    value: selectedStudent.totalDays,  color: 'text-gray-800' },
                        { label: 'Time In', value: selectedStudent.present,    color: 'text-emerald-600' },
                        { label: 'Absent',  value: selectedStudent.absent,     color: 'text-red-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
                          <p className={cn('text-lg font-bold leading-none', color)}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Attendance rate ring / bar */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">Attendance Rate</span>
                        <span className={cn(
                          'text-sm font-bold',
                          selectedStudent.percentage >= 90 ? 'text-emerald-600' :
                          selectedStudent.percentage >= 75 ? 'text-amber-600' : 'text-red-600'
                        )}>
                          {selectedStudent.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full transition-[width] duration-700 ease-out',
                            selectedStudent.percentage >= 90 ? 'bg-emerald-500' :
                            selectedStudent.percentage >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${selectedStudent.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown */}
                    {attendanceBreakdown && Object.keys(attendanceBreakdown).length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                          Code Breakdown
                        </p>
                        <div className="space-y-1.5">
                          {Object.entries(attendanceBreakdown)
                            .sort(([, a], [, b]) => b - a)
                            .map(([code, count]) => {
                              const meta = getCodeMeta(code);
                              return (
                                <div key={code} className="flex items-center gap-2">
                                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', meta.dot)} />
                                  <span className="text-xs text-gray-600 flex-1 truncate">{meta.label}</span>
                                  <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md', meta.bg, meta.text)}>
                                    {count}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-xs">Select a student from the table or leaderboard</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Daily Attendance Table ─────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Attendance Records</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {data.students.length} student{data.students.length !== 1 ? 's' : ''} · {dateColumns.length} days
                  </p>
                </div>
                {/* Search */}
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Search student…"
                    value={dailySearch}
                    onChange={(e) => setDailySearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {/* Legend */}
                <div className="ml-auto hidden lg:flex items-center gap-3">
                  {(['PR', 'AC', 'LA', 'EX', 'HO'] as const).map((code) => {
                    const meta = getCodeMeta(code);
                    return (
                      <div key={code} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className={cn('w-2 h-2 rounded-full', meta.dot)} />
                        {meta.label}
                      </div>
                    );
                  })}
                  <span className="text-gray-300 text-xs">+ more</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left pl-6 pr-3 py-3 font-semibold text-gray-400 w-10 sticky left-0 bg-gray-50/70 z-10">
                        #
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 min-w-[180px] sticky left-10 bg-gray-50/70 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        Student
                      </th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-400 whitespace-nowrap">Days</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-400 whitespace-nowrap">Time In</th>
                      {dateColumns.map((date) => (
                        <th
                          key={date}
                          className="text-center px-1 py-3 font-semibold text-gray-400 min-w-[48px]"
                        >
                          <div className="text-[10px] font-bold">{format(new Date(date), 'EEE')}</div>
                          <div className="text-[10px] text-gray-300 font-normal">{format(new Date(date), 'M/d')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.filter(s =>
                      !dailySearch || s.studentName.toLowerCase().includes(dailySearch.toLowerCase())
                    ).map((student, index) => (
                      <tr
                        key={student.studentId}
                        className={cn(
                          'border-b border-gray-50 transition-colors cursor-pointer',
                          selectedStudentId === student.studentId
                            ? 'bg-red-50/70 hover:bg-red-50'
                            : 'hover:bg-gray-50/80'
                        )}
                        onClick={() => setSelectedStudentId(student.studentId)}
                      >
                        <td className={cn(
                          'pl-6 pr-3 py-3 text-gray-300 font-medium sticky left-0 z-10',
                          selectedStudentId === student.studentId ? 'bg-red-50/70' : 'bg-white'
                        )}>
                          {index + 1}
                        </td>
                        <td className={cn(
                          'px-4 py-3 sticky left-10 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]',
                          selectedStudentId === student.studentId ? 'bg-red-50/70' : 'bg-white'
                        )}>
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                              selectedStudentId === student.studentId
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-100 text-gray-600'
                            )}>
                              {initials(student.studentName)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 whitespace-nowrap">{student.studentName}</p>
                              <p className="text-gray-400 text-[10px] leading-none mt-0.5">{student.gradeLevel} · {student.section}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">{student.totalDays}</td>
                        <td className="px-4 py-3 text-center text-gray-500">{student.present}</td>
                        {dateColumns.map((date) => {
                          const code = student.dailyAttendance[date] || '-';
                          const meta = getCodeMeta(code);
                          return (
                            <td key={date} className="px-1 py-3 text-center">
                              {code !== '-' ? (
                                <span
                                  title={meta.label}
                                  className={cn(
                                    'inline-flex items-center justify-center w-8 h-5 rounded text-[10px] font-bold',
                                    meta.bg,
                                    meta.text
                                  )}
                                >
                                  {code}
                                </span>
                              ) : (
                                <span className="text-gray-200">–</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
