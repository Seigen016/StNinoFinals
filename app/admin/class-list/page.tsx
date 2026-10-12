'use client';

import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  GraduationCap,
  Layers,
  Search,
  Users,
} from 'lucide-react';
import { useRefresh } from '@/lib/refresh-context';
import { useEffect, useMemo, useState } from 'react';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  student_number: string;
  email: string | null;
}

interface SectionData {
  section: string;
  students: Student[];
}

interface GradeData {
  grade: string;
  sections: SectionData[];
}


function SkeletonBlock() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-5">
            <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
            <div className="h-7 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-white overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-200" />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-100" />
            </div>
          </div>
          <div className="px-5 pb-5">
            <table className="w-full">
              <tbody>
                {[1, 2, 3, 4].map((j) => (
                  <tr key={j} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-6 rounded bg-gray-200" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-14 rounded bg-gray-100" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-36 rounded bg-gray-100" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClassListPage() {
  const [data, setData] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useRefresh();
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [collapsedGrades, setCollapsedGrades] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin/class-list');
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error('Failed to fetch class list', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const toggleGrade = (grade: string) => {
    setCollapsedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedGrade !== 'all') {
      result = result.filter((g) => g.grade === selectedGrade);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result
        .map((gradeGroup) => ({
          ...gradeGroup,
          sections: gradeGroup.sections
            .map((section) => ({
              ...section,
              students: section.students.filter(
                (s) =>
                  s.first_name.toLowerCase().includes(q) ||
                  s.last_name.toLowerCase().includes(q) ||
                  (s.middle_name && s.middle_name.toLowerCase().includes(q)) ||
                  s.student_number?.toLowerCase().includes(q) ||
                  (s.email && s.email.toLowerCase().includes(q)) ||
                  `${s.last_name}, ${s.first_name}`.toLowerCase().includes(q)
              ),
            }))
            .filter((section) => section.students.length > 0),
        }))
        .filter((gradeGroup) => gradeGroup.sections.length > 0);
    }
    return result;
  }, [data, selectedGrade, search]);

  const stats = useMemo(() => {
    const totalStudents = filteredData.reduce((acc, g) => acc + g.sections.reduce((a, s) => a + s.students.length, 0), 0);
    const totalSections = filteredData.reduce((acc, g) => acc + g.sections.length, 0);
    const totalGrades   = filteredData.length;
    return { totalStudents, totalSections, totalGrades };
  }, [filteredData]);

  const filteredStudentCount = useMemo(
    () => filteredData.reduce((acc, g) => acc + g.sections.reduce((a, s) => a + s.students.length, 0), 0),
    [filteredData]
  );

  return (
    <div className="p-4 md:p-6 space-y-6 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class List</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            View all students organized by grade level and section.
          </p>
        </div>
      </div>

      {loading ? (
        <SkeletonBlock />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Students', value: stats.totalStudents, icon: Users,         color: 'bg-red-50 text-red-700'   },
              { label: 'Grade Levels',   value: stats.totalGrades,   icon: GraduationCap, color: 'bg-blue-50 text-blue-700'  },
              { label: 'Total Sections', value: stats.totalSections, icon: Layers,        color: 'bg-green-50 text-green-700' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
              placeholder="Search by name, student number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grade Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-[color,background-color,transform] duration-150 ease-out ${
                selectedGrade === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Grades
            </button>
            {data.map((g) => (
              <button
                key={g.grade}
                onClick={() => setSelectedGrade(g.grade)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium active:scale-95 transition-[color,background-color,transform] duration-150 ease-out ${
                  selectedGrade === g.grade
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g.grade}
              </button>
            ))}
          </div>

          {search.trim() && (
            <p className="text-sm text-gray-500">
              Found{' '}
              <span className="font-semibold text-gray-700">{filteredStudentCount}</span>{' '}
              student{filteredStudentCount !== 1 ? 's' : ''} matching &quot;{search}&quot;
            </p>
          )}

          {/* Class List */}
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">No results found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {search.trim()
                  ? "Try adjusting your search or filter to find what you're looking for."
                  : 'No active classes or students found.'}
              </p>
              {search.trim() && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(''); setSelectedGrade('all'); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((gradeGroup) => {
                const isCollapsed = collapsedGrades.has(gradeGroup.grade);
                const gradeStudentCount = gradeGroup.sections.reduce((a, s) => a + s.students.length, 0);

                return (
                  <div key={gradeGroup.grade} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Grade Header */}
                    <button
                      onClick={() => toggleGrade(gradeGroup.grade)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 active:scale-95 transition-[background-color,transform] duration-150 ease-out"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gray-900 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-base font-semibold text-gray-900">{gradeGroup.grade}</h3>
                          <p className="text-xs text-gray-500">
                            {gradeGroup.sections.length} section{gradeGroup.sections.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {gradeStudentCount} student{gradeStudentCount !== 1 ? 's' : ''}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Sections */}
                    <div className={`transition-[max-height] duration-200 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[10000px]'}`}>
                      <div className="px-5 pb-5 space-y-5">
                        {gradeGroup.sections.map((sectionGroup) => (
                          <div key={`${gradeGroup.grade}-${sectionGroup.section}`} className="rounded-lg border border-gray-200 overflow-hidden">
                            {/* Section Header */}
                            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                  Section {sectionGroup.section}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                {sectionGroup.students.length} student{sectionGroup.students.length !== 1 ? 's' : ''}
                              </span>
                            </div>

                            {/* Student Table */}
                            {sectionGroup.students.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-50">
                                      <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-12">#</th>
                                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student Name</th>
                                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Student No.</th>
                                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {sectionGroup.students.map((student, idx) => (
                                      <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-xs text-gray-400 tabular-nums">{idx + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                          {student.last_name}, {student.first_name}
                                          {student.middle_name ? ` ${student.middle_name.charAt(0)}.` : ''}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="font-mono text-[12px] text-gray-500">
                                            {student.student_number || <span className="text-gray-300">—</span>}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                          {student.email || <span className="text-gray-300">—</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-8 text-center text-sm text-gray-400">
                                No students enrolled in this section
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
