'use client';

import { formatDate } from '@/lib/format-date';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Database } from '@/database.types';
import { useTableControls } from '@/hooks/use-table-controls';
import { useRefresh } from '@/lib/refresh-context';
import { useAlert } from '@/lib/use-alert';
import {
  CheckCircle,
  ChevronDown,
  Mail,
  Phone,
  Search,
  Send,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

type Admission = Database['public']['Tables']['admissions']['Row'];
type FlatAdmission = Admission & { normalizedStatus: string };

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending: { label: 'Pending', dot: 'bg-amber-400' },
  approved: { label: 'Approved', dot: 'bg-green-500' },
  rejected: { label: 'Rejected', dot: 'bg-red-500' },
};

const ENROLLMENT_TYPE_LABELS: Record<string, string> = {
  new: 'New Student',
  returning: 'Returning Student',
  transferee: 'Transferee',
  returnee: 'Returnee',
  repeater: 'Repeater',
};

const QUICK_TEMPLATES = [
  {
    label: 'Interview Invitation',
    subject: 'Admission Interview Invitation — {name}',
    body: `Dear {parent},\n\nThank you for submitting an admission inquiry for {name}. We would like to invite you for an admission interview.\n\nPlease reply to this email to schedule a convenient date and time.\n\nBest regards,\nSto. Niño de Praga Academy`,
  },
  {
    label: 'Request Documents',
    subject: 'Additional Documents Required — {name}',
    body: `Dear {parent},\n\nThank you for applying to Sto. Niño de Praga Academy. To continue processing the admission for {name}, we need the following documents:\n\n• Report Card / Form 138\n• Birth Certificate (PSA)\n• 2x2 ID Photos\n\nPlease bring or send these documents at your earliest convenience.\n\nBest regards,\nSto. Niño de Praga Academy`,
  },
  {
    label: 'Under Review',
    subject: 'Admission Application Update — {name}',
    body: `Dear {parent},\n\nWe would like to inform you that the admission application for {name} is currently under review by our admissions committee.\n\nWe will notify you of the outcome as soon as a decision has been made. Thank you for your patience.\n\nBest regards,\nSto. Niño de Praga Academy`,
  },
];

