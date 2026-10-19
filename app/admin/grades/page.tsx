'use client';

import { formatDate, formatDateTime } from '@/lib/format-date';
import { SchoolYearTabs } from '@/components/admin/school-year-tabs';
import { normalizeSchoolYear } from '@/lib/school-year';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import { findGradeColumns, readSheetFile } from '@/lib/csv';
import { useRefresh } from '@/lib/refresh-context';
import { useAlert } from '@/lib/use-alert';
import { useConfirm } from '@/lib/use-confirm';
import { useDeletePrompt } from '@/lib/use-delete-prompt';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CheckCircle,
  CheckCircle2,
  GraduationCap,
  History,
  Search,
  Undo2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

type GradeStatus = 'pending' | 'approved' | 'rejected';

interface GradeEntry {
  id: string;
  grade: number;
  subject: string;
  status: GradeStatus;
  quarter: number | null;
  // false when the grade is from a past semester/quarter (computed by the API)
  is_current?: boolean;
  class?: { school_year: string | null } | null;
  created_at: string | null;
  updated_at: string | null;
  reviewed_at: string | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  } | null;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  reviewer: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface SubjectGroup {
  key: string;
  subject: string;
  quarter: number | null;
  teacher: GradeEntry['teacher'];
  entries: GradeEntry[];
  pendingCount: number;
}

type FilterTab = 'all' | GradeStatus;

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    dot: 'bg-amber-400',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  approved: {
    label: 'Approved',
    dot: 'bg-green-500',
    text: 'text-green-700',
    bg: 'bg-green-50',
  },
  rejected: {
    label: 'Rejected',
    dot: 'bg-red-500',
    text: 'text-red-700',
    bg: 'bg-red-50',
  },
};

// Green is reserved for approved AND passing — an approved-but-failing grade
// gets its own color so the dot never implies "all good" on a failed grade.
function getStatusVisual(status: GradeStatus, isPassing: boolean) {
  if (status === 'approved' && !isPassing) {
    return {
      label: 'Approved (Failed)',
      dot: 'bg-orange-500',
      text: 'text-orange-700',
      bg: 'bg-orange-50',
    };
  }
  return STATUS_CONFIG[status];
}

// Past-period grades are archived (hidden) unless still pending review
const isArchived = (g: GradeEntry) => g.is_current === false && g.status !== 'pending';

