'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { endOfWeek, format, startOfMonth, startOfWeek, subWeeks } from 'date-fns';

// The table renders one column per day, so cap custom ranges at about a quarter
const MAX_RANGE_DAYS = 92;
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CalendarIcon,
  RefreshCw, Trophy, Users, XCircle,
} from 'lucide-react';
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
  general: { totalStudents: number; totalPresent: number; totalAbsent: number; totalLate: number; totalDays: number; presentPercentage: number; absentPercentage: number };
  students: Student[];
  selectedStudent: Student | null;
  dateRange: { start: string; end: string };
  filters: { gradeLevels: string[]; sections: string[] };
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
const getMeta = (code: string) => CODE_META[code] ?? { label: code, bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
const initials = (name: string) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export function StudentAttendanceTab() {
  const [data, setData] = useState<AttendanceReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('all');
  const [section, setSection] = useState('all');

  useEffect(() => {
    const end = new Date(); const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ from: start, to: end });
  }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const p = new URLSearchParams();
      if (dateRange?.from) { const d = dateRange.from; p.append('startDate', `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
      if (dateRange?.to)   { const d = dateRange.to;   p.append('endDate',   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
      if (selectedStudentId) p.append('studentId', selectedStudentId);
      if (gradeLevel !== 'all') p.append('gradeLevel', gradeLevel);
      if (section !== 'all') p.append('section', section);
      const res = await fetch(`/api/admin/attendance-reports?${p.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success && result.data) {
        setData(result.data);
        if (!selectedStudentId && result.data.students.length > 0)
          setSelectedStudentId(result.data.students[0].studentId);
      } else { setError(result.error || 'Failed to fetch'); setData(null); }
    } catch (e: any) { setError(e?.message || 'Error'); setData(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (dateRange?.from && dateRange?.to) fetchData(); }, [dateRange, selectedStudentId, gradeLevel, section]);

  const selectedStudent = useMemo(() => {
    if (!data || !selectedStudentId) return null;
    return data.students.find((s) => s.studentId === selectedStudentId) || data.selectedStudent;
  }, [data, selectedStudentId]);

  const dateColumns = useMemo(() => {
    if (!data) return [];
    const dates: string[] = [];
    const start = new Date(data.dateRange.start);
    const end   = new Date(data.dateRange.end);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1))
      dates.push(new Date(d).toISOString().split('T')[0]);
    return dates;
  }, [data]);

  const breakdown = useMemo(() => {
    if (!selectedStudent) return null;
    const b: Record<string, number> = {};
    Object.values(selectedStudent.dailyAttendance).forEach((c) => { b[c] = (b[c] || 0) + 1; });
    return b;
  }, [selectedStudent]);

  const exportExcel = async () => {
    if (!data?.students.length) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
    const to   = dateRange?.to   ? format(dateRange.to,   'yyyy-MM-dd') : 'end';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    await downloadExcel(`student-attendance-${from}-to-${to}`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'STUDENT ATTENDANCE REPORT',
        `Period: ${from} to ${to}`,
        `Generated: ${generated}`,
      ],
      columns: ['#', 'Name', 'Grade', 'Section', 'Days', 'Present', 'Absent', 'Late', 'Excused'],
      colWidths: [8, 36, 16, 16, 10, 12, 12, 10, 12],
      rows: data.students.map((s, i) => [i + 1, s.studentName, s.gradeLevel, s.section, s.totalDays, s.present, s.absent, s.late, s.excused]),
      headerColor: 'red',
    });
  };

  const exportPDF = () => {
    if (!data?.students.length) return;
    const from = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : 'start';
    const to   = dateRange?.to   ? format(dateRange.to,   'yyyy-MM-dd') : 'end';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 148, 12, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 148, 18, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('STUDENT ATTENDANCE REPORT', 148, 26, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${from} to ${to}`, 148, 32, { align: 'center' });
    doc.text(`Generated: ${generated}`, 148, 37, { align: 'center' });

    autoTable(doc, {
      startY: 42,
      head: [['#', 'Student Name', 'Grade', 'Section', 'Days', 'Present', 'Absent', 'Late', 'Excused']],
      body: data.students.map((s, i) => [i + 1, s.studentName, s.gradeLevel, s.section, s.totalDays, s.present, s.absent, s.late, s.excused]),
      foot: [['', 'TOTAL', '', '', '', data.general.totalPresent, data.general.totalAbsent, '', '']],
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      footStyles: { fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [17, 24, 39], fontSize: 8 },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' } },
      margin: { left: 10, right: 10 },
    });

    doc.save(`student-attendance-${from}-to-${to}.pdf`);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-red-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading attendance data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-2 flex-wrap">
        {[
          { label: 'Today', fn: () => setDateRange({ from: new Date(), to: new Date() }) },
          { label: 'This Week', fn: () => setDateRange({ from: startOfWeek(new Date(),{weekStartsOn:1}), to: endOfWeek(new Date(),{weekStartsOn:1}) }) },
          { label: 'Last Week', fn: () => { const lw=subWeeks(new Date(),1); setDateRange({from:startOfWeek(lw,{weekStartsOn:1}),to:endOfWeek(lw,{weekStartsOn:1})}); } },
          { label: 'This Month', fn: () => setDateRange({ from: startOfMonth(new Date()), to: new Date() }) },
          { label: 'Last 30 Days', fn: () => { const e=new Date(),s=new Date(); s.setDate(s.getDate()-30); setDateRange({from:s,to:e}); } },
        ].map(({label,fn})=>(
          <button key={label} onClick={fn} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full hover:border-red-700 hover:text-red-700 hover:bg-red-50 transition-colors">{label}</button>
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <Popover open={isPickerOpen} onOpenChange={(o)=>{setIsPickerOpen(o);if(o)setTempDateRange(dateRange);}} modal>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:border-red-700 rounded-lg transition-colors">
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateRange?.from ? (dateRange.to ? `${format(dateRange.from,'MMM d')} – ${format(dateRange.to,'MMM d, yyyy')}` : format(dateRange.from,'MMM d, yyyy')) : 'Select range'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" defaultMonth={tempDateRange?.from||dateRange?.from} selected={tempDateRange} onSelect={setTempDateRange} numberOfMonths={2} max={MAX_RANGE_DAYS} />
            <p className="px-3 pt-2 text-[11px] text-gray-400">Up to {MAX_RANGE_DAYS} days per view</p>
            <div className="p-3 border-t flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={()=>{setTempDateRange(dateRange);setIsPickerOpen(false);}}>Cancel</Button>
              <Button size="sm" className="flex-1 text-xs bg-red-800 hover:bg-red-900" onClick={()=>{if(tempDateRange?.from&&tempDateRange?.to){setDateRange(tempDateRange);setIsPickerOpen(false);}}} disabled={!tempDateRange?.from||!tempDateRange?.to}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Select value={gradeLevel} onValueChange={setGradeLevel}>
          <SelectTrigger className="h-8 text-xs w-36 border-gray-200 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {data?.filters.gradeLevels.map((g)=>(<SelectItem key={g} value={g}>{g}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={section} onValueChange={setSection}>
          <SelectTrigger className="h-8 text-xs w-36 border-gray-200 rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {data?.filters.sections.map((s)=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50">
            <RefreshCw className={cn('w-3.5 h-3.5',loading&&'animate-spin')} />Refresh
          </button>
          {data?.students.length ? (
            <ExportDropdown onPDF={exportPDF} onExcel={exportExcel} size="sm" />
          ) : null}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error loading data</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={fetchData} className="mt-2 px-3 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors">Try again</button>
          </div>
        </div>
      )}

      {/* Empty */}
      {!error && (!data || data.students.length === 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-600">No attendance records found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting the date range or filters.</p>
        </div>
      )}

      {data && data.students.length > 0 && (
        <>
          {/* ── KPI Cards ───────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Students',      value: data.general.totalStudents, sub: `${dateColumns.length} days tracked`,      color: 'text-blue-600',    iconBg: 'bg-blue-50', icon: Users },
              { label: 'Present Count', value: data.general.totalPresent,  sub: 'Total scan-in records in period',         color: 'text-emerald-600', iconBg: 'bg-emerald-50', icon: null },
            ].map(({ label, value, sub, color, iconBg, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
                  {Icon && (
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', iconBg)}>
                      <Icon className={cn('w-4 h-4', color)} />
                    </div>
                  )}
                </div>
                <p className={cn('text-4xl font-bold leading-none', color)}>{value}</p>
                <p className="text-xs text-gray-400 mt-1.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Top Performers + Student Detail ─────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Leaderboard */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-900">Top Performers</h2>
                <span className="ml-auto text-xs text-gray-400">By attendance rate</span>
              </div>
              <div className="p-5 space-y-2">
                {data.students.slice().sort((a,b)=>b.present-a.present).slice(0,8).map((s,i)=>(
                  <button key={s.studentId} onClick={()=>setSelectedStudentId(s.studentId)}
                    className={cn('w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left',
                      i===0&&'bg-amber-50 hover:bg-amber-100/70', i===1&&'bg-slate-50 hover:bg-slate-100/70', i===2&&'bg-orange-50 hover:bg-orange-100/70',
                      i>=3&&'hover:bg-gray-50', selectedStudentId===s.studentId&&i>=3&&'bg-red-50'
                    )}>
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm',
                      i===0&&'bg-amber-400 text-white', i===1&&'bg-slate-400 text-white', i===2&&'bg-orange-400 text-white', i>=3&&'bg-gray-200 text-gray-600'
                    )}>{i+1}</div>
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i===0&&'bg-amber-200 text-amber-800', i===1&&'bg-slate-200 text-slate-700', i===2&&'bg-orange-200 text-orange-800', i>=3&&'bg-red-100 text-red-800'
                    )}>{initials(s.studentName)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.studentName}</p>
                      <p className="text-[10px] text-gray-400">{s.gradeLevel} · {s.section}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{s.present} present</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Student Detail */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Student Detail</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Click any student to inspect</p>
              </div>
              {selectedStudent ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-sm font-bold text-red-800 flex-shrink-0">{initials(selectedStudent.studentName)}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{selectedStudent.studentName}</p>
                      <p className="text-xs text-gray-400">{selectedStudent.gradeLevel} · {selectedStudent.section}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[{l:'Days',v:selectedStudent.totalDays,c:'text-gray-800'},{l:'Present',v:selectedStudent.present,c:'text-emerald-600'}]
                      .map(({l,v,c})=>(
                        <div key={l} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-[10px] text-gray-400 mb-0.5">{l}</p>
                          <p className={cn('text-lg font-bold leading-none',c)}>{v}</p>
                        </div>
                    ))}
                  </div>
                  {breakdown && Object.keys(breakdown).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Breakdown</p>
                      <div className="space-y-1.5">
                        {Object.entries(breakdown).sort(([,a],[,b])=>b-a).map(([code,count])=>{
                          const m=getMeta(code);
                          return (
                            <div key={code} className="flex items-center gap-2">
                              <div className={cn('w-2 h-2 rounded-full flex-shrink-0',m.dot)} />
                              <span className="text-xs text-gray-600 flex-1 truncate">{m.label}</span>
                              <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-md',m.bg,m.text)}>{count}</span>
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

          {/* ── Daily Table ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Attendance Records</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{data.students.length} student{data.students.length!==1?'s':''} · {dateColumns.length} days</p>
              </div>
              <div className="ml-auto hidden lg:flex items-center gap-3">
                {(['PR','AC','LA','EX','HO'] as const).map((code)=>{
                  const m=getMeta(code);
                  return (
                    <div key={code} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <div className={cn('w-2 h-2 rounded-full',m.dot)} />{m.label}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="text-left pl-6 pr-3 py-3 font-semibold text-gray-400 w-10 sticky left-0 bg-gray-50/70 z-10">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 min-w-[180px] sticky left-10 bg-gray-50/70 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]">Student</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-400">Days</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-400">Present</th>
                    {dateColumns.map((d)=>(
                      <th key={d} className="text-center px-1 py-3 font-semibold text-gray-400 min-w-[48px]">
                        <div className="text-[10px] font-bold">{format(new Date(d),'EEE')}</div>
                        <div className="text-[10px] text-gray-300 font-normal">{format(new Date(d),'M/d')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s, i) => (
                    <tr key={s.studentId}
                      className={cn('border-b border-gray-50 transition-colors cursor-pointer',
                        selectedStudentId===s.studentId?'bg-red-50/70 hover:bg-red-50':'hover:bg-gray-50/80'
                      )}
                      onClick={()=>setSelectedStudentId(s.studentId)}
                    >
                      <td className={cn('pl-6 pr-3 py-3 text-gray-300 font-medium sticky left-0 z-10',selectedStudentId===s.studentId?'bg-red-50/70':'bg-white')}>{i+1}</td>
                      <td className={cn('px-4 py-3 sticky left-10 z-10 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)]',selectedStudentId===s.studentId?'bg-red-50/70':'bg-white')}>
                        <div className="flex items-center gap-2.5">
                          <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',selectedStudentId===s.studentId?'bg-red-200 text-red-800':'bg-gray-100 text-gray-600')}>{initials(s.studentName)}</div>
                          <div>
                            <p className="font-semibold text-gray-800 whitespace-nowrap">{s.studentName}</p>
                            <p className="text-gray-400 text-[10px] leading-none mt-0.5">{s.gradeLevel} · {s.section}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.totalDays}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{s.present}</td>
                      {dateColumns.map((d)=>{
                        const code=s.dailyAttendance[d]||'-';
                        const m=getMeta(code);
                        return (
                          <td key={d} className="px-1 py-3 text-center">
                            {code!=='-'
                              ? <span title={m.label} className={cn('inline-flex items-center justify-center w-8 h-5 rounded text-[10px] font-bold',m.bg,m.text)}>{code}</span>
                              : <span className="text-gray-200">–</span>
                            }
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
  );
}
