'use client';

import { Pagination } from '@/components/ui/data-table/Pagination';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { useTableControls } from '@/hooks/use-table-controls';
import { Archive, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EnrollmentHistoryEntry {
  id: string;
  school_year: string;
  membership_type: string;
  archived_at: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  } | null;
  class: {
    id: string;
    class_name: string;
    class_code: string;
    grade_level: string | null;
    section: string | null;
  } | null;
}

type FlatEntry = {
  id: string;
  studentName: string;
  studentNumber: string;
  className: string;
  gradeSection: string;
  schoolYear: string;
  archivedAt: string;
};

export default function EnrollmentHistoryPage() {
  const [entries, setEntries] = useState<EnrollmentHistoryEntry[]>([]);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (schoolYear?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (schoolYear) params.set('schoolYear', schoolYear);
      const res = await fetch(`/api/admin/enrollment-history?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setEntries(result.data || []);
        setSchoolYears(result.schoolYears || []);
        if (!schoolYear && result.schoolYears?.length) {
          setSelectedYear(result.schoolYears[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching enrollment history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchHistory(selectedYear);
  }, [selectedYear]);

  const flat: FlatEntry[] = entries.map((e) => {
    const s = Array.isArray(e.student) ? e.student[0] : e.student;
    const c = Array.isArray(e.class) ? e.class[0] : e.class;
    return {
      id: e.id,
      studentName: s ? `${s.first_name} ${s.last_name}` : 'Unknown student',
      studentNumber: s?.student_number || '',
      className: c ? `${c.class_name}${c.class_code ? ` (${c.class_code})` : ''}` : 'Unknown class',
      gradeSection: c ? [c.grade_level, c.section].filter(Boolean).join(' — ') : '',
      schoolYear: e.school_year,
      archivedAt: e.archived_at,
    };
  });

  const tc = useTableControls(flat, {
    searchFields: ['studentName', 'studentNumber', 'className'],
    defaultSort: { key: 'studentName', dir: 'asc' },
    pageSize: 25,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Archive className="w-4 h-4 text-gray-400" />
            Enrollment History
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Past school-year enrollments, archived when the year was closed. {tc.filteredCount} of {tc.totalCount} records.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or class…"
              value={tc.search}
              onChange={(e) => tc.setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer"
          >
            {schoolYears.length === 0 && <option value="">No archived years yet</option>}
            {schoolYears.map((y) => (
              <option key={y} value={y}>S.Y. {y}</option>
            ))}
          </select>
          {tc.search && (
            <button
              onClick={() => tc.setSearch('')}
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
                  <SortHeader label="Student" sortKey="studentName" currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Student No.</th>
                  <SortHeader label="Class" sortKey="className" currentSort={tc.sort} onSort={tc.toggleSort} />
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Grade / Section</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Archived</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tc.rows.length > 0 ? tc.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 pl-4 text-[13px] font-medium text-gray-900 whitespace-nowrap">{row.studentName}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-500 whitespace-nowrap">{row.studentNumber || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-700 whitespace-nowrap">{row.className}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 whitespace-nowrap">{row.gradeSection || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-[13px] text-gray-500 whitespace-nowrap">
                      {new Date(row.archivedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                      No archived enrollments {selectedYear ? `for S.Y. ${selectedYear}` : 'yet'}.
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