export default function AdminGradesPage() {
  const { admin } = useAuth();
  const { refreshKey } = useRefresh();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { showDeletePrompt } = useDeletePrompt();

  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [schoolYear, setSchoolYear] = useState('');
  const [activeYear, setActiveYear] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('');
  const [reviewingGrade, setReviewingGrade] = useState<GradeEntry | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [passingThreshold, setPassingThreshold] = useState(75);
  const [historyGradeId, setHistoryGradeId] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [csvMismatches, setCsvMismatches] = useState<Map<string, string>>(new Map());
  const [csvVerifySummary, setCsvVerifySummary] = useState<{ checked: number; mismatched: number; unmatched: string[] } | null>(null);
  const csvVerifyInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && typeof d.settings?.passingThreshold === 'number') {
          setPassingThreshold(d.settings.passingThreshold);
        }
      })
      .catch(() => {});
  }, []);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/grades');
      const result = await response.json();
      if (result.success) {
        setGrades(result.data || []);
      } else {
        showAlert({
          message: result.error || 'Failed to load grades.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades, refreshKey]);

  // School year tab, then quarter drop-down. Grades without a class school
  // year (legacy rows) stay visible under every tab.
  const yearGrades = useMemo(
    () =>
      grades.filter((g) => {
        const sy = g.class?.school_year;
        if (schoolYear && sy && normalizeSchoolYear(sy) !== schoolYear) return false;
        if (quarterFilter && String(g.quarter ?? '') !== quarterFilter) return false;
        return true;
      }),
    [grades, schoolYear, quarterFilter]
  );
  // Archiving only applies to the current year; a past year's tab shows all of it
  const archiveApplies = !schoolYear || schoolYear === activeYear;
  const archivedCount = useMemo(
    () => (archiveApplies ? yearGrades.filter(isArchived).length : 0),
    [yearGrades, archiveApplies]
  );
  const visibleGrades = useMemo(
    () => (showArchived || !archiveApplies ? yearGrades : yearGrades.filter((g) => !isArchived(g))),
    [yearGrades, showArchived, archiveApplies]
  );

  const counts = useMemo(
    () => ({
      total: visibleGrades.length,
      pending: visibleGrades.filter((g) => g.status === 'pending').length,
      approved: visibleGrades.filter((g) => g.status === 'approved').length,
      rejected: visibleGrades.filter((g) => g.status === 'rejected').length,
    }),
    [visibleGrades]
  );

  const filteredGrades = useMemo(() => {
    return visibleGrades.filter((g) => {
      const matchesTab = activeTab === 'all' || g.status === activeTab;
      const q = searchTerm.toLowerCase();
      const studentName =
        `${g.student?.first_name ?? ''} ${g.student?.last_name ?? ''}`.toLowerCase();
      const teacherName =
        `${g.teacher?.first_name ?? ''} ${g.teacher?.last_name ?? ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        studentName.includes(q) ||
        teacherName.includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        (g.student?.student_number ?? '').toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [visibleGrades, activeTab, searchTerm]);

  const subjectGroups = useMemo(() => {
    const map = new Map<string, SubjectGroup>();
    for (const g of filteredGrades) {
      const key = `${g.subject}__${g.teacher?.id || 'unknown'}__${g.quarter ?? ''}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subject: g.subject,
          quarter: g.quarter,
          teacher: g.teacher,
          entries: [],
          pendingCount: 0,
        });
      }
      const group = map.get(key)!;
      group.entries.push(g);
      if (g.status === 'pending') group.pendingCount++;
    }
    for (const group of map.values()) {
      group.entries.sort((a, b) =>
        (a.student?.last_name ?? '').localeCompare(b.student?.last_name ?? '')
      );
    }
    return Array.from(map.values()).sort(
      (a, b) => b.pendingCount - a.pendingCount
    );
  }, [filteredGrades]);

  const selectedGroup = useMemo(
    () => subjectGroups.find((g) => g.key === selectedGroupKey) || null,
    [subjectGroups, selectedGroupKey]
  );

  useEffect(() => {
    if (subjectGroups.length > 0 && !selectedGroup) {
      setSelectedGroupKey(subjectGroups[0].key);
    }
  }, [subjectGroups, selectedGroup]);

  useEffect(() => {
    setSelectedIds(new Set());
    setCsvMismatches(new Map());
    setCsvVerifySummary(null);
  }, [selectedGroupKey]);

  const handleVerifyCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedGroup) return;
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
    const byStudentNumber = new Map(
      selectedGroup.entries.map((entry) => [entry.student?.student_number, entry])
    );

    const mismatches = new Map<string, string>();
    const unmatched: string[] = [];
    let checked = 0;

    for (let i = start; i < rows.length; i++) {
      const studentNumber = (rows[i][numberCol] || '').trim();
      const csvGrade = (rows[i][gradeCol] || '').trim();
      if (!studentNumber) continue;
      const entry = byStudentNumber.get(studentNumber);
      if (!entry) {
        unmatched.push(studentNumber);
        continue;
      }
      checked++;
      const csvNumeric = parseFloat(csvGrade);
      if (!isNaN(csvNumeric) && csvNumeric !== entry.grade) {
        mismatches.set(entry.id, csvGrade);
      }
    }

    setCsvMismatches(mismatches);
    setCsvVerifySummary({ checked, mismatched: mismatches.size, unmatched });
  };

  const handleReview = async (
    grade: GradeEntry,
    status: 'approved' | 'rejected'
  ) => {
    const studentName = grade.student
      ? `${grade.student.first_name} ${grade.student.last_name}`
      : 'this student';
    // Rejecting an approved grade = "Return to teacher": it reopens for editing
    const returning = grade.status === 'approved';

    let rejectionReason = '';
    if (status === 'rejected') {
      const result = await showDeletePrompt({
        title: returning ? 'Return Grade to Teacher' : 'Reject Grade',
        message: returning
          ? `Return the approved ${grade.subject} grade (${grade.grade}) for ${studentName} to the teacher? It will be unlocked so the teacher can correct and resubmit it.`
          : `Reject the ${grade.subject} grade (${grade.grade}) for ${studentName}? The submitting teacher will be notified.`,
        confirmText: returning ? 'Return' : 'Reject',
        cancelText: 'Cancel',
        reasonLabel: returning ? 'Reason for returning' : 'Reason for rejection',
        reasonRequired: true,
      });
      if (!result?.confirmed) return;
      rejectionReason = result.reason;
    } else {
      const confirmed = await showConfirm({
        title: 'Approve Grade',
        message: `Are you sure you want to approve the ${grade.subject} grade (${grade.grade}) for ${studentName}?`,
      });
      if (!confirmed) return;
    }

    setProcessingId(grade.id);
    try {
      const response = await fetch('/api/admin/grades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grade.id,
          status,
          reviewedBy: admin?.id ?? null,
          rejection_reason: status === 'rejected' ? rejectionReason : undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showAlert({
          message: returning
            ? 'Grade returned to the teacher for correction.'
            : `Grade ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
          type: 'success',
        });
        fetchGrades();
      } else {
        showAlert({
          message: result.error || `Failed to ${status} grade.`,
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleBatchApprove = async (group: SubjectGroup) => {
    const pendingIds = group.entries
      .filter((e) => e.status === 'pending')
      .map((e) => e.id);
    if (pendingIds.length === 0) return;
    const confirmed = await showConfirm({
      title: pendingIds.length === 1 ? 'Approve Grade' : 'Approve All Grades',
      message:
        pendingIds.length === 1
          ? `Are you sure you want to approve the pending grade for ${group.subject}?`
          : `Are you sure you want to approve all ${pendingIds.length} pending grades for ${group.subject}?`,
    });
    if (!confirmed) return;

    setBatchProcessing(true);
    try {
      const response = await fetch('/api/admin/grades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: pendingIds,
          status: 'approved',
          reviewedBy: admin?.id ?? null,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showAlert({
          message: `${result.count || pendingIds.length} grades approved successfully.`,
          type: 'success',
        });
        fetchGrades();
      } else {
        showAlert({
          message: result.error || 'Failed to batch approve grades.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchAction = async (status: 'approved' | 'rejected') => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);

    let rejectionReason = '';
    if (status === 'rejected') {
      const result = await showDeletePrompt({
        title: 'Reject Selected Grades',
        message: `Reject ${ids.length} selected grade${ids.length !== 1 ? 's' : ''}? The submitting teachers will be notified.`,
        confirmText: 'Reject',
        cancelText: 'Cancel',
        reasonLabel: 'Reason for rejection',
        reasonRequired: true,
      });
      if (!result?.confirmed) return;
      rejectionReason = result.reason;
    } else {
      const confirmed = await showConfirm({
        title: 'Approve Selected',
        message: `Are you sure you want to approve ${ids.length} selected grade${ids.length !== 1 ? 's' : ''}?`,
      });
      if (!confirmed) return;
    }

    setBatchProcessing(true);
    try {
      const response = await fetch('/api/admin/grades', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          status,
          reviewedBy: admin?.id ?? null,
          rejection_reason: status === 'rejected' ? rejectionReason : undefined,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showAlert({
          message: `${result.count || ids.length} grades ${status}.`,
          type: 'success',
        });
        setSelectedIds(new Set());
        fetchGrades();
      } else {
        showAlert({ message: result.error || 'Action failed.', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setBatchProcessing(false);
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (group: SubjectGroup) => {
    const pendingIds = group.entries
      .filter((e) => e.status === 'pending')
      .map((e) => e.id);
    const allSelected = pendingIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pendingIds.forEach((id) => next.delete(id));
      else pendingIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleExportExcel = async () => {
    const { downloadExcel } = await import('@/lib/export-excel');
    const date = formatDate(new Date());
    const tab =
      activeTab !== 'all'
        ? ` — ${STATUS_CONFIG[activeTab as GradeStatus]?.label ?? activeTab}`
        : '';
    await downloadExcel(
      `grade-approvals-${new Date().toISOString().slice(0, 10)}`,
      {
        title: [
          'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
          `Grade Approvals Report${tab}`,
          `Generated: ${date}`,
        ],
        columns: [
          'Student',
          'LRN',
          'Subject',
          'Teacher',
          'Grade',
          'Status',
          'Submitted',
        ],
        colWidths: [36, 18, 28, 30, 12, 16, 18],
        rows: filteredGrades.map((g) => [
          g.student ? `${g.student.first_name} ${g.student.last_name}` : 'N/A',
          g.student?.student_number || 'N/A',
          g.subject,
          g.teacher ? `${g.teacher.first_name} ${g.teacher.last_name}` : 'N/A',
          g.grade,
          STATUS_CONFIG[g.status]?.label ?? g.status,
          formatDate(g.created_at, ''),
        ]),
        headerColor: 'red',
      }
    );
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    doc.setFontSize(16);
    doc.text('Sto. Niño de Praga Academy', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Grade Approvals Report', 105, 23, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generated: ${formatDate(new Date())}`, 105, 30, {
      align: 'center',
    });
    const tableData = filteredGrades.map((g) => [
      g.student ? `${g.student.first_name} ${g.student.last_name}` : 'N/A',
      g.student?.student_number || 'N/A',
      g.subject,
      g.teacher ? `${g.teacher.first_name} ${g.teacher.last_name}` : 'N/A',
      g.grade,
      g.status.charAt(0).toUpperCase() + g.status.slice(1),
    ]);
    autoTable(doc, {
      startY: 36,
      head: [
        ['Student', 'LRN', 'Subject', 'Teacher', 'Grade', 'Status'],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 4: { halign: 'center' }, 5: { halign: 'center' } },
    });
    doc.save(`grade-approvals-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-gray-700" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Grade Approvals
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Review and approve grades submitted by faculty
            </p>
          </div>
        </div>
        <ExportDropdown
          onPDF={handleExportPDF}
          onExcel={handleExportExcel}
          disabled={filteredGrades.length === 0}
          size="sm"
        />
      </div>

      {/* Stat Cards — clickable filters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            {
              label: 'Total',
              value: counts.total,
              tab: 'all' as FilterTab,
              accent: 'border-gray-200',
            },
            {
              label: 'Pending',
              value: counts.pending,
              tab: 'pending' as FilterTab,
              accent: 'border-amber-300',
            },
            {
              label: 'Approved',
              value: counts.approved,
              tab: 'approved' as FilterTab,
              accent: 'border-green-300',
            },
            {
              label: 'Rejected',
              value: counts.rejected,
              tab: 'rejected' as FilterTab,
              accent: 'border-red-300',
            },
          ] as const
        ).map((s) => (
          <button
            key={s.tab}
            onClick={() => setActiveTab(s.tab)}
            className={`text-left bg-white rounded-xl border-2 shadow-sm p-4 active:scale-[0.97] transition-[border-color,box-shadow,transform] duration-150 ease-out hover:shadow-md ${
              activeTab === s.tab
                ? `${s.accent} ring-1 ring-inset ring-gray-900/5`
                : 'border-gray-200'
            }`}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                activeTab === s.tab
                  ? s.tab === 'pending'
                    ? 'text-amber-600'
                    : s.tab === 'approved'
                      ? 'text-green-600'
                      : s.tab === 'rejected'
                        ? 'text-red-600'
                        : 'text-gray-900'
                  : 'text-gray-900'
              }`}
            >
              {s.value}
            </p>
          </button>
        ))}
      </div>

      <SchoolYearTabs value={schoolYear} onChange={setSchoolYear} onActiveYear={setActiveYear} />

      {/* Search toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <select
          value={quarterFilter}
          onChange={(e) => setQuarterFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          aria-label="Quarter"
        >
          <option value="">All quarters</option>
          {[1, 2, 3, 4].map((q) => (
            <option key={q} value={q}>
              Quarter {q}
            </option>
          ))}
        </select>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            placeholder="Search by student, teacher, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {archivedCount > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show archived ({archivedCount} from past periods)
          </label>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
        </div>
      ) : filteredGrades.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex flex-col items-center text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-base font-semibold text-gray-600">
            No grades found
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm || activeTab !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'No grades have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Left Panel: Subject Groups */}
          <div className="w-64 flex-shrink-0 space-y-1.5 max-h-[calc(100vh-360px)] overflow-y-auto pr-0.5">
            {subjectGroups.map((group) => {
              const isSelected = selectedGroupKey === group.key;
              return (
                <button
                  key={group.key}
                  onClick={() => setSelectedGroupKey(group.key)}
                  className={`w-full text-left p-3.5 rounded-xl border active:scale-[0.97] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out ${
                    isSelected
                      ? 'bg-gray-900 border-gray-900 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold text-sm leading-tight truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}
                      >
                        {group.subject}
                        {group.quarter ? ` · Q${group.quarter}` : ''}
                      </p>
                      <p
                        className={`text-xs truncate mt-0.5 ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {group.teacher ? (
                          `${group.teacher.first_name} ${group.teacher.last_name}`
                        ) : (
                          <span className="italic">No teacher</span>
                        )}
                      </p>
                      <p
                        className={`text-xs mt-1.5 ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        {group.entries.length} student
                        {group.entries.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {group.pendingCount > 0 && (
                      <span
                        className={`text-xs font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                          isSelected
                            ? 'bg-amber-400 text-amber-900'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {group.pendingCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Panel: Student Grades */}
          <div className="flex-1 min-w-0">
            {selectedGroup ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* Panel header */}
                <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedGroup.subject}
                      {selectedGroup.quarter ? ` · Q${selectedGroup.quarter}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedGroup.teacher ? (
                        `${selectedGroup.teacher.first_name} ${selectedGroup.teacher.last_name}`
                      ) : (
                        <span className="text-gray-300">
                          No teacher assigned
                        </span>
                      )}
                      <span className="mx-1.5 text-gray-300">·</span>
                      {selectedGroup.entries.length} student
                      {selectedGroup.entries.length !== 1 ? 's' : ''}
                      {selectedGroup.pendingCount > 0 && (
                        <>
                          <span className="mx-1.5 text-gray-300">·</span>
                          <span className="text-amber-600 font-medium">
                            {selectedGroup.pendingCount} pending
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={csvVerifyInputRef}
                      type="file"
                      accept=".xlsx,.csv"
                      className="hidden"
                      onChange={handleVerifyCsv}
                    />
                    <Button
                      onClick={() => csvVerifyInputRef.current?.click()}
                      size="sm"
                      variant="outline"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Verify Excel/CSV
                    </Button>
                    {selectedIds.size > 0 ? (
                      <>
                        <Button
                          onClick={() => handleBatchAction('rejected')}
                          disabled={batchProcessing}
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Reject ({selectedIds.size})
                        </Button>
                        <Button
                          onClick={() => handleBatchAction('approved')}
                          disabled={batchProcessing}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Approve ({selectedIds.size})
                        </Button>
                      </>
                    ) : (
                      selectedGroup.pendingCount > 0 && (
                        <Button
                          onClick={() => handleBatchApprove(selectedGroup)}
                          disabled={batchProcessing}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          {batchProcessing
                            ? 'Approving...'
                            : selectedGroup.pendingCount === 1
                              ? 'Approve'
                              : `Approve All (${selectedGroup.pendingCount})`}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {csvVerifySummary && (
                  <div className="px-5 py-2.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-800 flex items-center justify-between">
                    <span>
                      Checked {csvVerifySummary.checked} grade(s) against CSV —{' '}
                      {csvVerifySummary.mismatched > 0 ? (
                        <span className="font-semibold text-red-700">
                          {csvVerifySummary.mismatched} mismatch{csvVerifySummary.mismatched !== 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span className="font-semibold text-green-700">no mismatches</span>
                      )}
                      {csvVerifySummary.unmatched.length > 0 &&
                        ` · ${csvVerifySummary.unmatched.length} student number(s) not found: ${csvVerifySummary.unmatched.join(', ')}`}
                    </span>
                    <button
                      onClick={() => setCsvVerifySummary(null)}
                      className="text-blue-400 hover:text-blue-600 shrink-0 ml-3"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto">
                <table className="w-full min-w-[880px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="pl-4 pr-2 py-2.5 w-8">
                        {selectedGroup.pendingCount > 0 && (
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-gray-900 focus:ring-gray-900/10 cursor-pointer"
                            checked={selectedGroup.entries
                              .filter((e) => e.status === 'pending')
                              .every((e) => selectedIds.has(e.id))}
                            onChange={() => toggleSelectGroup(selectedGroup)}
                          />
                        )}
                      </th>
                      <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        LRN
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-2.5 pr-5 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedGroup.entries.map((entry) => {
                      const isPassing = entry.grade >= passingThreshold;
                      const cfg = getStatusVisual(entry.status, isPassing);
                      const isChecked = selectedIds.has(entry.id);
                      return (
                        <tr
                          key={entry.id}
                          className={`group cursor-pointer ${isChecked ? 'bg-blue-50' : `${cfg?.bg ?? ''} hover:bg-gray-50`}`}
                        >
                          <td
                            className="pl-4 pr-2 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {entry.status === 'pending' && (
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-gray-900 focus:ring-gray-900/10 cursor-pointer"
                                checked={isChecked}
                                onChange={() => toggleSelectId(entry.id)}
                              />
                            )}
                          </td>
                          <td
                            className="px-3 py-3 text-sm font-medium text-gray-900"
                            onClick={() => setReviewingGrade(entry)}
                          >
                            {entry.student ? (
                              `${entry.student.last_name}, ${entry.student.first_name}`
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td
                            className="px-4 py-3"
                            onClick={() => setReviewingGrade(entry)}
                          >
                            <span className="font-mono text-[12px] text-gray-500">
                              {entry.student?.student_number ?? (
                                <span className="text-gray-300">—</span>
                              )}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3"
                            onClick={() => setReviewingGrade(entry)}
                          >
                            <span
                              className={`text-sm font-bold tabular-nums ${isPassing ? 'text-gray-900' : 'text-red-600'}`}
                            >
                              {entry.grade}
                            </span>
                            {isPassing ? (
                              <span className="ml-1.5 text-[10px] font-medium text-green-500">
                                PASSED
                              </span>
                            ) : (
                              <span className="ml-1.5 text-[10px] font-medium text-red-400">
                                FAILED
                              </span>
                            )}
                            {csvMismatches.has(entry.id) && (
                              <span
                                title={`CSV has ${csvMismatches.get(entry.id)}`}
                                className="ml-1.5 text-[10px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded"
                              >
                                CSV: {csvMismatches.get(entry.id)}
                              </span>
                            )}
                          </td>
                          <td
                            className="px-4 py-3"
                            onClick={() => setReviewingGrade(entry)}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                              />
                              <span className="text-xs text-gray-600">
                                {cfg.label}
                              </span>
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-sm text-gray-500"
                            onClick={() => setReviewingGrade(entry)}
                          >
                            {entry.created_at ? (
                              formatDate(entry.created_at)
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 pr-5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {entry.status !== 'pending' && (
                                <button
                                  type="button"
                                  title="View history"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openHistory(entry.id);
                                  }}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <span
                                onClick={() => setReviewingGrade(entry)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md active:scale-95 transition-[background-color,transform] duration-150 ease-out cursor-pointer"
                              >
                                {entry.status === 'pending' ? 'Review' : 'View'} →
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>

                <div className="px-5 py-2.5 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">
                    {selectedGroup.entries.length} student
                    {selectedGroup.entries.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex items-center justify-center text-gray-400 text-sm">
                Select a subject from the left to view grades
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!reviewingGrade}
        onOpenChange={(open) => !open && setReviewingGrade(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Review</DialogTitle>
          </DialogHeader>
          {reviewingGrade &&
            (() => {
              const isPassing = reviewingGrade.grade >= passingThreshold;
              const cfg = getStatusVisual(reviewingGrade.status, isPassing);
              return (
                <div className="space-y-4">
                  {/* Grade highlight */}
                  <div
                    className={`rounded-xl p-5 text-center ${isPassing ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    <p
                      className={`text-5xl font-bold tabular-nums ${isPassing ? 'text-green-700' : 'text-red-600'}`}
                    >
                      {reviewingGrade.grade}
                    </p>
                    <p
                      className={`text-sm font-semibold mt-1 ${isPassing ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {isPassing ? 'Passing' : 'Failing'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {reviewingGrade.subject}
                    </p>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        Student
                      </p>
                      <p className="text-gray-900 font-medium">
                        {reviewingGrade.student
                          ? `${reviewingGrade.student.first_name} ${reviewingGrade.student.last_name}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        LRN
                      </p>
                      <p className="font-mono text-gray-900">
                        {reviewingGrade.student?.student_number ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        Teacher
                      </p>
                      <p className="text-gray-900">
                        {reviewingGrade.teacher
                          ? `${reviewingGrade.teacher.first_name} ${reviewingGrade.teacher.last_name}`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                        Submitted
                      </p>
                      <p className="text-gray-900">
                        {reviewingGrade.created_at
                          ? formatDate(reviewingGrade.created_at)
                          : '—'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                        />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          <DialogFooter className="gap-2 sm:gap-2">
            {reviewingGrade?.status === 'pending' ? (
              <>
                <Button
                  onClick={async () => {
                    const grade = reviewingGrade;
                    setReviewingGrade(null);
                    await handleReview(grade, 'rejected');
                  }}
                  disabled={processingId === reviewingGrade.id}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  onClick={async () => {
                    const grade = reviewingGrade;
                    setReviewingGrade(null);
                    await handleReview(grade, 'approved');
                  }}
                  disabled={processingId === reviewingGrade.id}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Approve
                </Button>
              </>
            ) : (
              <>
                {/* Only current-period grades: the teacher can't resubmit an archived quarter */}
                {reviewingGrade?.status === 'approved' && reviewingGrade.is_current !== false && (
                  <Button
                    onClick={async () => {
                      const grade = reviewingGrade;
                      setReviewingGrade(null);
                      await handleReview(grade, 'rejected');
                    }}
                    disabled={processingId === reviewingGrade.id}
                    variant="outline"
                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <Undo2 className="h-4 w-4 mr-1.5" />
                    Return to Teacher
                  </Button>
                )}
                <Button variant="outline" onClick={() => setReviewingGrade(null)}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!historyGradeId}
        onOpenChange={(open) => !open && setHistoryGradeId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <History className="h-4 w-4 text-gray-400" />
              Review History
            </DialogTitle>
          </DialogHeader>
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : historyEntries.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No review history yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {historyEntries.map((h) => {
                const cfg = STATUS_CONFIG[h.status as GradeStatus] ?? STATUS_CONFIG.pending;
                const reviewer = Array.isArray(h.reviewer) ? h.reviewer[0] : h.reviewer;
                return (
                  <div key={h.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(h.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1.5">
                      Grade: <span className="font-semibold">{h.grade_value}</span>
                      {reviewer && (
                        <span className="text-gray-400"> · by {reviewer.first_name} {reviewer.last_name}</span>
                      )}
                    </p>
                    {h.rejection_reason && (
                      <p className="text-sm text-gray-500 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                        {h.rejection_reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryGradeId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
