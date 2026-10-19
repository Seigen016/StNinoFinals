'use client';

import { formatDate } from '@/lib/format-date';
import { GenderCell } from '@/components/admin/gender-cell';
import { AddressData, AddressSelector } from '@/components/ui/address-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useTableControls } from '@/hooks/use-table-controls';
import { useRefresh } from '@/lib/refresh-context';
import { useAlert } from '@/lib/use-alert';
import { useConfirm } from '@/lib/use-confirm';
import { useDeletePrompt } from '@/lib/use-delete-prompt';
import { sortGradeLevels } from '@/lib/utils';
import {
  AlertTriangle,
  ArchiveRestore,
  Edit,
  Radio,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { latestBirthYear } from '@/lib/person';
import { useAuth } from '../hooks/useAuth';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  student_number: string;
  lrn?: string;
  grade_level: string;
  section: string;
  email: string;
  phone_number?: string;
  guardian_phone?: string;
  guardian_name?: string;
  guardian_email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  current_address?: string;
  barangay?: string;
  barangay_name?: string;
  street_details?: string;
  rfid?: string;
  status: string;
  profile_picture?: string | null;
}

function RfidScanInput({
  value,
  onChange,
  placeholder = 'Enter or scan RFID',
  excludeStudentId,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** The current student's own id, so scanning their existing card doesn't warn. */
  excludeStudentId?: string;
}) {
  const [scanning, setScanning] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenRef = useRef<string | null>(null);

  const stopScan = () => {
    setScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    fetch('/api/admin/rfid-assignment-mode', { method: 'DELETE' }).catch(
      () => {}
    );
  };

  const checkDuplicate = async (rfid: string) => {
    try {
      const res = await fetch(
        `/api/admin/check-rfid?rfid=${encodeURIComponent(rfid)}`
      );
      const data = await res.json();
      if (
        data.success &&
        data.assigned &&
        data.student?.studentId &&
        data.student.studentId !== excludeStudentId
      ) {
        setDuplicateWarning(
          `Already assigned to ${data.student.name}${data.student.gradeLevel ? ` (${data.student.gradeLevel}${data.student.section ? ` — ${data.student.section}` : ''})` : ''}.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      setDuplicateWarning(null);
    }
  };

  const startScan = async () => {
    lastSeenRef.current = null;
    setDuplicateWarning(null);
    await fetch('/api/admin/rfid-assignment-mode', { method: 'POST' }).catch(
      () => {}
    );
    setScanning(true);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/rfid-latest-scan?window=15');
        const data = await res.json();
        if (data.success && data.rfid && data.rfid !== lastSeenRef.current) {
          lastSeenRef.current = data.rfid;
          onChange(data.rfid);
          stopScan();
          checkDuplicate(data.rfid);
        }
      } catch {}
    }, 1500);
  };

  useEffect(() => () => stopScan(), []);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2 items-center">
        <Input
          value={value}
          onChange={() => {}}
          readOnly
          placeholder={placeholder}
          className="flex-1 cursor-not-allowed bg-gray-50"
        />
        {scanning ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopScan}
            className="shrink-0 gap-1 text-red-700 border-red-300"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            Waiting…
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startScan}
            className="shrink-0 gap-1"
          >
            <Radio className="w-4 h-4" />
            Scan
          </Button>
        )}
      </div>
      {duplicateWarning && (
        <p className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {duplicateWarning}
        </p>
      )}
    </div>
  );
}

export default function StudentManagementPage() {
  const { admin, loading: authLoading } = useAuth();
  const { refreshKey } = useRefresh();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewSheet, setShowViewSheet] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { showDeletePrompt } = useDeletePrompt();
  const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    student_number: '',
    lrn: '',
    grade_level: '',
    section: '',
    email: '',
    phone_number: '',
    guardian_phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    current_address: '',
    rfid: '',
  });
  const [newStudentAddress, setNewStudentAddress] = useState<AddressData>({
    barangay: '',
    barangayName: '',
    streetDetails: '',
  });
  const [editStudent, setEditStudent] = useState({
    id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    student_number: '',
    lrn: '',
    grade_level: '',
    section: '',
    email: '',
    phone_number: '',
    guardian_phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    current_address: '',
    rfid: '',
  });
  const [editStudentAddress, setEditStudentAddress] = useState<AddressData>({
    barangay: '',
    barangayName: '',
    streetDetails: '',
  });
  const [addingStudent, setAddingStudent] = useState(false);
  const [updatingStudent, setUpdatingStudent] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sectionsByGrade, setSectionsByGrade] = useState<
    Record<string, string[]>
  >({});

  // Fetch sections defined in admin settings
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/admin/settings/sections');
        const data = await res.json();
        if (data.success && data.sections) {
          setSectionsByGrade(data.sections);
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    fetchSections();
  }, []);

  const fetchStudents = async (archived = false) => {
    setLoading(true);
    try {
      const url = `/api/admin/students${archived ? '?archived=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.students) {
        setStudents(result.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(showArchived);
  }, [showArchived, refreshKey]);

  // has_rfid is derived so the exact-match table filter can filter on it
  const rows = useMemo(() => students.map((r) => ({ ...r, has_rfid: r.rfid ? 'yes' : 'no' })), [students]);
  const noRfidCount = rows.filter((r) => r.has_rfid === 'no').length;
  const tc = useTableControls(rows, {
    searchFields: ['first_name', 'last_name', 'student_number', 'email'],
    defaultSort: { key: 'last_name', dir: 'asc' },
    pageSize: 25,
  });
  const gradeOptions = sortGradeLevels([
    ...new Set(students.map((s) => s.grade_level).filter(Boolean)),
  ] as string[]);
  const statusOptions = [
    ...new Set(students.map((s) => s.status).filter(Boolean)),
  ].sort();

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!newStudent.first_name.trim()) missing.push('First Name');
    if (!newStudent.last_name.trim()) missing.push('Last Name');
    if (!/^\d{12}$/.test(newStudent.student_number)) missing.push('LRN (12 digits)');
    if (!newStudent.grade_level) missing.push('Grade Level');
    if (!newStudent.gender) missing.push('Gender');
    if (!newStudent.email.trim()) missing.push('Email');
    if (missing.length) {
      setAddError(`Required: ${missing.join(', ')}`);
      return;
    }
    setAddingStudent(true);
    setAddError('');

    try {
      const tempPassword = `SN${Math.random().toString(36).slice(-6)}`;

      // Combine address data into a single string
      const fullAddress = [
        newStudentAddress.streetDetails,
        newStudentAddress.barangayName,
        'Trece Martires City',
        'Cavite',
      ]
        .filter(Boolean)
        .join(', ');

      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          password: tempPassword,
          address: fullAddress,
          barangay: newStudentAddress.barangay,
          barangay_name: newStudentAddress.barangayName,
          street_details: newStudentAddress.streetDetails,
        }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to add student');

      await fetchStudents(showArchived);
      setNewStudent({
        first_name: '',
        last_name: '',
        middle_name: '',
        suffix: '',
        student_number: '',
        lrn: '',
        grade_level: '',
        section: '',
        email: '',
        phone_number: '',
        guardian_phone: '',
        date_of_birth: '',
        gender: '',
        address: '',
        current_address: '',
        rfid: '',
      });
      setNewStudentAddress({
        barangay: '',
        barangayName: '',
        streetDetails: '',
      });
      setShowAddDialog(false);

      showAlert({
        message: `Student added successfully!\n\nLogin Credentials:\nEmail: ${newStudent.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: 'success',
      });
    } catch (error: any) {
      setAddError(error?.message || 'Failed to add student.');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!editStudent.first_name.trim()) missing.push('First Name');
    if (!editStudent.last_name.trim()) missing.push('Last Name');
    if (!/^\d{12}$/.test(editStudent.student_number || '')) missing.push('LRN (12 digits)');
    if (!editStudent.grade_level) missing.push('Grade Level');
    if (!editStudent.email.trim()) missing.push('Email');
    if (missing.length) {
      setEditError(`Required: ${missing.join(', ')}`);
      return;
    }
    setUpdatingStudent(true);
    setEditError('');

    try {
      // Combine address data into a single string
      const fullAddress = [
        editStudentAddress.streetDetails,
        editStudentAddress.barangayName,
        'Trece Martires City',
        'Cavite',
      ]
        .filter(Boolean)
        .join(', ');

      const response = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editStudent,
          address: fullAddress,
          barangay: editStudentAddress.barangay,
          barangay_name: editStudentAddress.barangayName,
          street_details: editStudentAddress.streetDetails,
        }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to update student');

      await fetchStudents(showArchived);
      setShowEditDialog(false);
      showAlert({ message: 'Student updated successfully!', type: 'success' });
    } catch (error: any) {
      setEditError(error?.message || 'Failed to update student.');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleDeleteStudent = async (
    studentId: string,
    studentName: string
  ) => {
    const result = await showDeletePrompt({
      title: 'Archive Student',
      message: `Archive ${studentName}? They will no longer appear in active lists.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      reasonLabel: 'Reason for archiving',
      reasonRequired: true,
      presets: [
        'Transferred',
        'Graduated',
        'Dropped Out',
        'Long Absence',
        'Duplicate Record',
        'Other',
      ],
    });

    if (!result?.confirmed) return;

    setDeletingStudent(true);
    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: result.reason || undefined }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || 'Failed to archive student');

      await fetchStudents(showArchived);
      showAlert({ message: 'Student archived successfully!', type: 'success' });
    } catch (error: any) {
      showAlert({
        message: error?.message || 'Failed to archive student.',
        type: 'error',
      });
    } finally {
      setDeletingStudent(false);
    }
  };

  const handleRestoreStudent = async (
    studentId: string,
    studentName: string
  ) => {
    const confirmed = await showConfirm({
      message: `Restore ${studentName} from archive?`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to restore');
      await fetchStudents(showArchived);
      showAlert({ message: 'Student restored successfully!', type: 'success' });
    } catch (error: any) {
      showAlert({
        message: error?.message || 'Failed to restore student.',
        type: 'error',
      });
    }
  };

  const openEditDialog = (student: Student) => {
    setEditStudent({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || '',
      suffix: (student as any).suffix || '',
      student_number: student.student_number,
      lrn: student.lrn || '',
      grade_level: student.grade_level,
      section: student.section || '',
      email: student.email,
      phone_number: student.phone_number || '',
      guardian_phone: student.guardian_phone || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      address: student.address || '',
      current_address: student.current_address || '',
      rfid: student.rfid || '',
    });
    setEditStudentAddress({
      barangay: student.barangay || '',
      barangayName: student.barangay_name || '',
      streetDetails: student.street_details || '',
    });
    setShowEditDialog(true);
  };

  const openViewSheet = (student: Student) => {
    setSelectedStudent(student);
    setShowViewSheet(true);
  };

  if (authLoading || !admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-red-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">
            Students{' '}
            {showArchived && (
              <span className="text-xs font-normal text-amber-600 ml-1">
                (Archived)
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {tc.filteredCount} of {tc.totalCount} records
            {noRfidCount > 0 && <span className="text-amber-600"> · {noRfidCount} without RFID</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] ${showArchived ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          {!showArchived && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-[background-color,transform] duration-150 ease-out active:scale-[0.97]">
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Student
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-red-800">
                    Add New Student
                  </DialogTitle>
                  <DialogDescription>
                    Enter student information to create a new account
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label required>First Name</Label>
                      <Input
                        value={newStudent.first_name}
                        placeholder="Enter first name"
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            first_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label required>Last Name</Label>
                      <div className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={newStudent.last_name}
                          placeholder="Enter last name"
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              last_name: e.target.value,
                            })
                          }
                          required
                        />
                        <Select
                          value={newStudent.suffix || 'none'}
                          onValueChange={(v) =>
                            setNewStudent({
                              ...newStudent,
                              suffix: v === 'none' ? '' : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-20">
                            <SelectValue placeholder="Sfx" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">—</SelectItem>
                            {SUFFIX_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Middle Name</Label>
                      <Input
                        value={newStudent.middle_name}
                        placeholder="Enter middle name"
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            middle_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label required>LRN</Label>
                      <Input
                        value={newStudent.student_number}
                        placeholder="e.g. 202400000001"
                        inputMode="numeric"
                        maxLength={12}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            student_number: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 12),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label required>Grade Level</Label>
                      <Select
                        value={newStudent.grade_level}
                        onValueChange={(value) =>
                          setNewStudent({
                            ...newStudent,
                            grade_level: value,
                            section: '',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kinder">Kinder</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                              Grade {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Section</Label>
                      <Select
                        value={newStudent.section}
                        onValueChange={(value) =>
                          setNewStudent({ ...newStudent, section: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {(sectionsByGrade[newStudent.grade_level] || []).map(
                            (sec) => (
                              <SelectItem key={sec} value={sec}>
                                {sec}
                              </SelectItem>
                            )
                          )}
                          {(!sectionsByGrade[newStudent.grade_level] ||
                            sectionsByGrade[newStudent.grade_level].length ===
                              0) && (
                            <SelectItem value="__none" disabled>
                              No sections for this grade level
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label required>Email</Label>
                      <Input
                        type="email"
                        value={newStudent.email}
                        placeholder="Enter email"
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                          +63
                        </span>
                        <Input
                          className="rounded-l-none"
                          value={newStudent.phone_number
                            .replace(/^\+63/, '')
                            .replace(/^0/, '')}
                          placeholder="9XXXXXXXXX"
                          inputMode="numeric"
                          maxLength={10}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, '');
                            setNewStudent({
                              ...newStudent,
                              phone_number: d ? `+63${d}` : '',
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Guardian's Phone Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                          +63
                        </span>
                        <Input
                          className="rounded-l-none"
                          value={newStudent.guardian_phone
                            .replace(/^\+63/, '')
                            .replace(/^0/, '')}
                          placeholder="9XXXXXXXXX"
                          inputMode="numeric"
                          maxLength={10}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, '');
                            setNewStudent({
                              ...newStudent,
                              guardian_phone: d ? `+63${d}` : '',
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <DatePicker
                        value={newStudent.date_of_birth}
                        onChange={(v) =>
                          setNewStudent({ ...newStudent, date_of_birth: v })
                        }
                        toYear={latestBirthYear()}
                        placeholder="Select date of birth"
                      />
                    </div>
                    <div>
                      <Label required>Gender</Label>
                      <Select
                        value={newStudent.gender || 'unspecified'}
                        onValueChange={(v) =>
                          setNewStudent({
                            ...newStudent,
                            gender: v === 'unspecified' ? '' : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unspecified">—</SelectItem>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>RFID Card Number</Label>
                      <RfidScanInput
                        value={newStudent.rfid}
                        onChange={(v) =>
                          setNewStudent({ ...newStudent, rfid: v })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Permanent Address</Label>
                    <AddressSelector
                      value={newStudentAddress}
                      onChange={setNewStudentAddress}
                    />
                  </div>
                  <div>
                    <Label>Mailing Address</Label>
                    <Input
                      value={newStudent.current_address}
                      placeholder="Leave blank if same as permanent address"
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          current_address: e.target.value,
                        })
                      }
                    />
                  </div>
                  {addError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                      {addError}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      disabled={addingStudent}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-800 hover:bg-red-700"
                      disabled={addingStudent}
                    >
                      {addingStudent ? 'Adding...' : 'Add Student'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-800">Edit Student</DialogTitle>
            <DialogDescription>Update student information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input
                  value={editStudent.first_name}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      first_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label required>Last Name</Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={editStudent.last_name}
                    onChange={(e) =>
                      setEditStudent({
                        ...editStudent,
                        last_name: e.target.value,
                      })
                    }
                    required
                  />
                  <Select
                    value={editStudent.suffix || 'none'}
                    onValueChange={(v) =>
                      setEditStudent({
                        ...editStudent,
                        suffix: v === 'none' ? '' : v,
                      })
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Sfx" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {SUFFIX_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input
                  value={editStudent.middle_name}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      middle_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label required>LRN</Label>
                <Input
                  value={editStudent.student_number}
                  inputMode="numeric"
                  maxLength={12}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      student_number: e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 12),
                    })
                  }
                  placeholder="e.g. 202400000001"
                />
              </div>
              <div>
                <Label required>Grade Level</Label>
                <Select
                  value={editStudent.grade_level}
                  onValueChange={(value) =>
                    setEditStudent({
                      ...editStudent,
                      grade_level: value,
                      section: '',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kinder">Kinder</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                        Grade {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Section</Label>
                <Select
                  value={editStudent.section}
                  onValueChange={(value) =>
                    setEditStudent({ ...editStudent, section: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {(sectionsByGrade[editStudent.grade_level] || []).map(
                      (sec) => (
                        <SelectItem key={sec} value={sec}>
                          {sec}
                        </SelectItem>
                      )
                    )}
                    {(!sectionsByGrade[editStudent.grade_level] ||
                      sectionsByGrade[editStudent.grade_level].length ===
                        0) && (
                      <SelectItem value="__none" disabled>
                        No sections for this grade level
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={editStudent.email}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                    +63
                  </span>
                  <Input
                    className="rounded-l-none"
                    value={editStudent.phone_number
                      .replace(/^\+63/, '')
                      .replace(/^0/, '')}
                    placeholder="9XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '');
                      setEditStudent({
                        ...editStudent,
                        phone_number: d ? `+63${d}` : '',
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Guardian's Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                    +63
                  </span>
                  <Input
                    className="rounded-l-none"
                    value={editStudent.guardian_phone
                      .replace(/^\+63/, '')
                      .replace(/^0/, '')}
                    placeholder="9XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '');
                      setEditStudent({
                        ...editStudent,
                        guardian_phone: d ? `+63${d}` : '',
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Date of Birth</Label>
                <DatePicker
                  value={editStudent.date_of_birth}
                  onChange={(v) =>
                    setEditStudent({ ...editStudent, date_of_birth: v })
                  }
                  toYear={latestBirthYear()}
                  placeholder="Select date of birth"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={editStudent.gender || 'unspecified'}
                  onValueChange={(v) =>
                    setEditStudent({
                      ...editStudent,
                      gender: v === 'unspecified' ? '' : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unspecified">—</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>RFID Card Number</Label>
                <RfidScanInput
                  value={editStudent.rfid}
                  onChange={(v) => setEditStudent({ ...editStudent, rfid: v })}
                  excludeStudentId={editStudent.student_number || editStudent.id}
                />
              </div>
            </div>
            <div>
              <Label>Permanent Address</Label>
              <AddressSelector
                value={editStudentAddress}
                onChange={setEditStudentAddress}
              />
            </div>
            <div>
              <Label>Mailing Address</Label>
              <Input
                value={editStudent.current_address}
                placeholder="Leave blank if same as permanent address"
                onChange={(e) =>
                  setEditStudent({
                    ...editStudent,
                    current_address: e.target.value,
                  })
                }
              />
            </div>
            {editError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={updatingStudent}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-800 hover:bg-red-700"
                disabled={updatingStudent}
              >
                {updatingStudent ? 'Updating...' : 'Update Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sheet */}
      <Sheet open={showViewSheet} onOpenChange={setShowViewSheet}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-red-800">Student Details</SheetTitle>
            <SheetDescription>
              View complete student information
            </SheetDescription>
          </SheetHeader>
          {selectedStudent && (
            <div className="space-y-6 mt-6">
              {/* Avatar / profile photo */}
              <div className="flex flex-col items-center gap-3 pb-5 border-b">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-red-100 flex items-center justify-center ring-4 ring-red-50">
                  {selectedStudent.profile_picture ? (
                    <img
                      src={selectedStudent.profile_picture}
                      alt={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-red-700">
                      {`${selectedStudent.first_name[0]}${selectedStudent.last_name[0]}`.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-lg leading-tight">
                    {[
                      selectedStudent.first_name,
                      selectedStudent.middle_name,
                      selectedStudent.last_name,
                      selectedStudent.suffix,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {selectedStudent.student_number}
                  </p>
                  {selectedStudent.grade_level && (
                    <span className="inline-flex items-center mt-1.5 text-xs font-medium bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full">
                      {[selectedStudent.grade_level, selectedStudent.section]
                        .filter(Boolean)
                        .join(' — ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </h3>
                  <p className="text-base font-semibold">
                    {[
                      selectedStudent.first_name,
                      selectedStudent.middle_name,
                      selectedStudent.last_name,
                      selectedStudent.suffix,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    LRN
                  </h3>
                  <p className="text-base font-mono">
                    {selectedStudent.student_number}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Grade Level
                  </h3>
                  <p className="text-base">{selectedStudent.grade_level}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Section
                  </h3>
                  <p className="text-base">
                    {selectedStudent.section || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Email
                  </h3>
                  <p className="text-base">{selectedStudent.email}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </h3>
                  <p className="text-base">
                    {selectedStudent.phone_number || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Guardian's Name
                  </h3>
                  <p className="text-base">
                    {selectedStudent.guardian_name || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Guardian's Email
                  </h3>
                  <p className="text-base">
                    {selectedStudent.guardian_email || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Guardian's Phone Number
                  </h3>
                  <p className="text-base">
                    {selectedStudent.guardian_phone || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Date of Birth
                  </h3>
                  <p className="text-base">
                    {formatDate(selectedStudent.date_of_birth, 'N/A')}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    RFID Card
                  </h3>
                  {selectedStudent.rfid ? (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Assigned
                      </Badge>
                      <p className="text-sm text-gray-600 font-mono">
                        {selectedStudent.rfid}
                      </p>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-600"
                    >
                      Not Assigned
                    </Badge>
                  )}
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Permanent Address
                  </h3>
                  <p className="text-base">
                    {selectedStudent.address || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Mailing Address
                  </h3>
                  <p className="text-base">
                    {selectedStudent.current_address || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Table toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students…"
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
          <select
            value={tc.filters['grade_level'] ?? ''}
            onChange={(e) => tc.setFilter('grade_level', e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
          >
            <option value="">All Grades</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={tc.filters['has_rfid'] ?? ''}
            onChange={(e) => tc.setFilter('has_rfid', e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
          >
            <option value="">All RFID</option>
            <option value="yes">Has RFID</option>
            <option value="no">No RFID</option>
          </select>
          {(tc.search || tc.filters['grade_level'] || tc.filters['has_rfid']) && (
            <button
              onClick={tc.clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 active:scale-95 transition-[color,transform] duration-150 ease-out"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    LRN
                  </th>
                  <SortHeader
                    label="Name"
                    sortKey="last_name"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label="Grade"
                    sortKey="grade_level"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label="Section"
                    sortKey="section"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label="Gender"
                    sortKey="gender"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    RFID
                  </th>
                  <SortHeader
                    label="Email"
                    sortKey="email"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  {showArchived && (
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Reason
                    </th>
                  )}
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tc.rows.length > 0 ? (
                  tc.rows.map((student) => {
                    return (
                      <tr
                        key={student.id}
                        onClick={() => openViewSheet(student)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 font-mono text-[12px] text-gray-500 whitespace-nowrap">
                          {student.student_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-gray-900">
                            {student.first_name} {student.last_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                          {student.grade_level || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                          {student.section || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <GenderCell
                            resource="students"
                            userId={student.id}
                            value={student.gender}
                            onSaved={(gender) =>
                              setStudents((prev) =>
                                prev.map((s) => (s.id === student.id ? { ...s, gender: gender ?? undefined } : s))
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {student.rfid ? (
                            <span className="font-mono text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                              {student.rfid}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              No RFID
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                          {student.email}
                        </td>
                        {showArchived && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {student.status && student.status !== 'Active' ? (
                              <span className="inline-flex items-center text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-medium">
                                {student.status}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-[12px]">
                                —
                              </span>
                            )}
                          </td>
                        )}
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1 ">
                            {showArchived ? (
                              <button
                                onClick={() =>
                                  handleRestoreStudent(
                                    student.id,
                                    `${student.first_name} ${student.last_name}`
                                  )
                                }
                                className="p-1.5 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                                title="Restore"
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditDialog(student)}
                                  className="p-1.5 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteStudent(
                                      student.id,
                                      `${student.first_name} ${student.last_name}`
                                    )
                                  }
                                  disabled={deletingStudent}
                                  className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out disabled:opacity-50"
                                  title="Archive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-sm text-gray-400"
                    >
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

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
    </div>
  );
}
