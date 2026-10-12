"use client"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ExportDropdown } from "@/components/ui/export-dropdown"
import { BarChart3, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { genderBars } from "@/components/admin/gender-bars"
import { useAuth } from "../hooks/useAuth"


type DateRange = { from?: Date; to?: Date } | undefined

// Normalize inconsistent grade_level values stored in DB
function normalizeGrade(raw: string): string {
  const t = raw.trim().toLowerCase()
  if (t === "kindergarten" || t === "kinder") return "Kinder"
  const m = t.match(/^grade\s*(\d+)$/)
  if (m) return `Grade ${m[1]}`
  return raw.trim()
}

// "Grade 7 — Rizal" → "G7 — Rizal", so the vertical bar chart's Y axis fits in
// 92px on a phone. Display only — exports still use the full name.
function shortenSectionLabel(name: string): string {
  return String(name).replace(/^Grade\s+/, "G").replace(/^Kinder\b/, "K")
}


export default function ReportsPage() {
  const { admin, loading } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>(undefined)
  const [selectedGrade, setSelectedGrade] = useState("all")

  const fetchStats = useCallback(async (range?: DateRange) => {
    setDataLoading(true)
    try {
      const params = new URLSearchParams()
      if (range?.from) params.set("startDate", format(range.from, "yyyy-MM-dd"))
      if (range?.to) params.set("endDate", format(range.to, "yyyy-MM-dd"))
      const res = await fetch(`/api/admin/stats?${params}`)
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleRangeChange = (range: DateRange) => {
    setDateRange(range)
    // Fetch only when both ends are selected, or when cleared
    if (!range || (range.from && range.to)) fetchStats(range)
  }

  const handleClear = () => {
    setDateRange(undefined)
    setSelectedGrade("all")
    fetchStats(undefined)
  }

  const isFiltered = !!(dateRange?.from && dateRange?.to) || selectedGrade !== "all"

  /* ── Derived data ───────────────────────────────────────── */
  const allGradeData = useMemo(() => {
    if (!stats?.gradeDistribution) return []
    // Normalize & merge counts for inconsistently-cased grade names in DB
    const merged: Record<string, { count: number; male: number; female: number; unspecified: number }> = {}
    for (const [raw, count] of Object.entries(stats.gradeDistribution)) {
      const key = normalizeGrade(raw)
      const g = stats.gradeGender?.[raw] ?? { male: 0, female: 0, unspecified: count as number }
      const m = (merged[key] ??= { count: 0, male: 0, female: 0, unspecified: 0 })
      m.count += count as number
      m.male += g.male
      m.female += g.female
      m.unspecified += g.unspecified
    }
    return Object.entries(merged)
      .map(([name, m]) => ({ name, ...m }))
      .sort((a, b) => {
        if (a.name === "Kinder") return -1
        if (b.name === "Kinder") return 1
        const n = (s: string) => parseInt(s.replace(/\D/g, "")) || 0
        return n(a.name) - n(b.name)
      })
  }, [stats])

  const gradeOptions = useMemo(() => allGradeData.map((d) => d.name), [allGradeData])

  const gradeData = useMemo(
    () => selectedGrade === "all" ? allGradeData : allGradeData.filter((d) => d.name === selectedGrade),
    [allGradeData, selectedGrade]
  )

  const sectionData = useMemo(() => {
    const out: { name: string; count: number; male: number; female: number; unspecified: number }[] = []
    if (!stats?.sectionDistribution) return out
    for (const [raw, sections] of Object.entries(stats.sectionDistribution)) {
      const grade = normalizeGrade(raw)
      if (selectedGrade !== "all" && grade !== selectedGrade) continue
      for (const [section, count] of Object.entries(sections as Record<string, number>)) {
        const g = stats.sectionGender?.[raw]?.[section] ?? { male: 0, female: 0, unspecified: count }
        out.push({ name: `${grade} — ${section}`, count, ...g })
      }
    }
    return out.sort((a, b) => a.name.localeCompare(b.name))
  }, [stats, selectedGrade])

  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`
      : "All Time"

  const gradeLabel = selectedGrade === "all" ? "All Grade Levels" : selectedGrade

  const summaryCards = [
    { label: "Total Students", value: stats?.totalStudents ?? 0 },
    { label: "Male Students", value: stats?.genderBreakdown?.male ?? 0 },
    { label: "Female Students", value: stats?.genderBreakdown?.female ?? 0 },
    { label: "Total Teachers", value: stats?.totalTeachers ?? 0 },
  ]

  const gradeTotalCount   = gradeData.reduce((s, r) => s + r.count, 0)
  const sectionTotalCount = sectionData.reduce((s, r) => s + r.count, 0)
  const generated = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })

  /* ── PDF Export ─────────────────────────────────────────── */
  const handleExportPDF = () => {
    if (!stats) return
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    // School header
    doc.setFontSize(14); doc.setFont("helvetica", "bold")
    doc.text("STO. NIÑO DE PRAGA ACADEMY", 105, 15, { align: "center" })
    doc.setFontSize(10); doc.setFont("helvetica", "normal")
    doc.text("OF LA PAZ HOMES II, INC.", 105, 21, { align: "center" })
    doc.setFontSize(13); doc.setFont("helvetica", "bold")
    doc.text("REPORTS & ANALYTICS OVERVIEW", 105, 31, { align: "center" })
    doc.setFontSize(9); doc.setFont("helvetica", "normal")
    doc.text(`Period: ${dateLabel}  |  ${gradeLabel}`, 105, 38, { align: "center" })
    doc.text(`Generated: ${generated}`, 105, 43, { align: "center" })

    // Summary
    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: summaryCards.map((s) => [s.label, String(s.value)]),
      theme: "grid",
      headStyles: { fillColor: [153, 27, 27], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 40, halign: "center", fontStyle: "bold" } },
      margin: { left: 15, right: 15 },
    })

    // Grade distribution
    const afterSummary = ((doc as any).lastAutoTable?.finalY ?? 80) + 8
    doc.setFontSize(11); doc.setFont("helvetica", "bold")
    doc.text("Population by Grade Level", 15, afterSummary)
    autoTable(doc, {
      startY: afterSummary + 4,
      head: [["Grade Level", "Students"]],
      body: gradeData.map((r) => [r.name, r.count]),
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 40, halign: "center" } },
      margin: { left: 15, right: 15 },
      foot: [["Total", gradeTotalCount]],
      footStyles: { fontStyle: "bold", fillColor: [229, 231, 235], textColor: [17, 24, 39] },
    })

    // Section distribution
    if (sectionData.length > 0) {
      const afterGrade = ((doc as any).lastAutoTable?.finalY ?? 150) + 8
      const newPage = afterGrade > 240
      if (newPage) doc.addPage()
      const sY = newPage ? 15 : afterGrade

      doc.setFontSize(11); doc.setFont("helvetica", "bold")
      doc.text("Population by Section", 15, sY)
      autoTable(doc, {
        startY: sY + 4,
        head: [["Section", "Students"]],
        body: sectionData.map((r) => [r.name, r.count]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 40, halign: "center" } },
        margin: { left: 15, right: 15 },
        foot: [["Total", sectionTotalCount]],
        footStyles: { fontStyle: "bold", fillColor: [229, 231, 235], textColor: [17, 24, 39] },
      })
    }

    const suffix = selectedGrade !== "all" ? `_${selectedGrade.replace(/\s+/g, "")}` : ""
    doc.save(`Reports_Overview${suffix}.pdf`)
  }

  /* ── Excel Export ───────────────────────────────────────── */
  const handleExportExcel = async () => {
    if (!stats) return
    const ExcelJS = (await import("exceljs")).default
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Reports Overview")

    ws.getColumn(1).width = 46
    ws.getColumn(2).width = 14

    const RED  = "FF991B1B"
    const BLUE = "FF1E3A8A"
    const GRAY = "FFE5E7EB"
    const WHITE = "FFFFFFFF"
    const DARK  = "FF111827"
    const MUTED = "FF6B7280"

    const mergedRow = (
      text: string,
      rowNum: number,
      { bold = false, size = 10, color = DARK, fill = WHITE, height = 18 } = {}
    ) => {
      ws.mergeCells(`A${rowNum}:B${rowNum}`)
      const cell = ws.getCell(`A${rowNum}`)
      cell.value = text
      cell.font = { name: "Calibri", bold, size, color: { argb: color } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } }
      ws.getRow(rowNum).height = height
    }

    const tableHeader = (labels: string[], rowNum: number, fill: string) => {
      const row = ws.getRow(rowNum)
      row.height = 20
      ;[1, 2].forEach((col, i) => {
        const cell = row.getCell(col)
        cell.value = labels[i]
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } }
        cell.font = { bold: true, color: { argb: WHITE }, name: "Calibri", size: 10 }
        cell.alignment = { horizontal: i === 1 ? "center" : "left", vertical: "middle" }
      })
    }

    const dataRow = (cols: (string | number)[], rowNum: number, bold = false, fillArgb?: string) => {
      const row = ws.getRow(rowNum)
      row.height = 17
      ;[1, 2].forEach((col, i) => {
        const cell = row.getCell(col)
        cell.value = cols[i]
        cell.font = { bold, name: "Calibri", size: 10, color: { argb: DARK } }
        cell.alignment = { horizontal: i === 1 ? "center" : "left", vertical: "middle" }
        if (fillArgb) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillArgb } }
        cell.border = { bottom: { style: "thin", color: { argb: "FFF3F4F6" } } }
      })
    }

    let r = 1
    // School header block
    mergedRow("STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC.", r++, { bold: true, size: 13, height: 24 })
    mergedRow("REPORTS & ANALYTICS OVERVIEW", r++, { bold: true, size: 12, height: 20 })
    mergedRow(`Period: ${dateLabel}  |  ${gradeLabel}`, r++, { color: MUTED, height: 16 })
    mergedRow(`Generated: ${generated}`, r++, { color: MUTED, height: 16 })
    ws.getRow(r++).height = 6 // spacer

    // Summary
    mergedRow("SUMMARY", r++, { bold: true, size: 11 })
    tableHeader(["Metric", "Value"], r++, RED)
    summaryCards.forEach((s) => dataRow([s.label, String(s.value)], r++))
    ws.getRow(r++).height = 6 // spacer

    // Grade level
    mergedRow("POPULATION BY GRADE LEVEL", r++, { bold: true, size: 11 })
    tableHeader(["Grade Level", "Students"], r++, BLUE)
    gradeData.forEach((row) => dataRow([row.name, row.count], r++))
    dataRow(["Total", gradeTotalCount], r++, true, GRAY)
    ws.getRow(r++).height = 6 // spacer

    // Section
    if (sectionData.length > 0) {
      mergedRow("POPULATION BY SECTION", r++, { bold: true, size: 11 })
      tableHeader(["Section", "Students"], r++, BLUE)
      sectionData.forEach((row) => dataRow([row.name, row.count], r++))
      dataRow(["Total", sectionTotalCount], r++, true, GRAY)
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const suffix = selectedGrade !== "all" ? `_${selectedGrade.replace(/\s+/g, "")}` : ""
    a.download = `Reports_Overview${suffix}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Student population and attendance overview
          </p>
        </div>

        <ExportDropdown
          onPDF={handleExportPDF}
          onExcel={handleExportExcel}
          disabled={!stats || dataLoading}
          size="sm"
        />
      </div>

      {/* ── Filter toolbar ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">Date Range</span>
          <DateRangePicker
            value={dateRange}
            onChange={handleRangeChange}
            placeholder="All time"
          />
        </div>

        <div className="h-4 border-r border-gray-200 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 whitespace-nowrap">Grade</span>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="h-9 text-sm w-36">
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

        {isFiltered && (
          <button
            onClick={handleClear}
            className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-[color,background-color,transform] duration-150 ease-out"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dataLoading ? <span className="text-gray-300">—</span> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts ─────────────────────────────────────────── */}
      {dataLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Grade Level chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Population by Grade Level</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {gradeLabel}{dateRange?.from && dateRange?.to ? ` · ${dateLabel}` : ""}
                </p>
              </div>
              {gradeData.length > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {gradeTotalCount.toLocaleString()} students
                </span>
              )}
            </div>
            <div className="p-5">
              {gradeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gradeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                      formatter={(v: number, name: string) => [`${v} students`, name]}
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    {genderBars("horizontal")}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="w-10 h-10 mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No student data for this selection</p>
                </div>
              )}
            </div>
          </div>

          {/* Section chart */}
          {sectionData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Population by Section</p>
                  <p className="text-xs text-gray-400 mt-0.5">{gradeLabel}</p>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {sectionTotalCount.toLocaleString()} students
                </span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={Math.max(280, sectionData.length * 36)}>
                  {/* recharts adds margin.left AND the YAxis width to the left
                      offset — 120 + 120 left barely any room for bars on a phone.
                      Keep margin.left at 0 and abbreviate the tick instead. */}
                  <BarChart data={sectionData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} width={92} axisLine={false} tickLine={false} tickFormatter={shortenSectionLabel} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                      formatter={(v: number, name: string) => [`${v} students`, name]}
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    {genderBars("vertical")}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
