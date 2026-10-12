'use client';

import { Button } from '@/components/ui/button';
import { SortHeader } from '@/components/ui/data-table/SortHeader';
import { ExportDropdown } from '@/components/ui/export-dropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTableControls } from '@/hooks/use-table-controls';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, RefreshCcw, Users } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';


interface GradeRow {
  grade_level: string;
  total: number;
}

interface PopulationData {
  byGrade: GradeRow[];
  grandTotal: number;
  schoolYears: string[];
}

export default function PopulationReportPage() {
  const [data, setData] = useState<PopulationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedYear !== 'all') params.set('school_year', selectedYear);
      if (selectedGrade !== 'all') params.set('grade_level', selectedGrade);
      const res = await fetch(`/api/admin/reports/population?${params}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedGrade]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STO. NIÑO DE PRAGA ACADEMY', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OF LA PAZ HOMES II, INC.', 105, 21, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT ENROLLMENT REPORT', 105, 32, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const yearLabel = selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All School Years';
    const gradeLabel = selectedGrade !== 'all' ? selectedGrade : 'All Grade Levels';
    doc.text(`${yearLabel}  |  ${gradeLabel}`, 105, 39, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, 44, { align: 'center' });

    const tableBody = data.byGrade.map((row) => [row.grade_level, row.total]);
    tableBody.push(['Total', data.grandTotal] as any);

    autoTable(doc, {
      startY: 50,
      head: [['Grade Level', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 140 },
        1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (hookData: any) => {
        if (hookData.row.index === data.byGrade.length) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: 15, right: 15 },
    });

    const suffix = selectedYear !== 'all' ? `_${selectedYear.replace(/[^a-z0-9]/gi, '-')}` : '';
    doc.save(`Enrollment_Report${suffix}.pdf`);
  };

  const handleDownloadExcel = async () => {
    if (!data) return;
    const { downloadExcel } = await import('@/lib/export-excel');
    const yearLabel = selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All School Years';
    const gradeLabel = selectedGrade !== 'all' ? selectedGrade : 'All Grade Levels';
    const generated = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const suffix = selectedYear !== 'all' ? `_${selectedYear.replace(/[^a-z0-9]/gi, '-')}` : '';
    await downloadExcel(`Enrollment_Report${suffix}`, {
      title: [
        'STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.',
        'STUDENT ENROLLMENT REPORT',
        `${yearLabel}  |  ${gradeLabel}`,
        `Generated: ${generated}`,
      ],
      columns: ['Grade Level', 'Total'],
      colWidths: [40, 18],
      rows: data.byGrade.map((r) => [r.grade_level, r.total]),
      totalRow: ['Total', data.grandTotal],
      headerColor: 'red',
    });
  };

  const gradeOptions = data?.byGrade.map((r) => r.grade_level) || [];

  const tc = useTableControls(data?.byGrade ?? [], {
    searchFields: ['grade_level'],
    defaultSort: { key: 'grade_level', dir: 'asc' },
    pageSize: 100,
  });


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrollment Report
            </h1>
            <p className="text-sm text-gray-500">Student enrollment counts by grade level</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Academic Year:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {(data?.schoolYears || []).map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Grade Level:</span>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-36 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {gradeOptions.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCcw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            <ExportDropdown
              onPDF={handleDownloadPDF}
              onExcel={handleDownloadExcel}
              disabled={!data || data.byGrade.length === 0}
              size="sm"
            />
          </div>
        </div>

        {/* Summary cards */}
        {data && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total Students', value: data.grandTotal },
              { label: 'Grade Levels',   value: data.byGrade.length },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Enrollment by Grade Level</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {selectedYear !== 'all' ? `A.Y. ${selectedYear}` : 'All school years'} ·{' '}
              {selectedGrade !== 'all' ? selectedGrade : 'All grade levels'}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
            </div>
          ) : !data || data.byGrade.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No enrollment data found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <SortHeader label="Grade Level" sortKey="grade_level" currentSort={tc.sort} onSort={tc.toggleSort} className="pl-4" />
                  <SortHeader label="Total"       sortKey="total"       currentSort={tc.sort} onSort={tc.toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tc.rows.map((row) => (
                  <tr key={row.grade_level} className="hover:bg-gray-50">
                    <td className="px-4 py-3 pl-4 text-sm font-medium text-gray-900">{row.grade_level}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.total}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 pl-4 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">{data.grandTotal}</td>
                </tr>
              </tbody>
            </table>
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-gray-100">
            <span className="text-[11px] text-gray-400">
              {tc.rows.length} grade level{tc.rows.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
