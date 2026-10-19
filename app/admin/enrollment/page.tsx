'use client';

import { formatDate } from '@/lib/format-date';
import { SchoolYearTabs } from '@/components/admin/school-year-tabs';
import { normalizeSchoolYear } from '@/lib/school-year';
import { friendlyError } from '@/lib/error-message';
import { useRefresh } from '@/lib/refresh-context';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTableControls } from '@/hooks/use-table-controls';
import { useAlert } from '@/lib/use-alert';
import { sortGradeLevels } from '@/lib/utils';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  Search,
  User2,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface StudentInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface EnrollmentRequest {
  id: string;
  student_id: string;
  grade_level: string;
  strand: string | null;
  school_year: string;
  quarter: number | null;
  entry_quarter: number | null;
  enrollment_type: 'new' | 'returning' | 'transferee' | 'returnee' | 'repeater' | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  assigned_class_id: string | null;
  assigned_section_id: string | null;
  created_at: string;
  previous_grades_url: string | null;
  student: StudentInfo | null;
}

type FlatEnrollment = EnrollmentRequest & { studentName: string };

interface ClassOption {
  id: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
}

interface SectionOption {
  id: string;
  name: string;
  grade_level: string;
  school_year: string;
  max_capacity: number;
  student_count: number;
  class_count: number;
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  dot: 'bg-amber-400' },
  approved: { label: 'Approved', dot: 'bg-green-500'  },
  rejected: { label: 'Rejected', dot: 'bg-red-500'    },
};

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  new:        { label: 'New',        className: 'bg-blue-50   text-blue-700   border-blue-200'   },
  returning:  { label: 'Returning',  className: 'bg-green-50  text-green-700  border-green-200'  },
  transferee: { label: 'Transferee', className: 'bg-amber-50  text-amber-700  border-amber-200'  },
  returnee:   { label: 'Returnee',   className: 'bg-purple-50 text-purple-700 border-purple-200' },
  repeater:   { label: 'Repeater',   className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

function EnrollmentTypeBadge({ type }: { type: string | null | undefined }) {
  const cfg = type ? (TYPE_CONFIG[type] ?? { label: type, className: 'bg-gray-50 text-gray-600 border-gray-200' }) : null;
  if (!cfg) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function getStudentName(req: EnrollmentRequest) {
  if (!req.student) return req.student_id;
  const { first_name, last_name, email } = req.student;
  if (first_name && last_name) return `${first_name} ${last_name}`;
  return email ?? req.student_id;
}

export default function AdminEnrollmentPage() {
  const { showAlert } = useAlert();

  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [assignedClassId, setAssignedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  // Phase 3: section-based assignment
  const [sectionsFromDB, setSectionsFromDB] = useState<SectionOption[]>([]);
  const [assignedSectionId, setAssignedSectionId] = useState('');
  const [sectionsFetching, setSectionsFetching] = useState(false);
  // Phase 4: entry quarter for transferees / returnees
  const [entryQuarter, setEntryQuarter] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectOtherText, setRejectOtherText] = useState('');
  const [showRejectSection, setShowRejectSection] = useState(false);
  const [submitting, setSubmitting] = useState<'approved' | 'rejected' | null>(null);
  const [classAutoSelected, setClassAutoSelected] = useState(false);

  const REJECT_PRESETS = [
    'Incomplete documents',
    'Over capacity',
    'Wrong grade level',
    'Failed requirements',
    'Duplicate submission',
    'Other',
  ];
  const { refreshKey, triggerRefresh } = useRefresh();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/enrollment-requests');
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success) setRequests(payload.data ?? []);
    } catch (e) {
      console.error('Failed to fetch enrollment requests', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success) setClasses(payload.classes ?? []);
    } catch (e) {
      console.error('Failed to fetch classes', e);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchClasses();
  }, [fetchRequests, fetchClasses, refreshKey]);

  const openModal = async (req: EnrollmentRequest) => {
    setSelectedRequest(req);
    setAdminNotes(req.admin_notes ?? '');
    setSelectedSection('');
    setAssignedClassId('');
    setAssignedSectionId('');
    setSectionsFromDB([]);
    setEntryQuarter(req.entry_quarter ? String(req.entry_quarter) : '');
    setRejectReason('');
    setRejectOtherText('');
    setShowRejectSection(false);
    setClassAutoSelected(false);
    setModalOpen(true);

    if (req.status !== 'pending') return;

    // ── Fetch formal sections from DB for this grade + school year ────────────
    setSectionsFetching(true);
    try {
      const params = new URLSearchParams({ gradeLevel: req.grade_level, schoolYear: req.school_year });
      if (req.strand) params.set('strand', req.strand);
      const res = await fetch(`/api/admin/sections?${params}`);
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success) {
        setSectionsFromDB(payload.sections ?? []);
        // Pre-select if the request already has an assigned section
        if (req.assigned_section_id) setAssignedSectionId(req.assigned_section_id);
      }
    } catch (e) {
      console.error('Failed to fetch sections', e);
    } finally {
      setSectionsFetching(false);
    }

    // ── Fallback: pre-select from legacy assigned_class_id ────────────────────
    if (req.assigned_class_id) {
      const prevClass = classes.find((c) => c.id === req.assigned_class_id);
      if (prevClass?.section) setSelectedSection(prevClass.section);
      setAssignedClassId(req.assigned_class_id);
      return;
    }

    // ── Auto-select from the student's existing class enrolment ───────────────
    try {
      const res = await fetch(`/api/admin/student-class?studentId=${req.student_id}`);
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.success && payload.classIds?.length > 0) {
        const matchingClass = classes.find(
          (c) =>
            payload.classIds.includes(c.id) &&
            c.grade_level?.trim().toLowerCase() === req.grade_level.trim().toLowerCase()
        );
        if (matchingClass) {
          if (matchingClass.section) setSelectedSection(matchingClass.section);
          setAssignedClassId(matchingClass.id);
          setClassAutoSelected(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch student current class', e);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
    setAssignedClassId('');
    setAssignedSectionId('');
    setSectionsFromDB([]);
    setSelectedSection('');
    setEntryQuarter('');
    setAdminNotes('');
    setRejectReason('');
    setRejectOtherText('');
    setShowRejectSection(false);
    setClassAutoSelected(false);
  };

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    const hasAssignment = assignedSectionId || assignedClassId;
    if (decision === 'approved' && !hasAssignment) {
      showAlert({ message: 'Please select a section to assign before approving.', type: 'warning' });
      return;
    }
    if (decision === 'rejected' && !rejectReason) {
      showAlert({ message: 'Please select a rejection reason.', type: 'warning' });
      return;
    }
    const resolvedNotes = decision === 'rejected'
      ? (rejectReason === 'Other' ? (rejectOtherText.trim() || 'Other') : rejectReason)
      : (adminNotes || undefined);
    setSubmitting(decision);
    try {
      const res = await fetch('/api/admin/enrollment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          status: decision,
          // Prefer sectionId (Phase 3); fall back to classId (legacy)
          sectionId:   decision === 'approved' && assignedSectionId ? assignedSectionId : undefined,
          classId:     decision === 'approved' && !assignedSectionId && assignedClassId ? assignedClassId : undefined,
          entryQuarter: decision === 'approved' && entryQuarter ? parseInt(entryQuarter) : undefined,
          adminNotes: resolvedNotes,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        showAlert({
          message:
            payload?.error ||
            `We could not ${decision === 'approved' ? 'approve' : 'reject'} this request. Please try again in a moment.`,
          type: 'error',
        });
        return;
      }
      showAlert({
        message: decision === 'approved' ? 'Student enrolled and approved!' : 'Request rejected.',
        type: decision === 'approved' ? 'success' : 'info',
      });
      closeModal();
      fetchRequests();
      triggerRefresh();
    } catch (e) {
      console.error('Enrollment decision error:', e);
      showAlert({
        message: friendlyError(
          e,
          `We could not ${decision === 'approved' ? 'approve' : 'reject'} this request. Please try again in a moment.`
        ),
        type: 'error',
      });
    } finally {
      setSubmitting(null);
    }
  };

  const flatRequests: FlatEnrollment[] = requests.map((r) => ({
    ...r,
    studentName: getStudentName(r),
    school_year: normalizeSchoolYear(r.school_year),
  }));

  const gradeOptions = sortGradeLevels([...new Set(requests.map((r) => r.grade_level))] as string[]);

  const tc = useTableControls(flatRequests, {
    searchFields: ['studentName', 'grade_level'],
    defaultSort: { key: 'created_at', dir: 'desc' },
    pageSize: 25,
  });

  const counts = {
    all:      requests.length,
    pending:  requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const relevantClasses = selectedRequest
    ? classes.filter(
        (c) =>
          c.grade_level &&
          c.grade_level.trim().toLowerCase() === selectedRequest.grade_level.trim().toLowerCase()
      )
    : [];

  const availableSections = [...new Set(relevantClasses.map((c) => c.section).filter(Boolean))].sort() as string[];

  const hasFilters = !!tc.search || !!tc.filters['status'] || !!tc.filters['grade_level'] || !!tc.filters['school_year'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enrollment Requests</h2>
        <p className="text-sm text-gray-500 mt-0.5">Review and process student enrollment applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { key: 'all',      label: 'Total',    icon: ClipboardList, colorClass: 'text-gray-600 bg-gray-100'   },
            { key: 'pending',  label: 'Pending',  icon: Clock,         colorClass: 'text-amber-700 bg-amber-100' },
            { key: 'approved', label: 'Approved', icon: CheckCircle2,  colorClass: 'text-green-700 bg-green-100' },
            { key: 'rejected', label: 'Rejected', icon: XCircle,       colorClass: 'text-red-700 bg-red-100'    },
          ] as const
        ).map(({ key, label, icon: Icon, colorClass }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{label}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-900">{counts[key]}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SchoolYearTabs
        value={tc.filters['school_year'] ?? ''}
        onChange={(sy) => tc.setFilter('school_year', sy)}
        startOnAll
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-gray-50"
              placeholder="Search student..."
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
            />
          </div>
          <select
            value={tc.filters['status'] ?? ''}
            onChange={(e) => tc.setFilter('status', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={tc.filters['grade_level'] ?? ''}
            onChange={(e) => tc.setFilter('grade_level', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Grades</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => { tc.clearFilters(); tc.setSearch(''); }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead>
            <tr className="bg-gray-50">
              <SortHeader label="Student"   sortKey="studentName"  currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
              <SortHeader label="Grade"     sortKey="grade_level"  currentSort={tc.sort} onSort={tc.toggleSort} />
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Strand</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">School Year</th>
              <SortHeader label="Submitted" sortKey="created_at"   currentSort={tc.sort} onSort={tc.toggleSort} />
              <SortHeader label="Status"    sortKey="status"       currentSort={tc.sort} onSort={tc.toggleSort} />
              <th className="px-4 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : tc.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-14 text-gray-400">
                  <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  No enrollment requests found.
                </td>
              </tr>
            ) : (
              tc.rows.map((req) => {
                const cfg = STATUS_CONFIG[req.status];
                return (
                  <tr
                    key={req.id}
                    className="hover:bg-gray-50 group cursor-pointer"
                    onClick={() => openModal(req)}
                  >
                    <td className="px-4 py-3 pl-4">
                      <p className="text-sm font-medium text-gray-900">{req.studentName}</p>
                      {req.student?.email && (
                        <p className="text-xs text-gray-400">{req.student.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{req.grade_level}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {req.strand ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{req.school_year}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span className="text-xs text-gray-600">{cfg.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 pr-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer">
                        Review →
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>

        <Pagination
          page={tc.page}
          onPageChange={tc.setPage}
          pageCount={tc.pageCount}
          totalCount={tc.totalCount}
          filteredCount={tc.filteredCount}
          pageSize={tc.pageSize}
          onPageSizeChange={tc.setPageSize}
        />
      </div>

      {/* Review Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-red-700" />
              Review Enrollment Request
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">{getStudentName(selectedRequest)}</span>
                </div>
                {selectedRequest.student?.email && (
                  <p className="text-sm text-gray-500 pl-6">{selectedRequest.student.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Grade:</span>
                  <span className="font-medium text-gray-900">{selectedRequest.grade_level}</span>
                </div>
                {selectedRequest.strand && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Strand:</span>
                    <span className="font-medium text-gray-900">{selectedRequest.strand}</span>
                  </div>
                )}
                <div className="text-gray-600">
                  School Year:{' '}
                  <span className="font-medium text-gray-900">{selectedRequest.school_year}</span>
                </div>
              </div>

              {selectedRequest.previous_grades_url && (
                <div className="text-sm">
                  <span className="text-gray-600 block mb-1">Previous Grades:</span>
                  <a
                    href={selectedRequest.previous_grades_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline truncate block"
                  >
                    View Document
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Current status:</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedRequest.status].dot}`} />
                  <span className="text-xs text-gray-700">{STATUS_CONFIG[selectedRequest.status].label}</span>
                </span>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="space-y-1.5">
                  <Label htmlFor="sectionAssign">
                    Assign to Section{' '}
                    <span className="text-red-600 text-xs">(required for approval)</span>
                  </Label>
                  {sectionsFetching ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading sections…
                    </div>
                  ) : sectionsFromDB.length > 0 ? (
                    // Primary: sections from the formal sections table
                    <>
                    <Select value={assignedSectionId} onValueChange={setAssignedSectionId}>
                      <SelectTrigger id="sectionAssign">
                        <SelectValue placeholder="Select a section…" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionsFromDB.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                            {s.max_capacity > 0 && (
                              <span className="text-xs text-gray-400 ml-2">
                                {s.student_count}/{s.max_capacity}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Pre-filled server-side from the student's earlier approved request this school year */}
                    {selectedRequest.assigned_section_id &&
                      assignedSectionId === selectedRequest.assigned_section_id && (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                          Auto-filled from the student&apos;s previous enrollment this school year. Please verify before approving.
                        </p>
                      )}
                    {selectedRequest.strand && (
                      <p className="text-xs text-gray-500">Showing {selectedRequest.strand} sections only.</p>
                    )}
                    </>
                  ) : availableSections.length > 0 ? (
                    // Fallback: derive from class text fields (pre-migration compat)
                    <>
                      <Select
                        value={selectedSection}
                        onValueChange={(section) => {
                          setSelectedSection(section);
                          setClassAutoSelected(false);
                          const cls = relevantClasses.find((c) => c.section === section);
                          setAssignedClassId(cls?.id ?? '');
                        }}
                      >
                        <SelectTrigger id="sectionAssign">
                          <SelectValue placeholder="Select a section…" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSections.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Loaded from class data — run the Phase 3 migration to enable capacity tracking.
                      </p>
                      {classAutoSelected && (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                          Auto-selected based on previous enrollment
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                      No sections found for {selectedRequest.grade_level}.{' '}
                      <a href="/admin/sections" className="underline font-medium hover:text-amber-800">
                        Set up sections
                      </a>{' '}
                      or{' '}
                      <a href="/admin/classes" className="underline font-medium hover:text-amber-800">
                        create classes
                      </a>{' '}
                      for this grade level first.
                    </p>
                  )}
                </div>
              )}

              {/* Entry Quarter — shown for transferees / returnees entering mid-year */}
              {selectedRequest.status === 'pending' &&
                (selectedRequest.enrollment_type === 'transferee' ||
                  selectedRequest.enrollment_type === 'returnee') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="entryQuarter">
                      Entry Quarter{' '}
                      <span className="text-gray-400 text-xs font-normal">(which quarter is this student starting from?)</span>
                    </Label>
                    <Select value={entryQuarter} onValueChange={setEntryQuarter}>
                      <SelectTrigger id="entryQuarter">
                        <SelectValue placeholder="Full year (Q1 onwards)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Full year (all quarters)</SelectItem>
                        <SelectItem value="1">Quarter 1</SelectItem>
                        <SelectItem value="2">Quarter 2</SelectItem>
                        <SelectItem value="3">Quarter 3</SelectItem>
                        <SelectItem value="4">Quarter 4</SelectItem>
                      </SelectContent>
                    </Select>
                    {entryQuarter && parseInt(entryQuarter) > 1 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Quarters 1–{parseInt(entryQuarter) - 1} will be recorded as not applicable for this student.
                      </p>
                    )}
                  </div>
                )}

              {(selectedRequest.status === 'pending' || selectedRequest.status === 'approved') && showRejectSection && (
                <div className="space-y-3 border border-red-100 bg-red-50/40 rounded-xl p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rejectReason" className="text-red-800">
                      Rejection Reason <span className="text-red-600 text-xs">(required)</span>
                    </Label>
                    <Select value={rejectReason} onValueChange={setRejectReason}>
                      <SelectTrigger id="rejectReason" className="bg-white">
                        <SelectValue placeholder="Select a reason..." />
                      </SelectTrigger>
                      <SelectContent>
                        {REJECT_PRESETS.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {rejectReason === 'Other' && (
                    <Textarea
                      value={rejectOtherText}
                      onChange={(e) => setRejectOtherText(e.target.value)}
                      placeholder="Describe the reason..."
                      className="min-h-[60px] resize-none bg-white text-sm"
                    />
                  )}
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="space-y-1.5">
                  <Label htmlFor="adminNotes">Admin Notes for Approval (optional)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for the student..."
                    className="min-h-[60px] resize-none"
                  />
                </div>
              )}

              {selectedRequest.status !== 'pending' && selectedRequest.admin_notes && (
                <div className="space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Admin Notes</span>
                  <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 leading-relaxed">
                    {selectedRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 flex-row justify-end">
            <Button variant="outline" onClick={closeModal} disabled={!!submitting}>
              {selectedRequest?.status === 'rejected' ? 'Close' : 'Cancel'}
            </Button>
            {selectedRequest?.status === 'approved' && (
              <>
                {showRejectSection ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setShowRejectSection(false); setRejectReason(''); setRejectOtherText(''); }}
                      disabled={!!submitting}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => handleDecision('rejected')}
                      disabled={!!submitting || !rejectReason}
                      className="bg-red-600 text-white hover:bg-red-700 min-w-[120px]"
                    >
                      {submitting === 'rejected'
                        ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Rejecting...</>
                        : <><XCircle className="w-4 h-4 mr-1.5" />Confirm Reject</>}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectSection(true)}
                    disabled={!!submitting}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reject Enrollment
                  </Button>
                )}
              </>
            )}
            {selectedRequest?.status === 'pending' && (
              <>
                {showRejectSection ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setShowRejectSection(false); setRejectReason(''); setRejectOtherText(''); }}
                      disabled={!!submitting}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => handleDecision('rejected')}
                      disabled={!!submitting || !rejectReason}
                      className="bg-red-600 text-white hover:bg-red-700 min-w-[120px]"
                    >
                      {submitting === 'rejected'
                        ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Rejecting...</>
                        : <><XCircle className="w-4 h-4 mr-1.5" />Confirm Reject</>}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectSection(true)}
                      disabled={!!submitting}
                      className="text-red-600 border-red-200 hover:bg-red-50 min-w-[120px]"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject Form
                    </Button>
                    <Button
                      onClick={() => handleDecision('approved')}
                      disabled={!!submitting || (!assignedSectionId && !assignedClassId)}
                      className="bg-green-700 hover:bg-green-600 text-white min-w-[140px]"
                    >
                      {submitting === 'approved'
                        ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Enrolling...</>
                        : <><CheckCircle2 className="w-4 h-4 mr-1.5" />Approve & Enroll</>}
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
