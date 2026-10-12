'use client';

import { GenderCell } from '@/components/admin/gender-cell';
import { AddressData, AddressSelector } from '@/components/ui/address-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
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
import {
  ArchiveRestore,
  ChevronDown,
  Edit,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface Parent {
  gender?: string | null;
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  phone_number?: string;
  address?: string;
  status: string;
  children?: Array<{
    id: string;
    name: string;
    relationship_type: string;
  }>;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  grade_level: string;
}

export default function ParentManagementPage() {
  const { admin, loading: authLoading } = useAuth();
  const { refreshKey } = useRefresh();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewSheet, setShowViewSheet] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { showDeletePrompt } = useDeletePrompt();
  const initialAddress: AddressData = {
    barangay: '',
    barangayName: '',
    streetDetails: '',
  };

  const SUFFIX_OPTIONS = ['Jr.', 'Sr.', 'I', 'II', 'III', 'IV', 'V'];

  const [newParent, setNewParent] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    email: '',
    phone_number: '',
    address: initialAddress,
  });
  const [editParent, setEditParent] = useState({
    id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    email: '',
    phone_number: '',
    address: initialAddress,
  });
  const [linkData, setLinkData] = useState({
    parent_id: '',
    student_id: '',
    relationship_type: 'parent',
    is_primary: true,
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [addingParent, setAddingParent] = useState(false);
  const [updatingParent, setUpdatingParent] = useState(false);
  const [deletingParent, setDeletingParent] = useState(false);
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const fetchParents = async (archived = false) => {
    setLoading(true);
    try {
      const url = `/api/admin/parents${archived ? '?archived=true' : ''}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.success && result.parents) {
        setParents(result.parents);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      const result = await response.json();
      if (result.success && result.students) {
        setStudents(result.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchParents(showArchived);
    fetchStudents();
  }, [showArchived, refreshKey]);

  const tc = useTableControls(parents, {
    searchFields: ['first_name', 'last_name', 'email', 'phone_number'],
    defaultSort: { key: 'last_name', dir: 'asc' },
    pageSize: 25,
  });
  const statusOptions = [
    ...new Set(parents.map((p) => p.status).filter(Boolean)),
  ].sort() as string[];

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!newParent.first_name.trim()) missing.push('First Name');
    if (!newParent.last_name.trim()) missing.push('Last Name');
    if (!newParent.email.trim()) missing.push('Email');
    if (missing.length) {
      setAddError(`Required: ${missing.join(', ')}`);
      return;
    }
    setAddingParent(true);
    setAddError('');

    try {
      const tempPassword = `SN${Math.random().toString(36).slice(-6)}`;

      const addressString = `${newParent.address.streetDetails}${newParent.address.barangayName ? ', ' + newParent.address.barangayName : ''}, Trece Martires City, Cavite`;

      const response = await fetch('/api/admin/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newParent,
          address: addressString,
          password: tempPassword,
        }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to add parent');

      await fetchParents(showArchived);
      setNewParent({
        first_name: '',
        last_name: '',
        middle_name: '',
        suffix: '',
        email: '',
        phone_number: '',
        address: initialAddress,
      });
      setShowAddDialog(false);

      showAlert({
        message: `Guardian added successfully!\n\nLogin Credentials:\nEmail: ${newParent.email}\nPassword: ${tempPassword}\n\nPlease save these credentials!`,
        type: 'success',
      });
    } catch (error: any) {
      setAddError(error?.message || 'Failed to add guardian.');
    } finally {
      setAddingParent(false);
    }
  };

  const handleEditParent = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!editParent.first_name.trim()) missing.push('First Name');
    if (!editParent.last_name.trim()) missing.push('Last Name');
    if (!editParent.email.trim()) missing.push('Email');
    if (missing.length) {
      setEditError(`Required: ${missing.join(', ')}`);
      return;
    }
    setUpdatingParent(true);
    setEditError('');

    try {
      const addressString = `${editParent.address.streetDetails}${editParent.address.barangayName ? ', ' + editParent.address.barangayName : ''}, Trece Martires City, Cavite`;

      const response = await fetch(`/api/admin/parents/${editParent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editParent, address: addressString }),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to update parent');

      await fetchParents(showArchived);
      setShowEditDialog(false);
      showAlert({ message: 'Guardian updated successfully!', type: 'success' });
    } catch (error: any) {
      setEditError(error?.message || 'Failed to update guardian.');
    } finally {
      setUpdatingParent(false);
    }
  };

  const handleDeleteParent = async (parentId: string, parentName: string) => {
    const result = await showDeletePrompt({
      title: 'Archive Guardian',
      message: `Archive ${parentName}? They will no longer appear in active lists.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      reasonLabel: 'Reason for archiving',
      reasonRequired: true,
      presets: ['Moved Away', 'Student Graduated', 'Duplicate Account', 'Unresponsive', 'Other'],
    });

    if (!result?.confirmed) return;

    setDeletingParent(true);
    try {
      const response = await fetch(`/api/admin/parents/${parentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: result.reason || undefined }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.error || 'Failed to archive guardian');

      await fetchParents(showArchived);
      showAlert({
        message: 'Guardian archived successfully!',
        type: 'success',
      });
    } catch (error: any) {
      showAlert({
        message: error?.message || 'Failed to archive guardian.',
        type: 'error',
      });
    } finally {
      setDeletingParent(false);
    }
  };

  const handleRestoreParent = async (parentId: string, parentName: string) => {
    const confirmed = await showConfirm({
      message: `Restore ${parentName} from archive?`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/admin/parents/${parentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to restore');
      await fetchParents(showArchived);
      showAlert({
        message: 'Guardian restored successfully!',
        type: 'success',
      });
    } catch (error: any) {
      showAlert({
        message: error?.message || 'Failed to restore guardian.',
        type: 'error',
      });
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkingStudent(true);
    setLinkError('');

    try {
      const response = await fetch('/api/admin/parents/link-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      });

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || 'Failed to link student');

      await fetchParents(showArchived);
      setShowLinkDialog(false);
      setLinkData({
        parent_id: '',
        student_id: '',
        relationship_type: 'parent',
        is_primary: true,
      });
      showAlert({ message: 'Student linked successfully!', type: 'success' });
    } catch (error: any) {
      setLinkError(error?.message || 'Failed to link student.');
    } finally {
      setLinkingStudent(false);
    }
  };

  const openEditDialog = (parent: Parent) => {
    setEditParent({
      id: parent.id,
      first_name: parent.first_name,
      last_name: parent.last_name,
      middle_name: parent.middle_name || '',
      suffix: parent.suffix || '',
      email: parent.email,
      phone_number: parent.phone_number || '',
      address: {
        barangay: '',
        barangayName: '',
        streetDetails: parent.address || '',
      },
    });
    setShowEditDialog(true);
  };

  const openViewSheet = (parent: Parent) => {
    setSelectedParent(parent);
    setShowViewSheet(true);
  };

  const openLinkDialog = (parent: Parent) => {
    setLinkData({
      parent_id: parent.id,
      student_id: '',
      relationship_type: 'parent',
      is_primary: true,
    });
    setStudentSearch('');
    setStudentDropdownOpen(false);
    setShowLinkDialog(true);
  };

  const filteredStudents = students.filter((s) => {
    const term = studentSearch.toLowerCase();
    return (
      s.first_name.toLowerCase().includes(term) ||
      s.last_name.toLowerCase().includes(term) ||
      (s.student_number && s.student_number.toLowerCase().includes(term))
    );
  });

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
            Guardians{' '}
            {showArchived && (
              <span className="text-xs font-normal text-amber-600 ml-1">
                (Archived)
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {tc.filteredCount} of {tc.totalCount} records
          </p>
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
                  Add Guardian
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-red-800">
                    Add New Guardian
                  </DialogTitle>
                  <DialogDescription>
                    Enter guardian information to create a new account
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddParent} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label required>First Name</Label>
                      <Input
                        value={newParent.first_name}
                        onChange={(e) =>
                          setNewParent({
                            ...newParent,
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
                          value={newParent.last_name}
                          onChange={(e) => setNewParent({ ...newParent, last_name: e.target.value })}
                          placeholder="Enter last name"
                          required
                        />
                        <Select
                          value={newParent.suffix || 'none'}
                          onValueChange={(v) => setNewParent({ ...newParent, suffix: v === 'none' ? '' : v })}
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
                        value={newParent.middle_name}
                        onChange={(e) =>
                          setNewParent({
                            ...newParent,
                            middle_name: e.target.value,
                          })
                        }
                        placeholder="Enter middle name"
                      />
                    </div>
                    <div>
                      <Label required>Email</Label>
                      <Input
                        type="email"
                        value={newParent.email}
                        onChange={(e) =>
                          setNewParent({ ...newParent, email: e.target.value })
                        }
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div>
                      <Label required>Phone Number</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                          +63
                        </span>
                        <Input
                          className="rounded-l-none"
                          value={newParent.phone_number
                            .replace(/^\+63/, '')
                            .replace(/^0/, '')}
                          placeholder="9XXXXXXXXX"
                          inputMode="numeric"
                          maxLength={10}
                          onChange={(e) => {
                            const d = e.target.value.replace(/\D/g, '');
                            setNewParent({
                              ...newParent,
                              phone_number: d ? `+63${d}` : '',
                            });
                          }}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <AddressSelector
                        value={newParent.address}
                        onChange={(addr) =>
                          setNewParent({ ...newParent, address: addr })
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
                      disabled={addingParent}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-800 hover:bg-red-700"
                      disabled={addingParent}
                    >
                      {addingParent ? 'Adding...' : 'Add Guardian'}
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
            <DialogTitle className="text-red-800">Edit Guardian</DialogTitle>
            <DialogDescription>Update guardian information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditParent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>First Name</Label>
                <Input
                  value={editParent.first_name}
                  onChange={(e) =>
                    setEditParent({ ...editParent, first_name: e.target.value })
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
                    value={editParent.last_name}
                    onChange={(e) => setEditParent({ ...editParent, last_name: e.target.value })}
                    placeholder="Enter last name"
                    required
                  />
                  <Select
                    value={editParent.suffix || 'none'}
                    onValueChange={(v) => setEditParent({ ...editParent, suffix: v === 'none' ? '' : v })}
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
                  value={editParent.middle_name}
                  onChange={(e) =>
                    setEditParent({
                      ...editParent,
                      middle_name: e.target.value,
                    })
                  }
                  placeholder="Enter middle name"
                />
              </div>
              <div>
                <Label required>Email</Label>
                <Input
                  type="email"
                  value={editParent.email}
                  onChange={(e) =>
                    setEditParent({ ...editParent, email: e.target.value })
                  }
                  placeholder="Enter email address"
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
                    value={editParent.phone_number
                      .replace(/^\+63/, '')
                      .replace(/^0/, '')}
                    placeholder="9XXXXXXXXX"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '');
                      setEditParent({
                        ...editParent,
                        phone_number: d ? `+63${d}` : '',
                      });
                    }}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <AddressSelector
                  value={editParent.address}
                  onChange={(addr) =>
                    setEditParent({ ...editParent, address: addr })
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
                disabled={updatingParent}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-800 hover:bg-red-700"
                disabled={updatingParent}
              >
                {updatingParent ? 'Updating...' : 'Update Guardian'}
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
            <SheetTitle className="text-red-800">Guardian Details</SheetTitle>
            <SheetDescription>
              View complete guardian information
            </SheetDescription>
          </SheetHeader>
          {selectedParent && (
            <div className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Full Name
                  </h3>
                  <p className="text-base font-semibold">
                    {[selectedParent.first_name, selectedParent.middle_name, selectedParent.last_name, selectedParent.suffix].filter(Boolean).join(' ')}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Email
                  </h3>
                  <p className="text-base">{selectedParent.email}</p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </h3>
                  <p className="text-base">
                    {selectedParent.phone_number || 'N/A'}
                  </p>
                </div>
                <div className="pb-3 border-b">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Address
                  </h3>
                  <p className="text-base">{selectedParent.address || 'N/A'}</p>
                </div>
                <div className="pb-3 border-b"></div>
              </div>
              {selectedParent.children &&
                selectedParent.children.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Children/Wards
                    </h3>
                    <div className="space-y-2">
                      {selectedParent.children.map((child) => (
                        <div
                          key={child.id}
                          className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-medium">{child.name}</span>
                          <Badge variant="outline" className="bg-white">
                            {child.relationship_type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Link Student Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-800">
              Link Student to Guardian
            </DialogTitle>
            <DialogDescription>
              Associate a student with this guardian
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLinkStudent} className="space-y-4">
            <div>
              <Label required>Select Student</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStudentDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm border border-input rounded-md bg-background hover:bg-accent active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out"
                >
                  <span className={linkData.student_id ? 'text-foreground' : 'text-muted-foreground'}>
                    {linkData.student_id
                      ? (() => {
                          const s = students.find((s) => s.id === linkData.student_id);
                          return s ? `${s.first_name} ${s.last_name} - ${s.student_number}` : 'Choose a student';
                        })()
                      : 'Choose a student'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
                {studentDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setStudentDropdownOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <Input
                            className="pl-7 h-8 text-sm"
                            placeholder="Search by name or ID…"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <button
                              type="button"
                              key={student.id}
                              onClick={() => {
                                setLinkData((prev) => ({ ...prev, student_id: student.id }));
                                setStudentDropdownOpen(false);
                                setStudentSearch('');
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 active:scale-[0.97] transition-[background-color,transform] duration-150 ease-out ${linkData.student_id === student.id ? 'bg-red-50 text-red-800 font-medium' : 'text-gray-900'}`}
                            >
                              {student.first_name} {student.last_name} -{' '}
                              {student.student_number}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-4 text-center text-sm text-gray-400">
                            No students found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <Label required>Relationship to Student</Label>
              <Select
                value={linkData.relationship_type}
                onValueChange={(value) =>
                  setLinkData({ ...linkData, relationship_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="grandparent">Grandparent</SelectItem>
                  <SelectItem value="aunt">Aunt</SelectItem>
                  <SelectItem value="uncle">Uncle</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={linkData.is_primary}
                onChange={(e) =>
                  setLinkData({ ...linkData, is_primary: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="is_primary">Primary Contact</Label>
            </div>
            {linkError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {linkError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLinkDialog(false)}
                disabled={linkingStudent}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-red-800 hover:bg-red-700"
                disabled={linkingStudent}
              >
                {linkingStudent ? 'Linking...' : 'Link Student'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search guardians…"
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
          {tc.search && (
            <button
              onClick={tc.clearFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 active:scale-95 transition-[color,transform] duration-150 ease-out"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <SortHeader
                    label="Name"
                    sortKey="last_name"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label="Email"
                    sortKey="email"
                    currentSort={tc.sort}
                    onSort={tc.toggleSort}
                  />
                  <SortHeader
                    label="Phone"
                    sortKey="phone_number"
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
                    Children
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tc.rows.length > 0 ? (
                  tc.rows.map((parent) => {
                    return (
                      <tr
                        key={parent.id}
                        onClick={() => openViewSheet(parent)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[13px] font-medium text-gray-900">
                            {parent.first_name} {parent.last_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                          {parent.email}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">
                          {parent.phone_number || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <GenderCell
                            resource="parents"
                            userId={parent.id}
                            value={parent.gender}
                            onSaved={(gender) =>
                              setParents((prev) => prev.map((p) => (p.id === parent.id ? { ...p, gender } : p)))
                            }
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {parent.children && parent.children.length > 0 ? (
                            <span className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                              {parent.children.length}{' '}
                              {parent.children.length === 1
                                ? 'child'
                                : 'children'}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1 ">
                            {showArchived ? (
                              <button
                                onClick={() =>
                                  handleRestoreParent(
                                    parent.id,
                                    `${parent.first_name} ${parent.last_name}`
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
                                  onClick={() => openLinkDialog(parent)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                                  title="Link children"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openEditDialog(parent)}
                                  className="p-1.5 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteParent(
                                      parent.id,
                                      `${parent.first_name} ${parent.last_name}`
                                    )
                                  }
                                  disabled={deletingParent}
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
                      colSpan={7}
                      className="px-4 py-16 text-center text-sm text-gray-400"
                    >
                      No guardians found
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
