'use client';

const DAY_LABELS: Record<string, string> = { M: 'Mon', T: 'Tue', W: 'Wed', Th: 'Thu', F: 'Fri' };
const DAY_ORDER = ['M', 'T', 'W', 'Th', 'F'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatSchedule(raw: string | null): string {
  if (!raw) return '';
  try {
    const entries: { day: string; start: string; end: string }[] = JSON.parse(raw);
    // Group days that share the same start/end time
    const groups = new Map<string, string[]>();
    for (const e of entries) {
      const key = `${e.start}|${e.end}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e.day);
    }
    return Array.from(groups.entries())
      .map(([key, days]) => {
        const [start, end] = key.split('|');
        const sorted = [...days].sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
        const dayStr = sorted.map(d => DAY_LABELS[d] ?? d).join(', ');
        return `${dayStr}  ${formatTime(start)}–${formatTime(end)}`;
      })
      .join('\n');
  } catch {
    return raw;
  }
}

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTableControls } from '@/hooks/use-table-controls';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BookOpen, Search, Users, X } from 'lucide-react';
import { useRefresh } from '@/lib/refresh-context';
import { useEffect, useMemo, useState } from 'react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  grade_level: string | null;
  section: string | null;
}

interface ClassItem {
  id: string;
  class_code: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  school_year: string;
  quarter: string;
  room: string | null;
  schedule: string | null;
  students: Student[];
  student_count: number;
}

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingClass, setViewingClass] = useState<ClassItem | null>(null);
  const { refreshKey } = useRefresh();

  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterQuarter, setFilterQuarter] = useState('all');
  const [filterYear, setFilterYear] = useState('all');

  const gradeOptions = useMemo(() =>
    [...new Set(classes.map(c => c.grade_level).filter(Boolean))].sort() as string[],
  [classes]);

  const yearOptions = useMemo(() =>
    [...new Set(classes.map(c => c.school_year).filter(Boolean))].sort().reverse() as string[],
  [classes]);

  const filteredClasses = useMemo(() => {
    const q = search.toLowerCase();
    return classes.filter(c => {
      if (q && !c.class_name.toLowerCase().includes(q) && !c.class_code.toLowerCase().includes(q)) return false;
      if (filterGrade !== 'all' && c.grade_level !== filterGrade) return false;
      if (filterQuarter !== 'all' && c.quarter !== filterQuarter) return false;
      if (filterYear !== 'all' && c.school_year !== filterYear) return false;
      return true;
    });
  }, [classes, search, filterGrade, filterQuarter, filterYear]);

  const hasFilters = search || filterGrade !== 'all' || filterQuarter !== 'all' || filterYear !== 'all';

  const clearFilters = () => {
    setSearch('');
    setFilterGrade('all');
    setFilterQuarter('all');
    setFilterYear('all');
  };

  const studentTc = useTableControls(viewingClass?.students ?? [], {
    searchFields: ['last_name', 'first_name', 'student_number'],
    defaultSort: { key: 'last_name', dir: 'asc' },
    pageSize: 25,
  });

  // Reset student table state when the class changes
  useEffect(() => {
    studentTc.clearFilters();
    studentTc.setPage(1);
  }, [viewingClass?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const stored = localStorage.getItem('teacher');
        if (!stored) return;
        const teacher = JSON.parse(stored);
        const res = await fetch(`/api/teacher/classes?teacherId=${teacher.id}`);
        const data = await res.json();
        if (data.success) setClasses(data.classes || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [refreshKey]);

  const handleExportExcel = async (classItem: ClassItem) => {
    if (!classItem.students.length) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    await downloadExcel(`${classItem.class_name}_students`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'CLASS LIST',
        `Class: ${classItem.class_name}${classItem.grade_level ? `  |  ${classItem.grade_level}${classItem.section ? ` — ${classItem.section}` : ''}` : ''}`,
        `Generated: ${generated}`,
      ],
      columns: ['#', 'Student Number', 'Last Name', 'First Name', 'Grade Level', 'Section'],
      colWidths: [8, 20, 30, 30, 18, 18],
      rows: classItem.students.map((s, i) => [i + 1, s.student_number, s.last_name, s.first_name, s.grade_level || '', s.section || '']),
      headerColor: 'blue',
    });
  };

  const handleExportPDF = (classItem: ClassItem) => {
    if (!classItem.students.length) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 105, 21, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('CLASS LIST', 105, 30, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`${classItem.class_name}${classItem.grade_level ? `  |  ${classItem.grade_level}${classItem.section ? ` — ${classItem.section}` : ''}` : ''}`, 105, 37, { align: 'center' });
    doc.text(`Generated: ${generated}`, 105, 42, { align: 'center' });

    autoTable(doc, {
      startY: 48,
      head: [['#', 'Student Number', 'Last Name', 'First Name', 'Grade Level', 'Section']],
      body: classItem.students.map((s, i) => [i + 1, s.student_number, s.last_name, s.first_name, s.grade_level || '—', s.section || '—']),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 } },
      margin: { left: 15, right: 15 },
    });

    doc.save(`${classItem.class_name}_students.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
          <p className="text-sm text-gray-500 mt-0.5">View your assigned classes and enrolled students</p>
        </div>
        {classes.length > 0 && (
          <p className="text-sm text-gray-400 self-end">
            {filteredClasses.length} of {classes.length} class{classes.length !== 1 ? 'es' : ''}
          </p>
        )}
      </div>

      {/* Filter bar */}
      {classes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
              placeholder="Search class name or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Grade Level */}
          <Select value={filterGrade} onValueChange={setFilterGrade}>
            <SelectTrigger className="h-8 text-xs w-36 border-gray-200">
              <SelectValue placeholder="Grade Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {gradeOptions.map(g => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quarter */}
          <Select value={filterQuarter} onValueChange={setFilterQuarter}>
            <SelectTrigger className="h-8 text-xs w-32 border-gray-200">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              {['1','2','3','4'].map(q => (
                <SelectItem key={q} value={q}>Quarter {q}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* School Year */}
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="h-8 text-xs w-36 border-gray-200">
              <SelectValue placeholder="School Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearOptions.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-base font-semibold text-gray-700">No classes assigned yet</p>
          <p className="text-sm text-gray-500 mt-1">Contact the admin to get assigned to classes.</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex flex-col items-center justify-center text-center">
          <Search className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-base font-semibold text-gray-700">No classes match your filters</p>
          <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900 mt-1 underline underline-offset-2">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map(classItem => (
            <div
              key={classItem.id}
              className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-gray-900 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingClass(classItem)}
            >
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{classItem.class_name}</h3>
                    <p className="font-mono text-[12px] text-gray-500 mt-0.5">{classItem.class_code}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                    {classItem.student_count} student{classItem.student_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="px-5 pb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Grade &amp; Section</span>
                  <span className="font-medium text-gray-900">
                    {classItem.grade_level || <span className="text-gray-300">—</span>}
                    {classItem.section ? ` — ${classItem.section}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">School Year</span>
                  <span className="font-medium text-gray-900">{classItem.school_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quarter</span>
                  <span className="font-medium text-gray-900">Quarter {classItem.quarter}</span>
                </div>
                {classItem.room && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room</span>
                    <span className="font-medium text-gray-900">{classItem.room}</span>
                  </div>
                )}
                {classItem.schedule && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500 shrink-0">Schedule</span>
                    <span className="font-medium text-gray-900 text-right whitespace-pre-line">
                      {formatSchedule(classItem.schedule)}
                    </span>
                  </div>
                )}
                <div className="pt-2">
                  <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Users className="w-4 h-4" />
                    View Students
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Student List Dialog */}
      <Dialog open={!!viewingClass} onOpenChange={open => !open && setViewingClass(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{viewingClass?.class_name}</DialogTitle>
            <DialogDescription>
              {viewingClass?.grade_level}
              {viewingClass?.section ? ` — ${viewingClass.section}` : ''}
              {' · '}
              {viewingClass?.student_count} student{viewingClass?.student_count !== 1 ? 's' : ''} enrolled
            </DialogDescription>
          </DialogHeader>

          {viewingClass && viewingClass.students.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No students enrolled in this class.</div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                  placeholder="Search by name or student number..."
                  value={studentTc.search}
                  onChange={e => studentTc.setSearch(e.target.value)}
                />
              </div>

              {/* Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden overflow-y-auto flex-1">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[660px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-10">#</th>
                      <SortHeader label="Student No."  sortKey="student_number" currentSort={studentTc.sort} onSort={studentTc.toggleSort} />
                      <SortHeader label="Name"         sortKey="last_name"      currentSort={studentTc.sort} onSort={studentTc.toggleSort} />
                      <SortHeader label="Grade"        sortKey="grade_level"    currentSort={studentTc.sort} onSort={studentTc.toggleSort} />
                      <SortHeader label="Section"      sortKey="section"        currentSort={studentTc.sort} onSort={studentTc.toggleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentTc.rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">No students match your search.</td>
                      </tr>
                    ) : (
                      studentTc.rows.map((student, index) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">
                            {(studentTc.page - 1) * studentTc.pageSize + index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[12px] text-gray-500">
                              {student.student_number || <span className="text-gray-300">—</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {student.last_name}, {student.first_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.grade_level || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.section || <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  {studentTc.pageCount > 1 && (
                    <Pagination
                      page={studentTc.page}
                      pageCount={studentTc.pageCount}
                      totalCount={studentTc.totalCount}
                      filteredCount={studentTc.filteredCount}
                      pageSize={studentTc.pageSize}
                      onPageChange={studentTc.setPage}
                      onPageSizeChange={studentTc.setPageSize}
                    />
                  )}
                </div>
                {viewingClass && (
                  <ExportDropdown
                    onPDF={() => handleExportPDF(viewingClass)}
                    onExcel={() => handleExportExcel(viewingClass)}
                    size="sm"
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
