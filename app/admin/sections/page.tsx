'use client';

import { SchoolYearTabs } from '@/components/admin/school-year-tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRefresh } from '@/lib/refresh-context';
import { useAlert } from '@/lib/use-alert';
import { Archive, ArchiveRestore, Loader2, Plus, Save, Trash2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const GRADE_LEVELS = [
  'Kinder',
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
];

// ─── Section template management (system_settings JSON blob) ─────────────────

function TemplateSectionsPanel() {
  const [sectionsByGrade, setSectionsByGrade] = useState<
    Record<string, string[]>
  >({});
  const [selectedGrade, setSelectedGrade] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { showAlert } = useAlert();
  const { refreshKey } = useRefresh();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings/sections');
        const data = await res.json();
        if (data.success && data.sections) setSectionsByGrade(data.sections);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const handleAdd = () => {
    if (!selectedGrade || !newSectionName.trim()) return;
    const name = newSectionName.trim();
    const existing = sectionsByGrade[selectedGrade] || [];
    if (existing.map((s) => s.toLowerCase()).includes(name.toLowerCase())) {
      setAddError(`"${name}" already exists in ${selectedGrade}.`);
      return;
    }
    setAddError(null);
    setSectionsByGrade((prev) => ({
      ...prev,
      [selectedGrade]: [...(prev[selectedGrade] || []), name].sort(),
    }));
    setNewSectionName('');
  };

  const handleRemove = async (grade: string, section: string) => {
    try {
      const res = await fetch(
        `/api/admin/students?gradeLevel=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`
      );
      const data = await res.json();
      const enrolled = (data.students || []).filter(
        (s: { is_archived?: boolean }) => !s.is_archived
      ).length;
      if (enrolled > 0) {
        showAlert({
          message: `Cannot remove "${section}" — ${enrolled} student${enrolled !== 1 ? 's are' : ' is'} enrolled in this section.`,
          type: 'error',
        });
        return;
      }
    } catch {
      // allow removal if check fails
    }
    setSectionsByGrade((prev) => {
      const updated = (prev[grade] || []).filter((s) => s !== section);
      if (updated.length === 0) {
        const { [grade]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [grade]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: sectionsByGrade }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({
          message: 'Templates saved successfully!',
          type: 'success',
        });
      } else {
        showAlert({ message: 'Failed to save.', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const total = Object.values(sectionsByGrade).reduce(
    (n, a) => n + a.length,
    0
  );
  const gradeCount = Object.keys(sectionsByGrade).filter(
    (g) => sectionsByGrade[g].length > 0
  ).length;

  if (loading)
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          Section Name Templates
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Define which section names exist per grade. These are used as
          templates when creating formal sections for a school year.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={selectedGrade}
            onValueChange={(v) => {
              setSelectedGrade(v);
              setAddError(null);
            }}
          >
            <SelectTrigger className="w-full sm:w-48 h-8 text-sm">
              <SelectValue placeholder="Grade level" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 space-y-1">
            <input
              className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                addError
                  ? 'border-red-400 focus:ring-red-400/20 text-red-900 placeholder:text-red-300'
                  : 'border-gray-200 focus:ring-gray-900/10'
              }`}
              placeholder="Section name (e.g. St. Mary, Section A)"
              value={newSectionName}
              onChange={(e) => {
                setNewSectionName(e.target.value);
                setAddError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            {addError && <p className="text-xs text-red-500">{addError}</p>}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!selectedGrade || !newSectionName.trim()}
            className="bg-primary hover:bg-primary/90 text-white shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="shrink-0"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[440px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-44">
                Grade
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Sections
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-16 pr-5">
                Count
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {GRADE_LEVELS.map((grade) => {
              const sections = sectionsByGrade[grade] || [];
              return (
                <tr key={grade} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 align-top whitespace-nowrap">
                    {grade}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {sections.length === 0 ? (
                      <span className="text-gray-300 text-sm">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sections.map((section) => (
                          <span
                            key={section}
                            className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 pl-2.5 pr-1.5 py-1 rounded-full"
                          >
                            {section}
                            <button
                              onClick={() => handleRemove(grade, section)}
                              className="rounded-full p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-300 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 pr-5 text-right align-top">
                    {sections.length > 0 ? (
                      <span className="text-xs font-medium text-gray-500 tabular-nums">
                        {sections.length}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        <div className="px-5 py-2.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {total} section{total !== 1 ? 's' : ''} across {gradeCount} grade
            level{gradeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Enroll Modal ───────────────────────────────────────────────────────

interface EligibleStudent {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string | null;
}

function BatchEnrollModal({
  section,
  open,
  onClose,
  onEnrolled,
}: {
  section: SectionRow | null;
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const { showAlert } = useAlert();
  const [students, setStudents] = useState<EligibleStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open || !section) return;
    setSelected(new Set());
    setSearch('');
    setLoading(true);
    fetch(`/api/admin/sections/eligible-students?sectionId=${section.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStudents(d.students ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, section]);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const allSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.studentId));
  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.delete(s.studentId));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((s) => next.add(s.studentId));
        return next;
      });
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnroll = async () => {
    if (!section || selected.size === 0) return;
    setEnrolling(true);
    try {
      const res = await fetch('/api/admin/sections/batch-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: section.id,
          studentIds: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert({ message: data.message, type: 'success' });
        onEnrolled();
        onClose();
      } else {
        showAlert({
          message: data.error ?? 'Failed to enroll students.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error.', type: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-gray-700" />
            Batch Enroll Students
          </DialogTitle>
        </DialogHeader>

        {section && (
          <p className="text-sm text-gray-500 -mt-2">
            Assigning to{' '}
            <span className="font-semibold text-gray-800">{section.name}</span>
            {' · '}{section.grade_level}{' · '}{section.school_year}
            {' · '}
            <span className={
              section.student_count >= section.max_capacity
                ? 'text-red-500 font-medium'
                : 'text-gray-500'
            }>
              {section.student_count}/{section.max_capacity} slots
            </span>
          </p>
        )}

        <input
          className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {students.length === 0
                ? 'No eligible students for this section.'
                : 'No students match your search.'}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {/* Select all row */}
              <label className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Select all ({filtered.length})
                </span>
              </label>
              {filtered.map((s) => (
                <label
                  key={s.studentId}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 cursor-pointer hover:bg-gray-50 last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(s.studentId)}
                    onChange={() => toggle(s.studentId)}
                    className="rounded border-gray-300"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      {s.gradeLevel && (
                        <span className="shrink-0 text-[10px] font-medium bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {s.gradeLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={enrolling}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={enrolling || selected.size === 0}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {enrolling ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Enrolling…
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Enroll {selected.size > 0 ? `${selected.size} ` : ''}Student
                {selected.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Formal sections per school year (sections table) ────────────────────────

interface SectionRow {
  id: string;
  name: string;
  grade_level: string;
  school_year: string;
  max_capacity: number;
  student_count: number;
  class_count: number;
}

function FormalSectionsPanel() {
  const [schoolYear, setSchoolYear] = useState('');
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Record<string, string[]>>({});
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [batchSection, setBatchSection] = useState<SectionRow | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);

  // Add section form
  const [addGrade, setAddGrade] = useState('');
  const [addName, setAddName] = useState('');
  const [addCapacity, setAddCapacity] = useState('45');
  const [adding, setAdding] = useState(false);

  const { showAlert } = useAlert();

  useEffect(() => {
    // School year defaults to the active one via SchoolYearTabs
    // Load templates for "Import from template" button
    fetch('/api/admin/settings/sections')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTemplates(d.sections ?? {});
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSections = async (sy: string, archived: boolean) => {
    if (!sy) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/sections?schoolYear=${encodeURIComponent(sy)}${archived ? '&archived=true' : ''}`
      );
      const data = await res.json();
      if (data.success) setSections(data.sections ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolYear) loadSections(schoolYear, showArchived);
  }, [schoolYear, showArchived]);

  const handleArchive = async (id: string, name: string) => {
    setArchiving(id);
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: false }),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
        showAlert({ message: `Archived section "${name}".`, type: 'success' });
      } else {
        showAlert({ message: data.error || 'Failed to archive.', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Network error.', type: 'error' });
    } finally {
      setArchiving(null);
    }
  };

  const handleRestoreSection = async (id: string, name: string) => {
    setArchiving(id);
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: true }),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
        showAlert({ message: `Restored section "${name}".`, type: 'success' });
      } else {
        showAlert({ message: data.error || 'Failed to restore.', type: 'error' });
      }
    } catch {
      showAlert({ message: 'Network error.', type: 'error' });
    } finally {
      setArchiving(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/sections?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => prev.filter((s) => s.id !== id));
        showAlert({ message: `Removed section "${name}".`, type: 'success' });
      } else {
        showAlert({
          message: data.error || 'Failed to delete.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error.', type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async () => {
    if (!addGrade || !addName.trim() || !schoolYear) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName.trim(),
          gradeLevel: addGrade,
          schoolYear,
          maxCapacity: parseInt(addCapacity) || 45,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSections((prev) => [...prev, data.section]);
        setAddName('');
        showAlert({
          message: `Section "${data.section.name}" created.`,
          type: 'success',
        });
      } else {
        showAlert({
          message: data.error || 'Failed to create.',
          type: 'error',
        });
      }
    } catch {
      showAlert({ message: 'Network error.', type: 'error' });
    } finally {
      setAdding(false);
    }
  };

  const handleImportFromTemplate = async () => {
    if (!schoolYear) return;
    const toCreate: { grade: string; name: string }[] = [];
    for (const [grade, names] of Object.entries(templates)) {
      for (const name of names) {
        // Skip if already exists
        if (!sections.some((s) => s.grade_level === grade && s.name === name)) {
          toCreate.push({ grade, name });
        }
      }
    }
    if (toCreate.length === 0) {
      showAlert({
        message: 'All template sections already exist for this school year.',
        type: 'info',
      });
      return;
    }
    setImporting(true);
    let created = 0;
    for (const { grade, name } of toCreate) {
      try {
        const res = await fetch('/api/admin/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            gradeLevel: grade,
            schoolYear,
            maxCapacity: 45,
          }),
        });
        const data = await res.json();
        if (data.success) created++;
      } catch {
        // continue
      }
    }
    setImporting(false);
    showAlert({
      message: `Imported ${created} section${created !== 1 ? 's' : ''} from templates.`,
      type: 'success',
    });
    loadSections(schoolYear, showArchived);
  };

  const grouped = GRADE_LEVELS.reduce<Record<string, SectionRow[]>>(
    (acc, g) => {
      acc[g] = sections.filter((s) => s.grade_level === g);
      return acc;
    },
    {}
  );

  const hasTemplates = Object.values(templates).some((a) => a.length > 0);
  const gradesWithSections = GRADE_LEVELS.filter((g) => grouped[g].length > 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Sections {showArchived && <span className="text-xs font-normal text-amber-600 ml-1">(Archived)</span>}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            These are the actual Sections that students get enrolled into. Each
            section spans all quarters and tracks enrollment capacity.
          </p>
        </div>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border shrink-0 active:scale-[0.97] transition-[background-color,border-color,color,transform] duration-150 ease-out ${showArchived ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          {showArchived ? 'View Active' : 'View Archived'}
        </button>
      </div>

      {/* Controls row */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 space-y-3">
        <SchoolYearTabs value={schoolYear} onChange={setSchoolYear} allowAll={false} />

        {/* Quick add row */}
        {!showArchived && (
        <div className="flex flex-col sm:flex-row gap-2 border-t border-gray-100 pt-3">
          <Select value={addGrade} onValueChange={setAddGrade}>
            <SelectTrigger className="w-full sm:w-40 h-8 text-sm">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_LEVELS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            placeholder="Section name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="number"
            className="w-20 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
            placeholder="Cap."
            value={addCapacity}
            onChange={(e) => setAddCapacity(e.target.value)}
            min={1}
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !addGrade || !addName.trim()}
            className="bg-primary hover:bg-primary/90 text-white shrink-0"
          >
            {adding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5 mr-1" />
            )}
            Add
          </Button>
        </div>
        )}
      </div>

      {/* Sections table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
          </div>
        ) : gradesWithSections.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            {showArchived
              ? `No archived sections for ${schoolYear}.`
              : `No sections for ${schoolYear} yet.`}
            {!showArchived && hasTemplates && (
              <span>
                {' '}
                Use &ldquo;Import from templates&rdquo; to create them
                automatically.
              </span>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[770px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-40">
                  Grade
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Section
                </th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-24">
                  Enrolled
                </th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-24">
                  Capacity
                </th>
                <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20">
                  Classes
                </th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gradesWithSections.flatMap((grade) =>
                grouped[grade].map((sec, i) => (
                  <tr key={sec.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {i === 0 ? grade : ''}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-800">
                      {sec.name}
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm tabular-nums">
                      <span
                        className={
                          sec.student_count >= sec.max_capacity
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-700'
                        }
                      >
                        {sec.student_count}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm text-gray-500 tabular-nums">
                      {sec.max_capacity}
                    </td>
                    <td className="px-4 py-2.5 text-center text-sm text-gray-500 tabular-nums">
                      {sec.class_count}
                    </td>
                    <td className="px-4 py-2.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {showArchived ? (
                          <button
                            onClick={() => handleRestoreSection(sec.id, sec.name)}
                            disabled={archiving === sec.id}
                            title={`Restore ${sec.name}`}
                            className="p-1 rounded text-green-600 hover:text-green-700 hover:bg-green-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out disabled:opacity-30"
                          >
                            {archiving === sec.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setBatchSection(sec)}
                              title={`Batch enroll students into ${sec.name}`}
                              className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleArchive(sec.id, sec.name)}
                              disabled={archiving === sec.id || sec.student_count > 0}
                              title={
                                sec.student_count > 0
                                  ? 'Cannot archive — students are enrolled'
                                  : `Archive ${sec.name}`
                              }
                              className="p-1 rounded text-gray-300 hover:text-amber-600 hover:bg-amber-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {archiving === sec.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => handleDelete(sec.id, sec.name)}
                              disabled={
                                deleting === sec.id || sec.student_count > 0
                              }
                              title={
                                sec.student_count > 0
                                  ? 'Cannot delete — students are enrolled'
                                  : `Delete ${sec.name}`
                              }
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-[color,background-color,transform] duration-150 ease-out disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {deleting === sec.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        )}
        <div className="px-5 py-2.5 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            {sections.length} section{sections.length !== 1 ? 's' : ''} for{' '}
            {schoolYear}
          </span>
        </div>
      </div>

      <BatchEnrollModal
        section={batchSection}
        open={!!batchSection}
        onClose={() => setBatchSection(null)}
        onEnrolled={() => loadSections(schoolYear, showArchived)}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SectionsPage() {
  return (
    <div className="p-4 md:p-6">
      <FormalSectionsPanel />
    </div>
  );
}
