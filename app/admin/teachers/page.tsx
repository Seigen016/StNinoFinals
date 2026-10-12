'use client';

import { GenderCell } from '@/components/admin/gender-cell';
import { AddressData, AddressSelector } from '@/components/ui/address-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
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
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { useTableControls } from '@/hooks/use-table-controls';
import { useAlert } from '@/lib/use-alert';
import { useConfirm } from '@/lib/use-confirm';
import { useDeletePrompt } from '@/lib/use-delete-prompt';
import { AlertTriangle, ArchiveRestore, Edit, Radio, Search, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRefresh } from '@/lib/refresh-context';

function RfidScanInput({
  value,
  onChange,
  placeholder = 'Enter or scan RFID',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSeenRef = useRef<string | null>(null);

  const stopScan = () => {
    setScanning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    fetch('/api/admin/rfid-assignment-mode', { method: 'DELETE' }).catch(() => {});
  };

  const startScan = async () => {
    lastSeenRef.current = null;
    await fetch('/api/admin/rfid-assignment-mode', { method: 'POST' }).catch(() => {});
    setScanning(true);
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/rfid-latest-scan?window=15');
        const data = await res.json();
        if (data.success && data.rfid && data.rfid !== lastSeenRef.current) {
          lastSeenRef.current = data.rfid;
          onChange(data.rfid);
          stopScan();
        }
      } catch {}
    }, 1500);
  };

  useEffect(() => () => stopScan(), []);

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={value}
        onChange={() => {}}
        readOnly
        placeholder={placeholder}
        className="flex-1 cursor-not-allowed bg-gray-50"
      />
      {scanning ? (
        <Button type="button" variant="outline" size="sm" onClick={stopScan} className="shrink-0 gap-1 text-red-700 border-red-300">
          <Radio className="w-4 h-4 animate-pulse" />
          Waiting…
        </Button>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={startScan} className="shrink-0 gap-1">
          <Radio className="w-4 h-4" />
          Scan
        </Button>
      )}
    </div>
  );
}
import { useAuth } from '../hooks/useAuth';

interface Teacher {
  gender?: string | null;
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  employee_number: string;
  department?: string;
  specialization?: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  date_hired?: string;
  address?: string;
  rfid?: string;
  status: string;
}

