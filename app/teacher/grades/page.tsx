'use client';

import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTableControls } from '@/hooks/use-table-controls';
import { findGradeColumns, readSheetFile } from '@/lib/csv';
import { useAlert } from '@/lib/use-alert';
import { useConfirm } from '@/lib/use-confirm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CheckCircle2, Clock, GraduationCap, History, Lock, Save, Search, Upload, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRefresh } from '@/lib/refresh-context';

interface Teacher {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  subject?: string;
  subjects?: string;
  specialization?: string;
  [key: string]: any;
}

type GradeStatus = 'pending' | 'approved' | 'rejected' | null;

interface GradeRow {
  id: number;
  name: string;
  studentId: string;
  grade: string;
  status: GradeStatus;
  gradeId: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

type FlatGradeRow = GradeRow & { statusLabel: string };

const STATUS_CONFIG = {
  approved: { label: 'Approved', dot: 'bg-green-500', rowClass: 'bg-green-50' },
  rejected: { label: 'Rejected', dot: 'bg-red-500',   rowClass: 'bg-red-50'   },
  pending:  { label: 'Pending',  dot: 'bg-amber-400', rowClass: 'bg-amber-50' },
};

interface CsvImportSummary {
  matched: number;
  unmatched: string[];
  outOfRange: string[];
}

export default function TeacherGrades() {
  const router = useRouter();
  const { refreshKey } = useRefresh();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [gradesData, setGradesData] = useState<GradeRow[]>([]);
  const [isSavingGrades, setIsSavingGrades] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [gradingLocked, setGradingLocked] = useState(false);
  const [passingThreshold, setPassingThreshold] = useState(75);
  const [csvSummary, setCsvSummary] = useState<CsvImportSummary | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [historyGradeId, setHistoryGradeId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { showAlert } = useAlert();

  const openHistory = async (gradeId: string) => {
    setHistoryGradeId(gradeId);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/grades/history?gradeId=${gradeId}`);
      const result = await res.json();
      setHistoryEntries(result.success ? result.data || [] : []);
    } catch {
      setHistoryEntries([]);
    } finally {
      setLoadingHistory(false);
    }
  };
  const { showConfirm } = useConfirm();

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && typeof d.settings?.passingThreshold === 'number') {
          setPassingThreshold(d.settings.passingThreshold);
        }
      })
      .catch(() => {});
  }, []);

  const statusSummary = useMemo(() => {
    return gradesData.reduce(
      (acc, s) => {
        if (s.status === 'approved') acc.approved++;
        else if (s.status === 'rejected') acc.rejected++;
        else if (s.status === 'pending') acc.pending++;
        else if (s.grade) acc.unsaved++;
        return acc;
      },
      { approved: 0, rejected: 0, pending: 0, unsaved: 0 }
    );
  }, [gradesData]);

  const updateGrade = (studentId: number, value: string) => {
    // Whole numbers 0–100 only: ignore keystrokes that aren't digits, cap at 100
    if (!/^\d*$/.test(value)) return;
    const clamped = value === '' ? '' : String(Math.min(100, Number(value)));
    setGradesData(prev =>
      prev.map(student =>
        student.id === studentId && student.status !== 'approved'
          ? { ...student, grade: clamped }
          : student
      )
    );
  };

  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (!storedTeacher) { router.push('/login?role=teacher'); return; }
    try {
      setTeacher(JSON.parse(storedTeacher));
    } catch {
      localStorage.removeItem('teacher');
      router.push('/login?role=teacher');
    }
  }, [router]);

  useEffect(() => {
    if (teacher && teacher.id) fetchTeacherClasses();
  }, [teacher]);

  useEffect(() => {
    if (teacher && teacher.id && selectedClassId) {
      setGradesData([]);
      fetchGradesData();
    }
  }, [teacher, selectedClassId, refreshKey]);

  const fetchTeacherClasses = async () => {
    if (!teacher || !teacher.id) return;
    try {
      const [classRes, periodRes] = await Promise.all([
        fetch(`/api/teacher/classes?teacherId=${teacher.id}`),
        fetch('/api/admin/academic-periods'),
      ]);
      const classData = await classRes.json();
      if (classData.success && classData.classes) {
        setTeacherClasses(classData.classes);
        if (classData.classes.length > 0 && !selectedClassId) setSelectedClassId(classData.classes[0].id);
      }
      const periodData = await periodRes.json();
      if (periodData.success && periodData.data) {
        const active = periodData.data.find((p: any) => p.isActive);
        setGradingLocked(active ? !active.isGradingOpen : false);
      }
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
    }
  };

  const fetchGradesData = async () => {
    if (!teacher || !teacher.id || !selectedClassId) return;
    const subject = teacherClasses.find(c => c.id === selectedClassId)?.class_name;
    if (!subject) return;
    setIsLoadingData(true);
    try {
      const response = await fetch(
        `/api/teacher/grades?teacherId=${teacher.id}&classId=${selectedClassId}&subject=${encodeURIComponent(subject)}`
      );
      const data = await response.json();
      if (data.success && data.data) setGradesData(data.data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!teacher || !teacher.id) {
      showAlert({ message: 'Teacher information not found', type: 'error' });
      return;
    }
    if (gradingLocked) {
      showAlert({ message: 'Grading period is locked. Contact your administrator.', type: 'error' });
      return;
    }
    const submittable = gradesData.filter(s => s.status !== 'approved' && s.grade !== '');
    if (submittable.length === 0) {
      showAlert({ message: 'No new or updated grades to submit.', type: 'warning' });
      return;
    }
    setIsSavingGrades(true);
    try {
      const results = await Promise.all(
        submittable.map(async student => {
          try {
            const res = await fetch('/api/grades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: student.id,
                subject: teacherClasses.find(c => c.id === selectedClassId)?.class_name || '',
                grade: Number(student.grade),
                teacherId: teacher.id,
                classId: selectedClassId,
              }),
            });
            return await res.json();
          } catch {
            return { success: false };
          }
        })
      );
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        showAlert({ message: `${failed.length} grade(s) failed to save.`, type: 'warning' });
      } else {
        showAlert({ message: 'Grades submitted for admin approval!', type: 'success' });
        await fetchGradesData();
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      showAlert({ message: 'Error saving grades. Please try again.', type: 'error' });
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let rows: string[][];
    try {
      rows = await readSheetFile(file);
    } catch {
      showAlert({ message: 'Could not read that file. Use a .xlsx or .csv file.', type: 'error' });
      return;
    }
    if (rows.length === 0) {
      showAlert({ message: 'The file appears to be empty.', type: 'warning' });
      return;
    }
    const { start, numberCol, gradeCol } = findGradeColumns(rows);

    const byStudentNumber = new Map(gradesData.map((s) => [s.studentId, s]));
    const unmatched: string[] = [];
    const outOfRange: string[] = [];
    const updates = new Map<number, string>();

    for (let i = start; i < rows.length; i++) {
      const studentNumber = (rows[i][numberCol] || '').trim();
      const gradeStr = (rows[i][gradeCol] || '').trim();
      if (!studentNumber) continue;
      const student = byStudentNumber.get(studentNumber);
      if (!student) {
        unmatched.push(studentNumber);
        continue;
      }
      if (student.status === 'approved') continue;
      const numeric = Number(gradeStr);
      if (gradeStr === '' || !Number.isInteger(numeric) || numeric < 0 || numeric > 100) {
        outOfRange.push(`${studentNumber} (${gradeStr || '—'})`);
        continue;
      }
      updates.set(student.id, numeric.toString());
    }

    if (updates.size > 0) {
      setGradesData((prev) =>
        prev.map((s) => (updates.has(s.id) ? { ...s, grade: updates.get(s.id)! } : s))
      );
    }
    setCsvSummary({ matched: updates.size, unmatched, outOfRange });
  };

  const handleExportExcel = async () => {
    if (!teacher || gradesData.length === 0) {
      showAlert({ message: 'No grades data to export.', type: 'warning' });
      return;
    }
    const { downloadExcel } = await import('@/lib/export-excel');
    const selectedClass = teacherClasses.find(c => c.id === selectedClassId);
    const className = selectedClass ? selectedClass.class_name : 'Class';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    await downloadExcel(`${className}_grades`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'STUDENT GRADES',
        `Class: ${className}`,
        `Generated: ${generated}`,
      ],
      columns: ['Student Number', 'Student Name', 'Grade', 'Status'],
      colWidths: [20, 40, 14, 18],
      rows: gradesData.map(s => [s.studentId || '', s.name || '', s.grade || '', s.status || 'Not submitted']),
      headerColor: 'red',
    });
    showAlert({ message: 'Grades exported successfully!', type: 'success' });
  };

  const handleExportPDF = () => {
    if (!teacher || gradesData.length === 0) {
      showAlert({ message: 'No grades data to export.', type: 'warning' });
      return;
    }
    const selectedClass = teacherClasses.find(c => c.id === selectedClassId);
    const className = selectedClass ? selectedClass.class_name : 'Class';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 105, 21, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('STUDENT GRADES', 105, 30, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Class: ${className}`, 105, 37, { align: 'center' });
    doc.text(`Generated: ${generated}`, 105, 42, { align: 'center' });

    autoTable(doc, {
      startY: 48,
      head: [['Student Number', 'Student Name', 'Grade', 'Status']],
      body: gradesData.map(s => [s.studentId || '', s.name || '', s.grade || '', s.status || 'Not submitted']),
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' } },
      margin: { left: 15, right: 15 },
    });

    doc.save(`${className}_grades.pdf`);
    showAlert({ message: 'Grades exported successfully!', type: 'success' });
  };

  const flatGrades = useMemo<FlatGradeRow[]>(() =>
    gradesData.map(g => ({
      ...g,
      statusLabel: g.status || (g.grade ? 'unsaved' : ''),
    })),
    [gradesData]
  );

  const tc = useTableControls(flatGrades, {
    searchFields: ['name', 'studentId'],
    defaultSort: { key: 'name', dir: 'asc' },
    pageSize: 25,
  });

  // Reset table state when class changes
  useEffect(() => {
    tc.clearFilters();
    tc.setPage(1);
  }, [selectedClassId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!teacher) return null;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Student Grades Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">View and update student grades for your classes</p>
        </div>
        <div className="p-5 space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Label htmlFor="class-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Class:
              </Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select" className="w-64 h-8 text-sm">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {teacherClasses.map(classItem => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.class_name} - {classItem.grade_level || ''} {classItem.section || ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClassId && gradesData.length > 0 && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white w-48"
                    placeholder="Search student..."
                    value={tc.search}
                    onChange={e => tc.setSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={tc.filters['statusLabel'] || 'all'}
                  onValueChange={v => tc.setFilter('statusLabel', v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="unsaved">Unsaved</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {selectedClassId && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">Subject:</span>
                <span className="text-sm font-medium text-gray-900">
                  {teacherClasses.find(c => c.id === selectedClassId)?.class_name || '—'}
                </span>
                {gradesData.length > 0 && (
                  <>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".xlsx,.csv,text/csv"
                      className="hidden"
                      onChange={handleImportCsv}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={gradingLocked}
                      onClick={() => csvInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Excel/CSV
                    </Button>
                    <ExportDropdown size="sm" onPDF={handleExportPDF} onExcel={handleExportExcel} />
                  </>
                )}
              </div>
            )}
          </div>

          {gradingLocked && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Grading Period is Locked</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Grade submission is currently disabled by the administrator. You can still view existing grades.
                </p>
              </div>
            </div>
          )}

          {isLoadingData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Loading grades data...</p>
            </div>
          ) : gradesData.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-1">No students enrolled in this class</p>
              <p className="text-sm text-gray-400">Students must be enrolled through the admin panel</p>
            </div>
          ) : (
            <>
              {csvSummary && (
                <div className="flex items-start gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                  <Upload className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-blue-800">
                    <p>
                      Imported <strong>{csvSummary.matched}</strong> grade{csvSummary.matched !== 1 ? 's' : ''} into the table below.
                      Review the values, then click Submit Grades to save.
                    </p>
                    {csvSummary.unmatched.length > 0 && (
                      <p className="text-amber-700 mt-1">
                        Not found in this class: {csvSummary.unmatched.join(', ')}
                      </p>
                    )}
                    {csvSummary.outOfRange.length > 0 && (
                      <p className="text-red-700 mt-1">
                        Skipped (grade must be a whole number 0-100): {csvSummary.outOfRange.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCsvSummary(null)}
                    className="text-blue-400 hover:text-blue-700 active:scale-90 transition-[color,transform] duration-150 ease-out text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Status Summary Banner */}
              {(statusSummary.approved > 0 || statusSummary.rejected > 0 || statusSummary.pending > 0) && (
                <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                  {statusSummary.approved > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {statusSummary.approved} Approved
                    </span>
                  )}
                  {statusSummary.pending > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                      <Clock className="w-4 h-4" />
                      {statusSummary.pending} Pending review
                    </span>
                  )}
                  {statusSummary.rejected > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-red-700 font-medium">
                      <XCircle className="w-4 h-4" />
                      {statusSummary.rejected} Rejected — update and resubmit
                    </span>
                  )}
                </div>
              )}

              {/* Grades Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[550px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <SortHeader label="Student Name" sortKey="name"        currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
                      <SortHeader label="Student No."  sortKey="studentId"   currentSort={tc.sort} onSort={tc.toggleSort} />
                      <SortHeader label="Grade"        sortKey="grade"       currentSort={tc.sort} onSort={tc.toggleSort} />
                      <SortHeader label="Status"       sortKey="statusLabel" currentSort={tc.sort} onSort={tc.toggleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tc.rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">No students match your search.</td>
                      </tr>
                    ) : (
                      tc.rows.map(student => {
                        const cfg = student.status ? STATUS_CONFIG[student.status] : null;
                        const isApproved = student.status === 'approved';
                        return (
                          <tr key={student.id} className={cfg ? cfg.rowClass : 'hover:bg-gray-50'}>
                            <td className="px-4 py-2.5 pl-4 text-sm font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-[12px] text-gray-500">{student.studentId}</span>
                            </td>
                            <td className="px-4 py-2.5 w-44">
                              {isApproved ? (
                                <span className={`font-semibold text-sm ${parseFloat(student.grade) >= passingThreshold ? 'text-yellow-700' : 'text-red-700'}`}>
                                  {student.grade}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={3}
                                    value={student.grade}
                                    onChange={e => updateGrade(student.id, e.target.value)}
                                    disabled={gradingLocked}
                                    className={`text-center h-8 text-sm ${
                                      gradingLocked
                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        : student.status === 'rejected'
                                          ? 'bg-red-50 text-red-900'
                                          : student.status === 'pending'
                                            ? 'bg-amber-50 text-amber-900'
                                            : ''
                                    }`}
                                    placeholder="—"
                                  />
                                  {student.grade !== '' && !isNaN(parseFloat(student.grade)) && (
                                    <span
                                      className={`text-[10px] font-semibold shrink-0 ${
                                        parseFloat(student.grade) >= passingThreshold ? 'text-green-600' : 'text-red-500'
                                      }`}
                                    >
                                      {parseFloat(student.grade) >= passingThreshold ? 'PASS' : 'FAIL'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              {cfg ? (
                                <span className="inline-flex items-center gap-1.5 text-sm">
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  <span className="text-gray-700">{cfg.label}</span>
                                  {student.reviewedAt && isApproved && (
                                    <span className="ml-1 text-xs text-gray-400">
                                      {new Date(student.reviewedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                  {student.gradeId && (
                                    <button
                                      type="button"
                                      onClick={() => openHistory(student.gradeId!)}
                                      className="ml-1 text-xs text-gray-400 underline hover:text-gray-700"
                                    >
                                      History
                                    </button>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                              {student.status === 'rejected' && student.rejectionReason && (
                                <p className="mt-0.5 text-xs text-red-700">Reason: {student.rejectionReason}</p>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
                {tc.pageCount > 1 && (
                  <div className="px-4 py-2.5 border-t border-gray-100">
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

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-50 inline-block border border-green-200" />
                  Approved — read-only, finalized by admin
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-50 inline-block border border-amber-200" />
                  Pending — awaiting admin review
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-red-50 inline-block border border-red-200" />
                  Rejected — update and resubmit
                </span>
              </div>


              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={handleSaveGrades}
                  disabled={isSavingGrades || gradingLocked}
                  title={gradingLocked ? 'Grading period is locked' : undefined}
                  className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                >
                  {isSavingGrades ? (
                    <>
                      <Save className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : gradingLocked ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Grading Locked
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit Grades
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={!!historyGradeId} onOpenChange={(open) => !open && setHistoryGradeId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              Grade History
            </DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : historyEntries.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No review history yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {historyEntries.map((h) => {
                const cfg = STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                const reviewer = Array.isArray(h.reviewer) ? h.reviewer[0] : h.reviewer;
                return (
                  <div key={h.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {h.status === 'pending' ? 'Submitted' : cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(h.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1.5">
                      Grade: <span className="font-semibold">{h.grade_value}</span>
                      {reviewer && (
                        <span className="text-gray-400"> · by {reviewer.first_name} {reviewer.last_name}</span>
                      )}
                    </p>
                    {h.rejection_reason && (
                      <p className="text-sm text-gray-500 mt-1 bg-gray-50 rounded-lg px-3 py-2">{h.rejection_reason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryGradeId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
