'use client';

import { SchoolYearTabs } from '@/components/admin/school-year-tabs';
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
import { useConfirm } from '@/lib/use-confirm';
import { useDeletePrompt } from '@/lib/use-delete-prompt';
import { parseScheduleSlots, parseScheduleTime, ScheduleSlot, timesOverlap } from '@/lib/rooms';
import { getActiveSchoolYear, getSchoolYearOptions, normalizeSchoolYear } from '@/lib/school-year';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Archive, ArchiveRestore, BookOpen, Edit, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useRefresh } from '@/lib/refresh-context';
import { sortGradeLevels } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

const DAY_OPTIONS = ['M', 'T', 'W', 'Th', 'F'];

const DAY_LABELS: Record<string, string> = { M: 'Monday', T: 'Tuesday', W: 'Wednesday', Th: 'Thursday', F: 'Friday' };

interface Class {
  id: string;
  class_code: string;
  class_name: string;
  grade_level: string | null;
  section: string | null;
  school_year: string;
  semester: string;
  teacher_id: string | null;
  teacher_name?: string | null;
  room: string | null;
  schedule: string | null;
  description: string | null;
  is_active: boolean;
  students?: any[];
  teacher?: any;
}

type FlatClass = Class & {
  teacherName: string;
  quarterDisplay: string;
  statusLabel: string;
};

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  grade_level: string | null;
  section: string | null;
}

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  const [formData, setFormData] = useState({
    class_code: '',
    class_name: '',
    grade_level: '',
    section: '',
    school_year: '',
    semester: '',
    teacher_id: '',
    room: '',
    description: '',
  });
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [sectionsByGrade, setSectionsByGrade] = useState<Record<string, string[]>>({});
  const [rooms, setRooms] = useState<{ id: string; name: string; capacity: number | null }[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const { showDeletePrompt } = useDeletePrompt();
  const { refreshKey } = useRefresh();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/admin/settings/sections');
        const data = await res.json();
        if (data.success && data.sections) setSectionsByGrade(data.sections);
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
    fetch('/api/admin/rooms')
      .then((r) => r.json())
      .then((d) => { if (d.success) setRooms(d.rooms.filter((r: any) => r.is_active).map((r: any) => ({ id: r.id, name: r.name, capacity: r.capacity }))); })
      .catch(() => {});
  }, [refreshKey, showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/classes${showArchived ? '?archived=true' : ''}`);
      const data = await response.json();
      if (data.success) setClasses(data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      showAlert({ message: 'Failed to load subjects', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (classItem: Class) => {
    const confirmed = await showConfirm({
      title: 'Archive Subject',
      message: `Archive "${classItem.class_name}"? It will be hidden from the active list but its history and roster stay intact.`,
    });
    if (!confirmed) return;
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classItem.id, is_active: false }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({ message: 'Subject archived', type: 'success' });
        fetchClasses();
      } else {
        showAlert({ message: data.error || 'Failed to archive subject', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Failed to archive subject', type: 'error' });
    }
  };

  const handleRestore = async (classItem: Class) => {
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: classItem.id, is_active: true }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({ message: 'Subject restored', type: 'success' });
        fetchClasses();
      } else {
        showAlert({ message: data.error || 'Failed to restore subject', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Failed to restore subject', type: 'error' });
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/admin/teachers');
      const data = await response.json();
      if (data.success) setTeachers(data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students/all');
      const data = await response.json();
      if (data.success) setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleOpenDialog = (classItem?: Class) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        class_code: classItem.class_code,
        class_name: classItem.class_name,
        grade_level: classItem.grade_level || '',
        section: classItem.section || '',
        school_year: normalizeSchoolYear(classItem.school_year),
        semester: String((classItem as any).quarter ?? classItem.semester ?? ''),
        teacher_id: classItem.teacher_id || '',
        room: classItem.room || '',
        description: classItem.description || '',
      });
      setScheduleSlots(parseScheduleSlots(classItem.schedule));
      fetchClassDetails(classItem.id);
    } else {
      setEditingClass(null);
      setFormData({
        class_code: '',
        class_name: '',
        grade_level: '',
        section: '',
        school_year: getActiveSchoolYear(),
        semester: '1',
        teacher_id: '',
        room: '',
        description: '',
      });
      setScheduleSlots([]);
      setSelectedStudentIds([]);
    }
    setStudentSearch('');
    setShowDialog(true);
  };

  const fetchClassDetails = async (classId: string) => {
    try {
      const response = await fetch(`/api/admin/classes?classId=${classId}`);
      const data = await response.json();
      if (data.success && data.class) {
        setSelectedStudentIds(data.class.students?.map((s: any) => s.id) || []);
      }
    } catch (error) {
      console.error('Error fetching class details:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.class_code || !formData.class_name) {
      showAlert({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }
    try {
      const schedule = scheduleSlots.length > 0 ? JSON.stringify(scheduleSlots) : null;
      const payload = { ...formData, school_year: normalizeSchoolYear(formData.school_year), schedule, student_ids: selectedStudentIds, id: editingClass?.id };
      const response = await fetch('/api/admin/classes', {
        method: editingClass ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        showAlert({ message: editingClass ? 'Subject updated successfully' : 'Subject created successfully', type: 'success' });
        setShowDialog(false);
        fetchClasses();
      } else {
        showAlert({ message: data.error || 'Operation failed', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      showAlert({ message: 'Failed to save subject', type: 'error' });
    }
  };

  const handleViewStudents = async (classItem: Class) => {
    setViewingClass(classItem);
    setLoadingStudents(true);
    setShowStudentsDialog(true);
    try {
      const response = await fetch(`/api/admin/classes?classId=${classItem.id}`);
      const result = await response.json();
      setClassStudents(result.success && result.class?.students ? result.class.students : []);
    } catch (error) {
      console.error('Error fetching class students:', error);
      setClassStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleExportExcel = async () => {
    if (!viewingClass || classStudents.length === 0) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    await downloadExcel(`${viewingClass.class_name}_students`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'SUBJECT STUDENT LIST',
        `Subject: ${viewingClass.class_name}  |  ${viewingClass.grade_level || ''} ${viewingClass.section ? `— ${viewingClass.section}` : ''}`,
        `Generated: ${generated}`,
      ],
      columns: ['#', 'Student Number', 'Last Name', 'First Name', 'Grade Level', 'Section'],
      colWidths: [8, 20, 30, 30, 18, 18],
      rows: classStudents.map((s, i) => [i + 1, s.student_number, s.last_name, s.first_name, s.grade_level || '', s.section || '']),
      headerColor: 'blue',
    });
  };

  const handleExportPDF = () => {
    if (!viewingClass || classStudents.length === 0) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 105, 21, { align: 'center' });
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('SUBJECT STUDENT LIST', 105, 30, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Subject: ${viewingClass.class_name}  |  ${viewingClass.grade_level || ''} ${viewingClass.section ? `— ${viewingClass.section}` : ''}`, 105, 37, { align: 'center' });
    doc.text(`Generated: ${generated}`, 105, 42, { align: 'center' });

    autoTable(doc, {
      startY: 48,
      head: [['#', 'Student Number', 'Last Name', 'First Name', 'Grade Level', 'Section']],
      body: classStudents.map((s, i) => [i + 1, s.student_number, s.last_name, s.first_name, s.grade_level || '—', s.section || '—']),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { halign: 'center', cellWidth: 10 } },
      margin: { left: 15, right: 15 },
    });

    doc.save(`${viewingClass.class_name}_students.pdf`);
  };

  const handleDelete = async (classItem: Class) => {
    const result = await showDeletePrompt({
      title: 'Delete Subject',
      message: `Delete "${classItem.class_name}"? This will remove all student enrollments.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      reasonLabel: 'Reason for deletion (optional)',
    });
    if (!result?.confirmed) return;
    try {
      const response = await fetch(`/api/admin/classes?classId=${classItem.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        showAlert({ message: 'Subject deleted successfully', type: 'success' });
        fetchClasses();
      } else {
        showAlert({ message: data.error || 'Failed to delete subject', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      showAlert({ message: 'Failed to delete subject', type: 'error' });
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const filteredStudents = useMemo(() => {
    let list = students;
    if (formData.grade_level) {
      list = list.filter(s =>
        s.grade_level && s.grade_level.trim().toLowerCase() === formData.grade_level.trim().toLowerCase()
      );
    }
    // When a section is selected, show only students in that section OR with no section
    if (formData.section) {
      list = list.filter(s =>
        !s.section || s.section.trim().toLowerCase() === formData.section.trim().toLowerCase()
      );
    }
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      list = list.filter(s =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [students, formData.grade_level, formData.section, studentSearch]);

  const flatClasses = useMemo<FlatClass[]>(() =>
    classes.map(c => ({
      ...c,
      teacherName: c.teacher_name ?? 'Unassigned',
      // normalized so the exact-match school year filter catches legacy "2026"
      school_year: normalizeSchoolYear(c.school_year),
      quarterDisplay: String((c as any).quarter ?? c.semester ?? ''),
      statusLabel: c.is_active ? 'active' : 'inactive',
    })),
    [classes]
  );

  const gradeOptions = useMemo(() => {
    const seen = new Set<string>();
    const unique = classes
      .flatMap(c => c.grade_level ? [c.grade_level] : [])
      .filter(g => { if (seen.has(g)) return false; seen.add(g); return true; });
    return sortGradeLevels(unique);
  }, [classes]);

  const tc = useTableControls(flatClasses, {
    searchFields: ['class_name', 'class_code', 'teacherName'],
    defaultSort: { key: 'class_name', dir: 'asc' },
    pageSize: 25,
  });

  const hasFilters = !!tc.search || !!tc.filters['grade_level'];

  const conflictedRooms = useMemo(() => {
    if (scheduleSlots.length === 0) return new Set<string>();
    const conflicted = new Set<string>();
    for (const cls of classes) {
      if (cls.id === editingClass?.id || !cls.room || !cls.schedule) continue;
      const clsSlots = parseScheduleSlots(cls.schedule);
      for (const mine of scheduleSlots) {
        const myTime = parseScheduleTime(`${mine.day} ${mine.start} - ${mine.end}`);
        if (!myTime) continue;
        for (const theirs of clsSlots) {
          if (mine.day !== theirs.day) continue;
          const theirTime = parseScheduleTime(`${theirs.day} ${theirs.start} - ${theirs.end}`);
          if (theirTime && timesOverlap(myTime, theirTime)) conflicted.add(cls.room);
        }
      }
    }
    return conflicted;
  }, [scheduleSlots, classes, editingClass]);

  return (
    <div className="p-4 md:p-6 space-y-5 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Subject Management
            {showArchived && <span className="text-sm font-normal text-amber-600 ml-1">(Archived)</span>}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage subjects, assign teachers and students
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out ${showArchived ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {showArchived ? 'View Active' : 'View Archived'}
          </button>
          {!showArchived && (
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          )}
        </div>
      </div>

      <SchoolYearTabs
        value={tc.filters['school_year'] ?? ''}
        onChange={(sy) => tc.setFilter('school_year', sy)}
      />

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            placeholder="Search subject name, code, or teacher..."
            value={tc.search}
            onChange={e => tc.setSearch(e.target.value)}
          />
        </div>
        <Select
          value={tc.filters['grade_level'] || 'all'}
          onValueChange={v => tc.setFilter('grade_level', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Grade Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grades</SelectItem>
            {gradeOptions.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <button
            onClick={() => tc.clearFilters()}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 px-2 py-1 rounded active:scale-[0.97] hover:bg-gray-100 transition-[color,background-color,transform] duration-150 ease-out"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
          </div>
        ) : tc.rows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {hasFilters
              ? 'No subjects match the selected filters.'
              : 'No subjects found. Click "Add Subject" to create one.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[770px]">
            <thead>
              <tr className="bg-gray-50">
                <SortHeader label="Subject Code"     sortKey="class_code"      currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
                <SortHeader label="Subject Name"    sortKey="class_name"      currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Grade / Section" sortKey="grade_level"     currentSort={tc.sort} onSort={tc.toggleSort} />
                <SortHeader label="Teacher"         sortKey="teacherName"     currentSort={tc.sort} onSort={tc.toggleSort} />
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Room</th>
                <th className="px-4 py-2.5 pr-4 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tc.rows.map(classItem => (
                <tr key={classItem.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 pl-4">
                    <span className="font-mono text-[12px] text-gray-500">{classItem.class_code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{classItem.class_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {classItem.grade_level && classItem.section
                      ? `${classItem.grade_level} — ${classItem.section}`
                      : classItem.grade_level || classItem.section || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {classItem.teacher_name
                      ? classItem.teacher_name
                      : <span className="text-gray-400 italic">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {classItem.room || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 pr-4">
                    <div className="flex items-center justify-end gap-1 ">
                      {showArchived ? (
                        <button
                          onClick={() => handleRestore(classItem)}
                          title="Restore"
                          className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleViewStudents(classItem)}
                            title="View Enrolled Students"
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                          >
                            <Users className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDialog(classItem)}
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-500 hover:text-blue-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(classItem)}
                            title="Archive"
                            className="p-1.5 rounded hover:bg-amber-50 text-gray-400 hover:text-amber-600 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(classItem)}
                            title="Delete permanently"
                            className="p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-700 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            {tc.totalCount} subject{tc.totalCount !== 1 ? 's' : ''}
          </span>
          {tc.pageCount > 1 && (
            <Pagination
              page={tc.page}
              pageCount={tc.pageCount}
              totalCount={tc.totalCount}
              filteredCount={tc.filteredCount}
              pageSize={tc.pageSize}
              onPageChange={tc.setPage}
              onPageSizeChange={tc.setPageSize}
            />
          )}
        </div>
      </div>

      {/* Form Dialog — keep unchanged */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Subject' : 'Create New Subject'}</DialogTitle>
            <DialogDescription>
              {editingClass
                ? 'Update subject information and enrollment'
                : 'Fill in the details to create a new subject'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class_code" required>Subject Code</Label>
                <Input
                  id="class_code"
                  value={formData.class_code}
                  onChange={e => setFormData({ ...formData, class_code: e.target.value })}
                  placeholder="e.g., MATH101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_name" required>Subject Name</Label>
                <Input
                  id="class_name"
                  value={formData.class_name}
                  onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g., Mathematics"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade_level">Grade Level</Label>
                <Select
                  value={formData.grade_level}
                  onValueChange={value => setFormData({ ...formData, grade_level: value, section: '' })}
                >
                  <SelectTrigger id="grade_level"><SelectValue placeholder="Select grade level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kinder">Kinder</SelectItem>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                    <SelectItem value="Grade 9">Grade 9</SelectItem>
                    <SelectItem value="Grade 10">Grade 10</SelectItem>
                    <SelectItem value="Grade 11">Grade 11</SelectItem>
                    <SelectItem value="Grade 12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={formData.section}
                  onValueChange={value => setFormData({ ...formData, section: value })}
                >
                  <SelectTrigger id="section"><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {(sectionsByGrade[formData.grade_level] || []).map(sec => (
                      <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                    ))}
                    {(!sectionsByGrade[formData.grade_level] ||
                      sectionsByGrade[formData.grade_level].length === 0) && (
                      <SelectItem value="__none" disabled>No sections for this grade</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacher_id">Assign Teacher</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={value => setFormData({ ...formData, teacher_id: value })}
                >
                  <SelectTrigger id="teacher_id"><SelectValue placeholder="No teacher assigned" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Select
                  value={formData.room}
                  onValueChange={value => setFormData({ ...formData, room: value })}
                >
                  <SelectTrigger id="room"><SelectValue placeholder="Select a room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.name} disabled={conflictedRooms.has(r.name)}>
                        <div className="flex items-center justify-between gap-6 w-full">
                          <span>{r.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {conflictedRooms.has(r.name)
                              ? '⚠ Occupied'
                              : r.capacity ? `${r.capacity} seats` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Schedule</Label>
              <div className="flex gap-1 flex-wrap">
                {DAY_OPTIONS.map(day => {
                  const isSelected = scheduleSlots.some(s => s.day === day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setScheduleSlots(prev => prev.filter(s => s.day !== day));
                        } else {
                          const ordered = DAY_OPTIONS.filter(d => d === day || scheduleSlots.some(s => s.day === d));
                          setScheduleSlots(prev => {
                            const next = [...prev, { day, start: '08:00', end: '09:00' }];
                            return ordered.map(d => next.find(s => s.day === d)!).filter(Boolean);
                          });
                        }
                      }}
                      className={`px-2.5 py-1 text-sm rounded border font-medium active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {scheduleSlots.length > 0 && (
                <div className="space-y-2">
                  {scheduleSlots.map(slot => (
                    <div key={slot.day} className="flex items-center gap-2">
                      <span className="w-8 text-xs font-semibold text-gray-500 text-center">{slot.day}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">{DAY_LABELS[slot.day]}</span>
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={e => setScheduleSlots(prev => prev.map(s => s.day === slot.day ? { ...s, start: e.target.value } : s))}
                        className="h-8 w-28 text-sm"
                      />
                      <span className="text-xs text-gray-400">→</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={e => setScheduleSlots(prev => prev.map(s => s.day === slot.day ? { ...s, end: e.target.value } : s))}
                        className="h-8 w-28 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Subject description or notes"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Enroll Students
                {formData.grade_level && (
                  <span className="text-xs font-normal text-gray-500">
                    — showing {formData.grade_level}
                    {formData.section ? ` · ${formData.section} + unassigned` : ' students'}
                  </span>
                )}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search students by name or number..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                {!formData.grade_level ? (
                  <p className="text-sm text-amber-600">Select a grade level first to see matching students.</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No students found for {formData.grade_level}
                    {studentSearch.trim() ? ` matching "${studentSearch}"` : ''}.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* Select all row */}
                    <label className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer border-b border-gray-100 mb-1 sticky top-0 z-10">
                      <input
                        type="checkbox"
                        checked={filteredStudents.every(s => selectedStudentIds.includes(s.id))}
                        onChange={() => {
                          const allSelected = filteredStudents.every(s => selectedStudentIds.includes(s.id));
                          if (allSelected) {
                            setSelectedStudentIds(prev => prev.filter(id => !filteredStudents.some(s => s.id === id)));
                          } else {
                            setSelectedStudentIds(prev => [...new Set([...prev, ...filteredStudents.map(s => s.id)])]);
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Select all ({filteredStudents.length})
                      </span>
                    </label>
                    {filteredStudents.map(student => (
                      <label
                        key={student.id}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {student.first_name} {student.last_name} ({student.student_number || 'No ID'})
                          {student.section && (
                            <span className="text-gray-500 ml-2">— {student.section}</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">{selectedStudentIds.length} student(s) selected</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-white">
              {editingClass ? 'Update Subject' : 'Create Subject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Students in: {viewingClass?.class_name}</DialogTitle>
            <DialogDescription>
              {viewingClass?.grade_level}{viewingClass?.section ? ` — ${viewingClass.section}` : ''} · {classStudents.length} student{classStudents.length !== 1 ? 's' : ''} enrolled
            </DialogDescription>
          </DialogHeader>
          {loadingStudents ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-900 border-t-transparent" />
            </div>
          ) : classStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No students enrolled in this subject.</div>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 overflow-hidden flex-1 min-h-0 overflow-y-auto">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[660px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-10">#</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student No.</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Grade</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Section</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classStudents.map((student, index) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{index + 1}</td>
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
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <ExportDropdown onPDF={handleExportPDF} onExcel={handleExportExcel} size="sm" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