const AdmissionPage = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingAdmissionId, setRejectingAdmissionId] = useState<
    number | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState('');
  // Email compose modal
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Admission | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approvingAdmission, setApprovingAdmission] = useState<{ id: number; isOverride: boolean } | null>(null);
  const { showAlert } = useAlert();
  const { refreshKey } = useRefresh();

  const openEmailDialog = (admission: Admission, toAddress?: string) => {
    const name = `${admission.first_name} ${admission.last_name}`;
    setEmailTarget(admission);
    setEmailTo(toAddress ?? admission.email_address);
    setEmailSubject(`Re: Admission Inquiry — ${name}`);
    setEmailBody('');
    setDialogOpen(false);
    setTimeout(() => setEmailDialogOpen(true), 80);
  };

  const applyTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    if (!emailTarget) return;
    const name = `${emailTarget.first_name} ${emailTarget.last_name}`;
    const parent = emailTarget.parent_name || 'Guardian';
    setEmailSubject(tpl.subject.replace('{name}', name));
    setEmailBody(
      tpl.body.replace(/{name}/g, name).replace(/{parent}/g, parent)
    );
  };

  const handleSendEmail = async () => {
    if (!emailTarget || !emailSubject.trim() || !emailBody.trim()) return;
    setSendingEmail(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject.trim(),
          text: emailBody.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        showAlert({ message: 'Email sent successfully.', type: 'success' });
        setEmailDialogOpen(false);
      } else {
        showAlert({
          message: result.error || 'Failed to send email.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admissions?page=1&limit=1000');
      const result = await response.json();
      if (result.success) setAdmissions(result.data || []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [refreshKey]);

  const flatAdmissions: FlatAdmission[] = admissions.map((a) => ({
    ...a,
    normalizedStatus: a.status ?? 'pending',
  }));

  const gradeOptions = [
    ...new Set(admissions.map((a) => a.intended_grade_level).filter(Boolean)),
  ].sort() as string[];

  const tc = useTableControls(flatAdmissions, {
    searchFields: ['first_name', 'last_name', 'email_address', 'parent_name'],
    defaultSort: { key: 'created_at', dir: 'desc' },
    pageSize: 25,
  });

  const handleViewDetails = (admission: Admission) => {
    setSelectedAdmission(admission);
    setDialogOpen(true);
  };

  const handleApprove = (admissionId: number, currentStatus?: string | null) => {
    setApprovingAdmission({ id: admissionId, isOverride: currentStatus === 'rejected' });
    setDialogOpen(false);
    setTimeout(() => setApproveDialogOpen(true), 150);
  };

  const confirmApprove = async () => {
    if (!approvingAdmission) return;
    setApproveDialogOpen(false);
    setProcessingId(approvingAdmission.id);
    try {
      const response = await fetch('/api/admissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admissionId: approvingAdmission.id, action: 'approve' }),
      });
      const result = await response.json();
      if (result.success) {
        showAlert({ message: 'Admission approved! Student account created and email sent.', type: 'success' });
        fetchAdmissions();
      } else {
        showAlert({ message: result.error || 'Failed to approve admission', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setProcessingId(null);
      setApprovingAdmission(null);
    }
  };

  const openRejectDialog = (admissionId: number) => {
    setRejectingAdmissionId(admissionId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingAdmissionId) return;
    setProcessingId(rejectingAdmissionId);
    try {
      const response = await fetch('/api/admissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admissionId: rejectingAdmissionId,
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        showAlert({ message: 'Admission rejected.', type: 'success' });
        fetchAdmissions();
        setDialogOpen(false);
        setRejectDialogOpen(false);
      } else {
        showAlert({
          message: result.error || 'Failed to reject admission',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Rejection error:', error);
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const hasFilters =
    !!tc.search ||
    !!tc.filters['normalizedStatus'] ||
    !!tc.filters['intended_grade_level'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Admission Inquiries
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          View and manage admission applications from prospective students
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-gray-50"
              placeholder="Search name, email, parent..."
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
            />
          </div>
          <select
            value={tc.filters['normalizedStatus'] ?? ''}
            onChange={(e) => tc.setFilter('normalizedStatus', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={tc.filters['intended_grade_level'] ?? ''}
            onChange={(e) =>
              tc.setFilter('intended_grade_level', e.target.value)
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">All Grades</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={() => {
                tc.clearFilters();
                tc.setSearch('');
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[990px]">
          <thead>
            <tr className="bg-gray-50">
              <SortHeader
                label="Name"
                sortKey="last_name"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
                className="pl-4"
              />
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Guardian
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Email
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Phone
              </th>
              <SortHeader
                label="Grade"
                sortKey="intended_grade_level"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
              />
              <SortHeader
                label="Status"
                sortKey="normalizedStatus"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
              />
              <SortHeader
                label="Submitted"
                sortKey="created_at"
                currentSort={tc.sort}
                onSort={tc.toggleSort}
              />
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
                  <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  No admission inquiries found.
                </td>
              </tr>
            ) : (
              tc.rows.map((admission) => {
                const cfg =
                  STATUS_CONFIG[admission.normalizedStatus] ??
                  STATUS_CONFIG['pending'];
                return (
                  <tr
                    key={admission.id}
                    className="hover:bg-gray-50 group cursor-pointer"
                    onClick={() => handleViewDetails(admission)}
                  >
                    <td className="px-4 py-3 pl-4">
                      <p className="text-sm font-medium text-gray-900">
                        {admission.first_name}{' '}
                        {admission.middle_name
                          ? `${admission.middle_name} `
                          : admission.middle_initial
                            ? `${admission.middle_initial}. `
                            : ''}
                        {admission.last_name}
                        {(admission as any).suffix ? ` ${(admission as any).suffix}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {admission.parent_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEmailDialog(admission);
                        }}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-left active:scale-95 transition-transform duration-150 ease-out"
                      >
                        <Mail className="w-3 h-3 shrink-0" />
                        {admission.email_address}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`tel:${admission.guardian_phone || admission.phone_number}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Phone className="w-3 h-3 shrink-0" />
                        {admission.guardian_phone || admission.phone_number}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {admission.intended_grade_level ?? (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                        />
                        <span className="text-xs text-gray-600">
                          {cfg.label}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(admission.created_at)}
                    </td>
                    <td className="px-4 py-3 pr-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer">
                        View →
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

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-gray-900">Admission Inquiry</DialogTitle>
            <DialogDescription className="sr-only">Complete information about this admission inquiry</DialogDescription>
          </DialogHeader>
          {selectedAdmission && (() => {
            const cfg = STATUS_CONFIG[selectedAdmission.status ?? 'pending'] ?? STATUS_CONFIG['pending'];
            const fullName = [
              selectedAdmission.first_name,
              selectedAdmission.middle_name ||
                (selectedAdmission.middle_initial ? `${selectedAdmission.middle_initial}.` : ''),
              selectedAdmission.last_name,
              selectedAdmission.suffix || '',
            ].filter(Boolean).join(' ');
            const gradeLabel = (selectedAdmission.intended_grade_level || '')
              .replace(/^grade(\d+)$/i, 'Grade $1')
              .replace(/^kindergarten$/i, 'Kindergarten');
            const statusBadge: Record<string, string> = {
              pending:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
              approved: 'bg-green-50 text-green-700 ring-1 ring-green-200',
              rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
            };
            return (
              <div className="space-y-4">
                {/* Name + status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-gray-900 leading-tight">{fullName}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {gradeLabel}
                      {(selectedAdmission as any).enrollment_type ? ` · ${ENROLLMENT_TYPE_LABELS[(selectedAdmission as any).enrollment_type] || (selectedAdmission as any).enrollment_type}` : ''}
                      {selectedAdmission.previous_school ? ` · ${selectedAdmission.previous_school}` : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusBadge[selectedAdmission.status ?? 'pending']}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>

                {/* Info rows */}
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {[
                    { label: 'Guardian', value: selectedAdmission.parent_name },
                    selectedAdmission.parent_email ? { label: 'Guardian Email', value: selectedAdmission.parent_email, href: `mailto:${selectedAdmission.parent_email}`, compose: selectedAdmission.parent_email } : null,
                    { label: 'Applicant Email', value: selectedAdmission.email_address, href: `mailto:${selectedAdmission.email_address}` },
                    { label: "Guardian's Phone", value: selectedAdmission.guardian_phone || selectedAdmission.phone_number, href: `tel:${selectedAdmission.guardian_phone || selectedAdmission.phone_number}` },
                    selectedAdmission.date_of_birth ? { label: 'Date of Birth', value: formatDate(selectedAdmission.date_of_birth) } : null,
                    (selectedAdmission as any).lrn ? { label: 'LRN', value: (selectedAdmission as any).lrn } : null,
                    ...((selectedAdmission as any).current_address
                      ? [
                          { label: 'Permanent Address', value: (selectedAdmission as any).address },
                          { label: 'Current Address', value: (selectedAdmission as any).current_address },
                        ]
                      : [(selectedAdmission as any).address ? { label: `${(selectedAdmission as any).address_type === 'permanent' ? 'Permanent' : 'Current'} Address`, value: (selectedAdmission as any).address } : null]),
                    (selectedAdmission as any).school_year ? { label: 'School Year', value: `S.Y. ${(selectedAdmission as any).school_year}` } : null,
                  ].filter(Boolean).map((row: any) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-2.5 bg-white">
                      <span className="text-xs text-gray-400 w-32 shrink-0">{row.label}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        {row.href ? (
                          <a href={row.href} className="text-sm text-blue-600 hover:underline text-right truncate">{row.value}</a>
                        ) : (
                          <span className="text-sm font-medium text-gray-800 text-right">{row.value || '—'}</span>
                        )}
                        {row.compose && (
                          <button
                            type="button"
                            title="Compose email to guardian"
                            onClick={() => openEmailDialog(selectedAdmission, row.compose)}
                            className="shrink-0 p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAdmission.additional_message && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Note</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedAdmission.additional_message}</p>
                  </div>
                )}

                <p className="text-[11px] text-gray-400">
                  Submitted {formatDate(selectedAdmission.created_at)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {selectedAdmission.status !== 'approved' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedAdmission.id, selectedAdmission.status)} disabled={processingId === selectedAdmission.id}>
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      {processingId === selectedAdmission.id ? 'Processing…' : selectedAdmission.status === 'rejected' ? 'Override: Approve' : 'Approve'}
                    </Button>
                  )}
                  {selectedAdmission.status !== 'rejected' && (
                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => openRejectDialog(selectedAdmission.id)} disabled={processingId === selectedAdmission.id}>
                      <XCircle className="h-4 w-4 mr-1.5" />
                      {selectedAdmission.status === 'approved' ? 'Override: Reject' : 'Reject'}
                    </Button>
                  )}
                  <Button variant="outline" className="gap-1.5" onClick={() => openEmailDialog(selectedAdmission)}>
                    <Mail className="h-4 w-4" /> Email
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Email Compose Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Compose Email
            </DialogTitle>
            <DialogDescription>
              Sending to{' '}
              <span className="font-medium text-gray-700">
                {emailTo}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-1">
            {/* Quick Templates */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Quick Templates
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 active:scale-95 transition-[background-color,transform] duration-150 ease-out"
                  >
                    <ChevronDown className="w-3 h-3" />
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label required>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="space-y-1">
              <Label required>Message</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Write your message here..."
                rows={9}
                className="resize-none font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEmailDialogOpen(false)}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSendEmail}
                disabled={
                  sendingEmail || !emailSubject.trim() || !emailBody.trim()
                }
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingEmail ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      {/* Approve Confirmation Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {approvingAdmission?.isOverride ? 'Override & Approve' : 'Approve Admission'}
            </DialogTitle>
            <DialogDescription className="sr-only">Approval confirmation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {approvingAdmission?.isOverride
                  ? 'This admission was previously rejected. Approving will reactivate the student account and resend credentials via email.'
                  : 'This will create a student account and send login credentials to the applicant via email.'}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove}>
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Confirm Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-800">Reject Admission</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this admission. This will be
              sent to the applicant via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason" required>
                Reason for Rejection
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={
                  !rejectionReason.trim() ||
                  processingId === rejectingAdmissionId
                }
              >
                <XCircle className="h-4 w-4 mr-2" />
                {processingId === rejectingAdmissionId
                  ? 'Rejecting...'
                  : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdmissionPage;
