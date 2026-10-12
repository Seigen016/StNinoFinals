'use client';

import { Button } from '@/components/ui/button';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
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
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ClassWithCount {
  id: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  school_year: string;
  semester: number;
  student_count: number;
}

interface Teacher {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  [key: string]: any;
}

const COLORS = ['#991b1b', '#b45309', '#15803d', '#1d4ed8', '#7c3aed', '#be185d', '#0369a1', '#92400e'];

export default function TeacherReportsPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<ClassWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('teacher');
    if (!stored) { router.push('/login?role=teacher'); return; }
    try { setTeacher(JSON.parse(stored)); } catch { router.push('/login?role=teacher'); }
  }, [router]);

  useEffect(() => {
    if (teacher?.id) fetchClasses();
  }, [teacher]);

  const fetchClasses = async () => {
    if (!teacher?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/classes?teacherId=${teacher.id}`);
      const data = await res.json();
      if (data.success) setClasses(data.classes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const schoolYears = [...new Set(classes.map(c => c.school_year))].sort().reverse();

  const filtered = selectedYear === 'all'
    ? classes
    : classes.filter(c => c.school_year === selectedYear);

  const chartData = filtered.map(c => ({
    name: `${c.class_name}${c.grade_level ? ` (${c.grade_level}${c.section ? '-' + c.section : ''})` : ''}`,
    students: c.student_count,
  }));

  const totalStudents = filtered.reduce((s, c) => s + c.student_count, 0);
  const teacherName = teacher
    ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.email
    : '';

  const tc = useTableControls(filtered, {
    searchFields: ['class_name'],
    defaultSort: { key: 'class_name', dir: 'asc' },
    pageSize: 100,
  });

  // Reset when year filter changes
  useEffect(() => {
    tc.clearFilters();
  }, [selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownloadPDF = () => {
    if (filtered.length === 0) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 105, 21, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('ENROLLMENT REPORT', 105, 31, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Teacher: ${teacherName}`, 105, 38, { align: 'center' });
    doc.text(
      `${selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All School Years'}  |  Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      105, 43, { align: 'center' }
    );

    const tableBody = filtered.map(c => [
      c.class_name, c.grade_level || '—', c.section || '—', c.school_year, `Q${c.semester}`, c.student_count,
    ]);
    tableBody.push(['TOTAL', '', '', '', '', totalStudents] as any);

    autoTable(doc, {
      startY: 50,
      head: [['Class Name', 'Grade Level', 'Section', 'School Year', 'Quarter', 'Students']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 5: { halign: 'center', fontStyle: 'bold' } },
      didParseCell: (hookData: any) => {
        if (hookData.row.index === filtered.length) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: 15, right: 15 },
    });

    let startY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : 160;
    if (doc.internal.pageSize.height - startY < 80) { doc.addPage(); startY = 20; }

    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('Students per Class', 105, startY, { align: 'center' });
    startY += 8;

    const maxCount = Math.max(...filtered.map(c => c.student_count), 1);
    const chartHeight = 50;
    const chartLeft = 20;
    const chartRight = 190;
    const chartWidth = chartRight - chartLeft;
    const barWidth = Math.min(20, chartWidth / filtered.length - 2);

    doc.setDrawColor(150, 150, 150);
    doc.line(chartLeft, startY + chartHeight, chartRight, startY + chartHeight);

    filtered.forEach((c, i) => {
      const barHeight = (c.student_count / maxCount) * chartHeight;
      const x = chartLeft + (i * (chartWidth / filtered.length)) + (chartWidth / filtered.length - barWidth) / 2;
      const y = startY + chartHeight - barHeight;
      doc.setFillColor(153, 27, 27);
      doc.rect(x, y, barWidth, barHeight, 'F');
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
      if (c.student_count > 0) doc.text(String(c.student_count), x + barWidth / 2, y - 1, { align: 'center' });
      doc.text(`${c.class_name}`.slice(0, 8), x + barWidth / 2, startY + chartHeight + 5, { align: 'center' });
    });

    doc.save(`Enrollment_Report_${teacherName.replace(/\s+/g, '_')}_${selectedYear !== 'all' ? selectedYear : 'All'}.pdf`);
  };

  const handleDownloadExcel = async () => {
    if (filtered.length === 0) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    await downloadExcel(`Enrollment_Report_${teacherName.replace(/\s+/g, '_')}_${selectedYear !== 'all' ? selectedYear : 'All'}`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'ENROLLMENT REPORT',
        `Teacher: ${teacherName}`,
        `${selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All School Years'}  |  Generated: ${generated}`,
      ],
      columns: ['Class Name', 'Grade Level', 'Section', 'School Year', 'Quarter', 'Students'],
      colWidths: [32, 18, 18, 18, 14, 14],
      rows: filtered.map(c => [c.class_name, c.grade_level || '—', c.section || '—', c.school_year, `Q${c.semester}`, c.student_count]),
      totalRow: ['TOTAL', '', '', '', '', totalStudents],
      headerColor: 'red',
    });
  };

  if (!teacher) return null;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Enrollment Report
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Student count per class — {teacherName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">School Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {schoolYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ExportDropdown
            onPDF={handleDownloadPDF}
            onExcel={handleDownloadExcel}
            disabled={filtered.length === 0}
            size="sm"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: totalStudents },
          { label: 'Classes',        value: filtered.length },
          { label: 'Avg per Class',  value: filtered.length > 0 ? (totalStudents / filtered.length).toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Students per Class</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All school years'}
            </p>
          </div>
          <div className="p-5">
            <div ref={chartRef} className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 60, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* interval={0} forces every tick to render, and these labels
                      are long ("Math 7 (Grade 7-Rizal)") — angle them and clip
                      the text so they stop colliding. Tooltip has the full name. */}
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    tickFormatter={(v: string) => v.length > 20 ? `${v.slice(0, 19)}…` : v}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [`${v} students`, 'Count']} />
                  <Bar dataKey="students" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Class Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">Class Roster Summary</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No classes found.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[770px]">
            <thead>
              <tr className="bg-gray-50">
                <SortHeader label="Class Name"   sortKey="class_name"    currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
                <SortHeader label="Grade Level"  sortKey="grade_level"   currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Section"      sortKey="section"       currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="School Year"  sortKey="school_year"   currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Quarter"      sortKey="semester"      currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Students"     sortKey="student_count" currentSort={tc.sort} onSort={tc.toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tc.rows.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-4 text-sm font-medium text-gray-900">{c.class_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.grade_level || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.section || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.school_year}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Q{c.semester}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{c.student_count}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={5} className="px-4 py-3 pl-4 text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{totalStudents}</td>
              </tr>
            </tbody>
          </table>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {tc.rows.length} class{tc.rows.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
