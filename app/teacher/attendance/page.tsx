'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTableControls } from '@/hooks/use-table-controls';
import { cn } from '@/lib/utils';
import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalendarIcon, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { useRefresh } from '@/lib/refresh-context';

interface AttendanceRecord {
  id: string;
  scan_time: string;
  status: string;
  student_name: string;
  student_number: string;
  grade_level: string;
  section: string;
}


export default function TeacherAttendancePage() {
  const router = useRouter();
  const { refreshKey } = useRefresh();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [section, setSection] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);

  const fetchAttendance = async (tid?: string) => {
    setLoading(true);
    try {
      const resolvedId = tid ?? teacherId;
      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
      const params = new URLSearchParams({ startDate, endDate });
      if (resolvedId) params.set('teacherId', resolvedId);
      if (section !== 'all') params.set('section', section);
      const res = await fetch(`/api/teacher/attendance?${params}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        // Always update sections (API now returns teacher's classes even with no records)
        if (data.sections) setSections(data.sections);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setDateRange({ from: start, to: end });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('teacher');
    if (!stored) { router.push('/login?role=teacher'); return; }
    try {
      const parsed = JSON.parse(stored);
      const tid = parsed.id as string;
      setTeacherId(tid);
      fetchAttendance(tid);
    } catch {
      router.push('/login?role=teacher');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const tc = useTableControls(records, {
    searchFields: ['student_name', 'student_number', 'section'],
    defaultSort: { key: 'scan_time', dir: 'desc' },
    pageSize: 25,
  });

  const handleExportExcel = async () => {
    const { downloadExcel } = await import('@/lib/export-excel');
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const startStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const endStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    const suffix = section !== 'all' ? `_${section}` : '';
    await downloadExcel(`attendance_${startStr}_to_${endStr}${suffix}`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'ATTENDANCE LOG',
        `Period: ${startStr} to ${endStr}${section !== 'all' ? `  |  Section: ${section}` : ''}`,
        `Generated: ${generated}`,
      ],
      columns: ['Date', 'Time', 'Student Name', 'Student No.', 'Grade Level', 'Section', 'Status'],
      colWidths: [18, 14, 36, 18, 18, 18, 14],
      rows: tc.rows.map((r) => {
        const dt = new Date(r.scan_time);
        return [
          dt.toLocaleDateString('en-PH'),
          dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
          r.student_name,
          r.student_number || '',
          r.grade_level || '',
          r.section || '',
          r.status,
        ];
      }),
    });
  };

  const handleExportPDF = () => {
    if (tc.rows.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 148, 12, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 148, 18, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE LOG', 148, 26, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const startStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const endStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    doc.text(`Period: ${startStr} to ${endStr}${section !== 'all' ? `  |  Section: ${section}` : ''}`, 148, 32, { align: 'center' });
    doc.text(`Generated: ${generated}`, 148, 37, { align: 'center' });

    const tableData = tc.rows.map((r) => {
      const dt = new Date(r.scan_time);
      return [
        dt.toLocaleDateString('en-PH'),
        dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
        r.student_name,
        r.student_number || '—',
        r.grade_level || '—',
        r.section || '—',
        r.status,
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['Date', 'Time', 'Student Name', 'Student No.', 'Grade Level', 'Section', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 10, right: 10 },
    });

    doc.save(`attendance_${startStr}_to_${endStr}${section !== 'all' ? `_${section}` : ''}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Log</h2>
          <p className="text-sm text-gray-500 mt-0.5">View and export student attendance by section</p>
        </div>
        <ExportDropdown
          onPDF={handleExportPDF}
          onExcel={handleExportExcel}
          disabled={tc.rows.length === 0}
          size="sm"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Section */}
          <div className="flex-1 min-w-[140px]">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-5 bg-gray-200" />

          {/* Quick chips */}
          {[
            { label: 'This Week', fn: () => setDateRange({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
            { label: 'Last Week', fn: () => { const lw = subWeeks(new Date(), 1); setDateRange({ from: startOfWeek(lw, { weekStartsOn: 1 }), to: endOfWeek(lw, { weekStartsOn: 1 }) }); } },
            { label: 'Last 30 Days', fn: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 30); setDateRange({ from: s, to: e }); } },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              {label}
            </button>
          ))}

          {/* Date range picker */}
          <Popover open={isDatePickerOpen} onOpenChange={(open) => { setIsDatePickerOpen(open); if (open) setTempDateRange(dateRange); }} modal={true}>
            <PopoverTrigger asChild>
              <button className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors',
                dateRange?.from ? 'text-gray-700 bg-white border-gray-300 hover:border-gray-900' : 'text-gray-400 bg-gray-50 border-gray-200'
              )}>
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d, yyyy')}`
                    : format(dateRange.from, 'MMM d, yyyy')
                  : 'Select date range'}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" defaultMonth={tempDateRange?.from || dateRange?.from} selected={tempDateRange} onSelect={setTempDateRange} numberOfMonths={2} />
              <div className="p-3 border-t flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { setTempDateRange(dateRange); setIsDatePickerOpen(false); }}>Cancel</Button>
                <Button size="sm" className="flex-1 text-xs bg-primary hover:bg-primary/90"
                  onClick={() => { if (tempDateRange?.from && tempDateRange?.to) { setDateRange(tempDateRange); setIsDatePickerOpen(false); } }}
                  disabled={!tempDateRange?.from || !tempDateRange?.to}
                >Apply</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={() => fetchAttendance()} disabled={loading} className="h-9 bg-primary hover:bg-primary/90 text-white text-sm">
            {loading ? 'Loading...' : 'Apply'}
          </Button>
        </div>
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search by name, number…"
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <span className="text-xs text-gray-400">{tc.filteredCount} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <SortHeader label="Date & Time" sortKey="scan_time" currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Student Name" sortKey="student_name" currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Student No." sortKey="student_number" currentSort={tc.sort} onSort={tc.toggleSort} className="hidden sm:table-cell" />
                <SortHeader label="Grade Level" sortKey="grade_level" currentSort={tc.sort} onSort={tc.toggleSort} className="hidden md:table-cell" />
                <SortHeader label="Section" sortKey="section" currentSort={tc.sort} onSort={tc.toggleSort} />
                <th className="text-center px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading…</td>
                </tr>
              ) : tc.rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No attendance records found.</td>
                </tr>
              ) : (
                tc.rows.map((r) => {
                  const dt = new Date(r.scan_time);
                  const isPresent = r.status?.toLowerCase() === 'present' || r.status === 'PR';
                  const statusLabel = isPresent ? 'Time In / Time Out' : (r.status || '—');
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                        <span className="font-medium">{dt.toLocaleDateString('en-PH')}</span>
                        <span className="text-gray-400 ml-2 text-xs">
                          {dt.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-900 capitalize">{r.student_name.toLowerCase()}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden sm:table-cell">{r.student_number || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{r.grade_level || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{r.section || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPresent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {tc.pageCount > 1 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <Pagination
              page={tc.page}
              pageCount={tc.pageCount}
              totalCount={tc.totalCount}
              filteredCount={tc.filteredCount}
              pageSize={tc.pageSize}
              onPageChange={tc.setPage}
              onPageSizeChange={tc.setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}