export default function TeacherManagementPage() {
  const { admin, loading: authLoading } = useAuth();
  const { refreshKey } = useRefresh();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewSheet, setShowViewSheet] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { showDeletePrompt } = useDeletePrompt();
  const initialAddress: AddressData = {
    barangay: '',
    barangayName: '',
    streetDetails: '',
  };

  // Default date of birth for 18 years old
  const getDefault18YearsOld = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date.toISOString().split('T')[0];
  };

  const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

  const [newTeacher, setNewTeacher] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    employee_number: '',
    department: '',
    specialization: '',
    email: '',
    phone_number: '',
    date_of_birth: getDefault18YearsOld(),
    date_hired: '',
    address: initialAddress,
    rfid: '',
  });
  const [editTeacher, setEditTeacher] = useState({
    id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    employee_number: '',
    department: '',
    specialization: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    date_hired: '',
    address: initialAddress,
    rfid: '',
  });
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [updatingTeacher, setUpdatingTeacher] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchTeachers = async (archived = false) => {
    setLoading(true);
    try {
      const url = `/api/admin/teachers${archived ? '?archived=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.teachers) {
        setTeachers(result.teachers);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers(showArchived);
  }, [showArchived, refreshKey]);

  // has_rfid is derived so the exact-match table filter can filter on it
  const rows = useMemo(() => teachers.map((r) => ({ ...r, has_rfid: r.rfid ? 'yes' : 'no' })), [teachers]);
  const noRfidCount = rows.filter((r) => r.has_rfid === 'no').length;
  const tc = useTableControls(rows, {
    searchFields: ['first_name', 'last_name', 'employee_number', 'email'],
    defaultSort: { key: 'last_name', dir: 'asc' },
    pageSize: 25,
  });
  const deptOptions = [...new Set(teachers.map((t) => t.department).filter(Boolean))].sort() as string[];
  const statusOptions = [...new Set(teachers.map((t) => t.status).filter(Boolean))].sort() as string[];

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!newTeacher.first_name.trim()) missing.push('First Name');
    if (!newTeacher.last_name.trim()) missing.push('Last Name');
    if (!newTeacher.email.trim()) missing.push('Email');
    if (missing.length) { setAddError(`Required: ${missing.join(', ')}`); return; }
    setAddingTeacher(true);
    setAddError('');

    try {
      const tempPassword = `SN${Math.random().toString(36).slice(-6)}`;

      const addressString = `${newTeacher.address.streetDetails}${newTeacher.address.barangayName ? ', ' + newTeacher.address.barangayName : ''}, Trece Martires City, Cavite`;

      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTeacher,
          address: addressString,
          password: tempPassword,
        }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to add teacher');

      await fetchTeachers(showArchived);
      setNewTeacher({
        first_name: '',
        last_name: '',
        middle_name: '',
        suffix: '',
        employee_number: '',
        department: '',
        specialization: '',
        email: '',
        phone_number: '',
        date_of_birth: getDefault18YearsOld(),
        date_hired: '',
        address: initialAddress,
        rfid: '',
      });
      setShowAddDialog(false);

      showAlert({
        message: `Teacher added successfully!\n\nLogin Credentials:\nEmail: ${newTeacher.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: 'success',
      });
    } catch (error: any) {
      setAddError(error?.message || 'Failed to add teacher.');
    } finally {
      setAddingTeacher(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!editTeacher.first_name.trim()) missing.push('First Name');
    if (!editTeacher.last_name.trim()) missing.push('Last Name');
    if (!editTeacher.email.trim()) missing.push('Email');
    if (missing.length) { setEditError(`Required: ${missing.join(', ')}`); return; }
    setUpdatingTeacher(true);
    setEditError('');

    try {
      const addressString = `${editTeacher.address.streetDetails}${editTeacher.address.barangayName ? ', ' + editTeacher.address.barangayName : ''}, Trece Martires City, Cavite`;

      const response = await fetch(`/api/admin/teachers/${editTeacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editTeacher, address: addressString }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to update teacher');

      await fetchTeachers(showArchived);
      setShowEditDialog(false);
      showAlert({ message: 'Teacher updated successfully!', type: 'success' });
    } catch (error: any) {
      setEditError(error?.message || 'Failed to update teacher.');
    } finally {
      setUpdatingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (
    teacherId: string,
    teacherName: string
  ) => {
    const result = await showDeletePrompt({
      title: 'Archive Teacher',
      message: `Archive ${teacherName}? They will no longer appear in active lists.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      reasonLabel: 'Reason for archiving',
      reasonRequired: true,
      presets: ['Resigned', 'Terminated', 'Retired', 'Contract Ended', 'Long Absence', 'Other'],
    });

    if (!result?.confirmed) return;

    setDeletingTeacher(true);
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: result.reason || undefined }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || 'Failed to archive teacher');

      await fetchTeachers(showArchived);
      showAlert({ message: 'Teacher archived successfully!', type: 'success' });
    } catch (error: any) {
      showAlert({
        message: error?.message || 'Failed to archive teacher.',
        type: 'error',
      });
    } finally {
      setDeletingTeacher(false);
    }
  };

  const handleRestoreTeacher = async (teacherId: string, teacherName: string) => {
    const confirmed = await showConfirm({
      message: `Restore ${teacherName} from archive?`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to restore');
      await fetchTeachers(showArchived);
      showAlert({ message: 'Teacher restored successfully!', type: 'success' });
    } catch (error: any) {
      showAlert({ message: error?.message || 'Failed to restore teacher.', type: 'error' });
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setEditTeacher({
      id: teacher.id,
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      middle_name: teacher.middle_name || '',
      suffix: teacher.suffix || '',
      employee_number: teacher.employee_number,
      department: teacher.department || '',
      specialization: teacher.specialization || '',
      email: teacher.email,
      phone_number: teacher.phone_number || '',
      date_of_birth: teacher.date_of_birth || '',
      date_hired: teacher.date_hired || '',
      address: {
        barangay: '',
        barangayName: '',
        streetDetails: teacher.address || '',
      },
      rfid: teacher.rfid || '',
    });
    setShowEditDialog(true);
  };

  const openViewSheet = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
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
            Teachers {showArchived && <span className="text-xs font-normal text-amber-600 ml-1">(Archived)</span>}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{tc.filteredCount} of {tc.totalCount} records
            {noRfidCount > 0 && <span className="text-amber-600"> · {noRfidCount} without RFID</span>}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out ${showArchived ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          {!showArchived && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out">
              <UserPlus className="w-3.5 h-3.5" />
              Add Teacher
            </button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-red-800">
                  Add New Teacher
                </DialogTitle>
                <DialogDescription>
                  Enter teacher information to create a new account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTeacher} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>First Name</Label>
                    <Input
                      value={newTeacher.first_name}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <div className="flex gap-2">
                      <Input
                        className="flex-1"
                        value={newTeacher.last_name}
                        onChange={(e) => setNewTeacher({ ...newTeacher, last_name: e.target.value })}
                        placeholder="Enter last name"
                        required
                      />
                      <Select
                        value={newTeacher.suffix || 'none'}
                        onValueChange={(v) => setNewTeacher({ ...newTeacher, suffix: v === 'none' ? '' : v })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue placeholder="Sfx" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {SUFFIX_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Middle Name</Label>
                    <Input
                      value={newTeacher.middle_name}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          middle_name: e.target.value,
                        })
                      }
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div>
                    <Label required>Employee Number</Label>
                    <Input
                      value={newTeacher.employee_number}
                      inputMode="numeric"
                      maxLength={12}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          employee_number: e.target.value.replace(/\D/g, '').slice(0, 12),
                        })
                      }
                      placeholder="e.g. 202400000001"
                      required
                    />
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={newTeacher.department}
                      onValueChange={(value) =>
                        setNewTeacher({ ...newTeacher, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Filipino">Filipino</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="AP">AP</SelectItem>
                        <SelectItem value="ESP">ESP</SelectItem>
                        <SelectItem value="MT">MT</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="MAPEH">MAPEH</SelectItem>
                        <SelectItem value="EPP">EPP</SelectItem>
                        <SelectItem value="TLE">TLE</SelectItem>
                        <SelectItem value="ELECTIVE">ELECTIVE</SelectItem>
                        <SelectItem value="WRITING">WRITING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Specialization</Label>
                    <Input
                      value={newTeacher.specialization}
                      onChange={(e) =>
                        setNewTeacher({
                          ...newTeacher,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Algebra, Physics"
                    />
                  </div>
                  <div>
                    <Label required>Email</Label>
                    <Input
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) =>
                        setNewTeacher({ ...newTeacher, email: e.target.value })
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">+63</span>
                      <Input
                        className="rounded-l-none"
                        value={newTeacher.phone_number.replace(/^\+63/, '').replace(/^0/, '')}
                        placeholder="9XXXXXXXXX"
                        inputMode="numeric"
                        maxLength={10}
                        onChange={(e) => {
                          const d = e.target.value.replace(/\D/g, '');
                          setNewTeacher({ ...newTeacher, phone_number: d ? `+63${d}` : '' });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <DatePicker
                      value={newTeacher.date_of_birth}
                      onChange={(v) =>
                        setNewTeacher({ ...newTeacher, date_of_birth: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>Date Hired</Label>
                    <DatePicker
                      value={newTeacher.date_hired}
                      onChange={(v) =>
                        setNewTeacher({ ...newTeacher, date_hired: v })
                      }
                    />
                  </div>
                  <div>
                    <Label>RFID Card Number</Label>
                    <RfidScanInput
                      value={newTeacher.rfid}
                      onChange={(v) => setNewTeacher({ ...newTeacher, rfid: v })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <AddressSelector
                      value={newTeacher.address}
                      onChange={(addr) =>
                        setNewTeacher({ ...newTeacher, address: addr })
                      }
                    />
                  </div>
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
                    disabled={addingTeacher}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-red-800 hover:bg-red-700"
                    disabled={addingTeacher}
                  >
                    {addingTeacher ? 'Adding...' : 'Add Teacher'}
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
              <DialogTitle className="text-red-800">Edit Teacher</DialogTitle>
              <DialogDescription>Update teacher information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditTeacher} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label required>First Name</Label>
                  <Input
                    value={editTeacher.first_name}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        first_name: e.target.value,
                      })
                    }
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <Label required>Last Name</Label>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={editTeacher.last_name}
                      onChange={(e) => setEditTeacher({ ...editTeacher, last_name: e.target.value })}
                      placeholder="Enter last name"
                      required
                    />
                    <Select
                      value={editTeacher.suffix || 'none'}
                      onValueChange={(v) => setEditTeacher({ ...editTeacher, suffix: v === 'none' ? '' : v })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Sfx" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        {SUFFIX_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Middle Name</Label>
                  <Input
                    value={editTeacher.middle_name}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        middle_name: e.target.value,
                      })
                    }
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <Label required>Employee Number</Label>
                  <Input
                    value={editTeacher.employee_number}
                    inputMode="numeric"
                    maxLength={12}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        employee_number: e.target.value.replace(/\D/g, '').slice(0, 12),
                      })
                    }
                    placeholder="e.g. 202400000001"
                    required
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select
                    value={editTeacher.department}
                    onValueChange={(value) =>
                      setEditTeacher({ ...editTeacher, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Filipino">Filipino</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="AP">AP</SelectItem>
                      <SelectItem value="ESP">ESP</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="MAPEH">MAPEH</SelectItem>
                      <SelectItem value="EPP">EPP</SelectItem>
                      <SelectItem value="TLE">TLE</SelectItem>
                      <SelectItem value="ELECTIVE">ELECTIVE</SelectItem>
                      <SelectItem value="WRITING">WRITING</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <Input
                    value={editTeacher.specialization}
                    onChange={(e) =>
                      setEditTeacher({
                        ...editTeacher,
                        specialization: e.target.value,
                      })
                    }
                    placeholder="e.g., Algebra, Physics"
                  />
                </div>
                <div>
                  <Label required>Email</Label>
                  <Input
                    type="email"
                    value={editTeacher.email}
                    onChange={(e) =>
                      setEditTeacher({ ...editTeacher, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">+63</span>
                    <Input
                      className="rounded-l-none"
                      value={editTeacher.phone_number.replace(/^\+63/, '').replace(/^0/, '')}
                      placeholder="9XXXXXXXXX"
                      inputMode="numeric"
                      maxLength={10}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, '');
                        setEditTeacher({ ...editTeacher, phone_number: d ? `+63${d}` : '' });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <DatePicker
                    value={editTeacher.date_of_birth}
                    onChange={(v) =>
                      setEditTeacher({ ...editTeacher, date_of_birth: v })
                    }
                  />
                </div>
                <div>
                  <Label>Date Hired</Label>
                  <DatePicker
                    value={editTeacher.date_hired}
                    onChange={(v) =>
                      setEditTeacher({ ...editTeacher, date_hired: v })
                    }
                  />
                </div>
                <div>
                  <Label>RFID Card Number</Label>
                  <RfidScanInput
                    value={editTeacher.rfid}
                    onChange={(v) => setEditTeacher({ ...editTeacher, rfid: v })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <AddressSelector
                    value={editTeacher.address}
                    onChange={(addr) =>
                      setEditTeacher({ ...editTeacher, address: addr })
                    }
                  />
                </div>
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
                  disabled={updatingTeacher}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-800 hover:bg-red-700"
                  disabled={updatingTeacher}
                >
                  {updatingTeacher ? 'Updating...' : 'Update Teacher'}
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
              <SheetTitle className="text-red-800">Teacher Details</SheetTitle>
              <SheetDescription>
                View complete teacher information
              </SheetDescription>
            </SheetHeader>
            {selectedTeacher && (
              <div className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </h3>
                    <p className="text-base font-semibold">
                      {[selectedTeacher.first_name, selectedTeacher.middle_name, selectedTeacher.last_name, selectedTeacher.suffix].filter(Boolean).join(' ')}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Employee Number
                    </h3>
                    <p className="text-base font-mono">
                      {selectedTeacher.employee_number}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Department
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.department || 'N/A'}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Specialization
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.specialization || 'N/A'}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Email
                    </h3>
                    <p className="text-base">{selectedTeacher.email}</p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Phone Number
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.phone_number || 'N/A'}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Date of Birth
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.date_of_birth || 'N/A'}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Date Hired
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.date_hired || 'N/A'}
                    </p>
                  </div>
                  <div className="pb-3 border-b">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      RFID Card
                    </h3>
                    {selectedTeacher.rfid ? (
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Assigned
                        </Badge>
                        <p className="text-sm text-gray-600 font-mono">
                          {selectedTeacher.rfid}
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
                      Address
                    </h3>
                    <p className="text-base">
                      {selectedTeacher.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers…"
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
          <select
            value={tc.filters['department'] ?? ''}
            onChange={(e) => tc.setFilter('department', e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
          >
            <option value="">All Departments</option>
            {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
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
          {(tc.search || tc.filters['department'] || tc.filters['has_rfid']) && (
            <button onClick={tc.clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 active:scale-[0.97] transition-[color,transform] duration-150 ease-out">
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
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Employee No.</th>
                  <SortHeader label="Name"           sortKey="last_name"      currentSort={tc.sort} onSort={tc.toggleSort} />
                  <SortHeader label="Department"     sortKey="department"     currentSort={tc.sort} onSort={tc.toggleSort} />
                  <SortHeader label="Specialization" sortKey="specialization" currentSort={tc.sort} onSort={tc.toggleSort} />
                  <SortHeader label="Gender"         sortKey="gender"         currentSort={tc.sort} onSort={tc.toggleSort} />
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">RFID</th>
                  <SortHeader label="Email"          sortKey="email"          currentSort={tc.sort} onSort={tc.toggleSort} />
                  {showArchived && (
                    <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Reason</th>
                  )}
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tc.rows.length > 0 ? tc.rows.map((teacher) => {
                  return (
                    <tr
                      key={teacher.id}
                      onClick={() => openViewSheet(teacher)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-gray-500 whitespace-nowrap">
                        {teacher.employee_number}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[13px] font-medium text-gray-900">
                          {teacher.first_name} {teacher.last_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {teacher.department ? (
                          <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {teacher.department}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                        {teacher.specialization || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <GenderCell
                          resource="teachers"
                          userId={teacher.id}
                          value={teacher.gender}
                          onSaved={(gender) =>
                            setTeachers((prev) => prev.map((t) => (t.id === teacher.id ? { ...t, gender } : t)))
                          }
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {teacher.rfid ? (
                          <span className="font-mono text-[11px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                            {teacher.rfid}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            No RFID
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                        {teacher.email}
                      </td>
                      {showArchived && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {teacher.status && teacher.status !== 'Active' ? (
                            <span className="inline-flex items-center text-[11px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded font-medium">
                              {teacher.status}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-[12px]">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 ">
                          {showArchived ? (
                            <button
                              onClick={() => handleRestoreTeacher(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                              className="p-1.5 rounded-md text-green-600 hover:text-green-700 hover:bg-green-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                              title="Restore"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openEditDialog(teacher)}
                                className="p-1.5 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(teacher.id, `${teacher.first_name} ${teacher.last_name}`)}
                                disabled={deletingTeacher}
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
                }) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-sm text-gray-400">
                      No teachers found
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
