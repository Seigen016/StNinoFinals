'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAlert } from '@/lib/use-alert';
import { useRefresh } from '@/lib/refresh-context';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GraduationCap } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudentAuth } from '../hooks/useStudentAuth';

type GradeStatus = 'pending' | 'approved' | 'rejected' | null;

interface GradeItem {
  id: string;
  subject: string;
  grade: string;
  status: GradeStatus;
  lastUpdated: string;
  quarter?: number | null;
  school_year?: string | null;
}

interface EnrollmentInfo {
  status: string;
  academicYear: string;
  semester?: string;
  gradeLevel?: string;
  strand?: string;
}

interface GradesData {
  grades: GradeItem[];
  enrollment?: EnrollmentInfo;
}

function gradeColor(grade: number) {
  return grade >= 75 ? 'text-yellow-600' : 'text-red-700';
}

function gradeBg(grade: number) {
  return grade >= 75 ? 'bg-yellow-400' : 'bg-red-400';
}

export default function GradesPage() {
  const { student, isLoading } = useStudentAuth();
  const { refreshKey } = useRefresh();
  const { showAlert } = useAlert();
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

  const displayName = useMemo(() => {
    if (!student) return 'Student';
    if (student.first_name && student.last_name) return `${student.first_name} ${student.last_name}`;
    return student.email?.split('@')[0] || 'Student';
  }, [student]);

  const fetchGradesData = useCallback(async () => {
    if (!student) return;
    setDataLoading(true);
    try {
      const [dashboardRes, gradesRes] = await Promise.all([
        fetch('/api/student/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: student.id, email: student.email }),
        }),
        fetch(`/api/parent/student-grades?student_id=${student.id}`),
      ]);

      const dashboardPayload = await dashboardRes.json().catch(() => ({}));
      const gradesPayload = await gradesRes.json().catch(() => ({}));

      const grades: GradeItem[] =
        gradesPayload?.success && gradesPayload?.grades?.length > 0
          ? gradesPayload.grades.map((g: any, index: number) => ({
              id: g.id || String(index + 1),
              subject: g.subject,
              grade: String(g.grade),
              status: g.status ?? null,
              lastUpdated: g.lastUpdated || new Date().toISOString(),
              quarter: g.quarter ?? null,
              school_year: g.school_year ?? null,
            }))
          : (dashboardPayload?.data?.grades || []).map((g: any, index: number) => ({
              id: String(index + 1),
              subject: g.subject,
              grade: String(g.grade),
              status: null,
              lastUpdated: g.lastUpdated || new Date().toISOString(),
              quarter: null,
              school_year: null,
            }));

      setGradesData({ grades, enrollment: dashboardPayload?.data?.enrollment });
    } catch (error) {
      console.error('Grades fetch error:', error);
    } finally {
      setDataLoading(false);
    }
  }, [student]);

  useEffect(() => {
    if (student) fetchGradesData();
  }, [student, fetchGradesData, refreshKey]);

  const allGrades = (gradesData?.grades || []).filter((g) => g.status === 'approved');
  const enrollmentInfo = gradesData?.enrollment;

  // Distinct academic years and quarters from grade data
  const academicYears = useMemo(() => {
    const years = [...new Set(allGrades.map((g) => g.school_year).filter(Boolean))] as string[];
    return years.sort().reverse();
  }, [allGrades]);

  const availableQuarters = useMemo(() => {
    const filtered = selectedYear === 'all'
      ? allGrades
      : allGrades.filter((g) => g.school_year === selectedYear);
    const quarters = [...new Set(filtered.map((g) => g.quarter).filter((q) => q != null))] as number[];
    return quarters.sort();
  }, [allGrades, selectedYear]);

  const filteredGrades = useMemo(() => {
    let list = allGrades;
    if (selectedYear !== 'all') list = list.filter((g) => g.school_year === selectedYear);
    if (selectedQuarter !== 'all') list = list.filter((g) => String(g.quarter) === selectedQuarter);
    return list;
  }, [allGrades, selectedYear, selectedQuarter]);

  // Group filtered grades by quarter for display
  const byQuarter = useMemo(() => {
    const map = new Map<string, GradeItem[]>();
    filteredGrades.forEach((g) => {
      const key = g.quarter != null ? `Quarter ${g.quarter}` : 'Unassigned';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    });
    return map;
  }, [filteredGrades]);

  const generalAverage = filteredGrades.length > 0
    ? (filteredGrades.reduce((s, g) => s + parseFloat(g.grade), 0) / filteredGrades.length).toFixed(1)
    : null;

  const formatDate = (ds: string) => {
    try { return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ds; }
  };

  const generateGradesCSV = useCallback(async () => {
    if (!student) return;
    if (filteredGrades.length === 0) {
      showAlert({ message: 'No approved grades available to download.', type: 'warning' });
      return;
    }
    const { downloadExcel } = await import('@/lib/export-excel');
    const studentName = `${student.first_name || ''} ${(student as any).middle_name || ''} ${student.last_name || ''}`.trim() || displayName;
    const academicYear = selectedYear !== 'all' ? selectedYear : (enrollmentInfo?.academicYear || '');
    const quarterLabel = selectedQuarter !== 'all' ? `Quarter ${selectedQuarter}` : 'All Quarters';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const avg = filteredGrades.length > 0
      ? (filteredGrades.reduce((s, g) => s + parseFloat(g.grade), 0) / filteredGrades.length).toFixed(0)
      : 'N/A';

    await downloadExcel(
      `Grades_${studentName.replace(/\s+/g, '_')}${academicYear ? '_' + academicYear : ''}`,
      {
        title: [
          'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
          'CERTIFICATE OF GRADES',
          `Student: ${studentName.toUpperCase()}`,
          `${quarterLabel} | Academic Year: ${academicYear}`,
          `Generated: ${generated}`,
        ],
        columns: ['Subject', 'Quarterly Grade', 'Action Taken'],
        colWidths: [40, 20, 20],
        rows: filteredGrades.map((g) => {
          const num = parseFloat(g.grade);
          const action = !isNaN(num) && num >= 75 ? 'PASSED' : 'FAILED';
          return [g.subject || 'N/A', g.grade, action];
        }),
        totalRow: ['General Average', avg, parseFloat(avg) >= 75 ? 'PROMOTED' : 'RETAINED'],
        headerColor: 'red',
      }
    );
  }, [student, filteredGrades, enrollmentInfo, displayName, selectedYear, selectedQuarter, showAlert]);

  const generateGradesPDF = useCallback(async () => {
    if (!student) return;
    if (filteredGrades.length === 0) {
      showAlert({ message: 'No approved grades available to download.', type: 'warning' });
      return;
    }
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 18, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text('OF LA PAZ HOMES II, INC.', 105, 24, { align: 'center' });
      doc.text('La Paz Homes II/Karlaville Parkhomes, Trece', 105, 28, { align: 'center' });
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF GRADES', 105, 45, { align: 'center' });

      const studentName = `${student.first_name || ''} ${(student as any).middle_name || ''} ${student.last_name || ''}`.trim() || displayName;
      const gradeLevel = student.grade_level || enrollmentInfo?.gradeLevel || 'N/A';
      const academicYear = selectedYear !== 'all' ? selectedYear : (enrollmentInfo?.academicYear || '2024-2025');
      const quarterLabel = selectedQuarter !== 'all' ? `Quarter ${selectedQuarter}` : 'All Quarters';

      doc.setFontSize(12); doc.setFont('helvetica', 'normal');
      doc.text(`This is to certify that ${studentName.toUpperCase()} of Grade ${gradeLevel}`, 105, 60, { align: 'center' });
      doc.text(`for ${quarterLabel} of Academic Year ${academicYear}.`, 105, 66, { align: 'center' });

      const tableData = filteredGrades.map((grade) => {
        const num = parseFloat(grade.grade);
        return [grade.subject || 'N/A', grade.grade, !isNaN(num) && num >= 75 ? 'PASSED' : 'FAILED'];
      });
      const numericAvg = filteredGrades.length > 0
        ? (filteredGrades.reduce((s, g) => s + parseFloat(g.grade), 0) / filteredGrades.length).toFixed(0)
        : 'N/A';
      tableData.push(['General Average for the quarter', numericAvg, parseFloat(numericAvg) >= 75 ? 'PROMOTED' : 'RETAINED']);

      {
        autoTable(doc, {
          startY: 80,
          head: [['SUBJECT', 'QUARTERLY GRADE', 'ACTION TAKEN']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
          bodyStyles: { fontSize: 9, textColor: [0, 0, 0] },
          columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 40, halign: 'center' }, 2: { cellWidth: 50, halign: 'center' } },
          margin: { left: 10, right: 10 },
        });
      }

      let finalY = 200;
      if ((doc as any).lastAutoTable?.finalY) finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(10); doc.setFont('helvetica', 'italic');
      doc.text('This certification is issued upon the request of the aforementioned student', 105, finalY, { align: 'center' });
      doc.text('for EDUCATIONAL ASSISTANCE and for the stated purpose only.', 105, finalY + 6, { align: 'center' });
      const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.text(`Issued this ${dateStr} at SNDPA-LPH, Trece Martires City, Cavite.`, 105, finalY + 15, { align: 'center' });
      const signatureY = finalY + 35;
      doc.setFontSize(10);
      doc.text('MRS. CORAZON R. ULEP', 50, signatureY);
      doc.text('School Registrar', 50, signatureY + 5);
      doc.text('COL GILMAR N GALICIA PA(Res) ME', 150, signatureY);
      doc.text('Principal / Administrator', 150, signatureY + 5);
      doc.setFontSize(8); doc.setFont('helvetica', 'italic');
      doc.text('Should there be a need to verify this document? Please call (046) 443-33-67 Office of the Registrar', 105, 270, { align: 'center' });
      doc.text('NOT VALID WITHOUT SCHOOL SEAL', 105, 275, { align: 'center' });
      doc.save(`Certificate_of_Grades_${studentName.replace(/\s+/g, '_')}_${academicYear}.pdf`);
    } catch (error: any) {
      showAlert({ message: `Failed to generate PDF: ${error?.message || 'Unknown error'}.`, type: 'error' });
    }
  }, [student, filteredGrades, enrollmentInfo, displayName, selectedYear, selectedQuarter, showAlert]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-800 border-t-transparent" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Grades & Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your academic performance history</p>
        </div>
        {filteredGrades.length > 0 && (
          <ExportDropdown onPDF={generateGradesPDF} onExcel={generateGradesCSV} size="sm" />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Academic Year:</span>
          <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedQuarter('all'); }}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Quarter:</span>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quarters</SelectItem>
              {availableQuarters.map((q) => (
                <SelectItem key={q} value={String(q)}>Quarter {q}</SelectItem>
              ))}
              {availableQuarters.length === 0 && (
                <SelectItem value="1">Quarter 1</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      {filteredGrades.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Subjects</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{filteredGrades.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">General Average</p>
              <p className={`text-3xl font-bold mt-1 ${generalAverage ? (parseFloat(generalAverage) >= 75 ? 'text-yellow-600' : 'text-red-700') : 'text-gray-400'}`}>
                {generalAverage ?? '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades grouped by quarter */}
      {dataLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-800 border-t-transparent mx-auto" />
          <p className="text-gray-500 mt-3 text-sm">Loading grades...</p>
        </div>
      ) : filteredGrades.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden />
            <p className="text-gray-600 font-medium">No grades found</p>
            <p className="text-sm text-gray-400 mt-1">
              {allGrades.length > 0 ? 'Try adjusting the filters above.' : 'Your grades will appear here once finalized by your school.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        Array.from(byQuarter.entries()).map(([quarterLabel, items]) => {
          const qAvg = items.length > 0
            ? (items.reduce((s, g) => s + parseFloat(g.grade), 0) / items.length).toFixed(1)
            : null;
          return (
            <Card key={quarterLabel} className="bg-white border border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{quarterLabel}</CardTitle>
                  {qAvg && (
                    <span className={`text-sm font-bold ${parseFloat(qAvg) >= 75 ? 'text-yellow-600' : 'text-red-700'}`}>
                      Avg: {qAvg}
                    </span>
                  )}
                </div>
                <CardDescription>{items.length} subject{items.length !== 1 ? 's' : ''}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {items.map((grade) => {
                    const num = parseFloat(grade.grade);
                    const isPassing = !isNaN(num) && num >= 75;
                    return (
                      <div key={grade.id} className="flex items-center justify-between py-3 px-1">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{grade.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Updated {formatDate(grade.lastUpdated)}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className={`text-2xl font-bold ${gradeColor(num)}`}>{grade.grade}</span>
                          <div className={`w-2 h-10 rounded-full ${gradeBg(num)}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {allGrades.length === 0 && !dataLoading && (
        <p className="text-center text-xs text-gray-400">
          Certificate download will be available once grades are finalized.
        </p>
      )}
    </div>
  );
}
