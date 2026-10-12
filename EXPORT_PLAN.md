# Export Overhaul Plan
## Goal
Every page that exports data must have a single **Export** button that drops down to **PDF** and **Excel (.xlsx)** options. No standalone CSV or separate PDF/Excel buttons.

## Uniform Pattern
```tsx
<ExportDropdown onPDF={handleExportPDF} onExcel={handleExportExcel} disabled={noData} />
```
- Component: `components/ui/export-dropdown.tsx`
- Excel utility: `lib/export-excel.ts` → `downloadExcel(filename, ExcelSheet | ExcelSheet[])`
- PDF: `jspdf` + `jspdf-autotable` (school header → colored table header → data rows → total row)

---

## File Inventory

| # | File | Before | After | Status |
|---|------|---------|-------|--------|
| 1 | `app/student/enrollment/page.tsx` | "History CSV" + "History PDF" buttons | ExportDropdown (keep "Download COE" as-is) | DONE |
| 2 | `app/student/grades/page.tsx` | "CSV" + "PDF" buttons | ExportDropdown | DONE |
| 3 | `app/admin/grades/page.tsx` | "CSV" + "PDF" buttons | ExportDropdown | DONE |
| 4 | `app/admin/classes/page.tsx` | "Export CSV" in dialog footer | ExportDropdown in dialog footer + add PDF | DONE |
| 5 | `app/admin/reports/population/page.tsx` | "CSV" + "PDF" buttons in toolbar | ExportDropdown | DONE |
| 6 | `app/admin/reports/page.tsx` | "Excel" + "PDF" buttons | ExportDropdown | DONE |
| 7 | `app/teacher/attendance/page.tsx` | "Export CSV" button in header | ExportDropdown in header + add PDF | DONE |
| 8 | `app/teacher/grades/page.tsx` | "Export to CSV" in action buttons | ExportDropdown + add PDF | DONE |
| 9 | `app/teacher/classes/page.tsx` | "Export CSV" in dialog footer | ExportDropdown in dialog footer + add PDF | DONE |
| 10 | `app/teacher/reports/page.tsx` | "CSV" + "PDF" buttons | ExportDropdown | DONE |
| 11 | `components/admin/attendance/StudentAttendanceTab.tsx` | Custom "Export" button (CSV) | ExportDropdown + add PDF | DONE |
| 12 | `components/admin/attendance/TeacherAttendanceTab.tsx` | Custom "Export CSV" button | ExportDropdown + add PDF | DONE |
| 13 | `app/admin/teacher-attendance/page.tsx` | "Export CSV" in header | ExportDropdown + add PDF | DONE |
| 14 | `app/admin/attendance-reports/page.tsx` | "Export CSV" button | ExportDropdown + add PDF | DONE |

---

## Excel Format (uniform across all)
- School header: STO. NIÑO DE PRAGA ACADEMY OF LA PAZ HOMES II, INC. (bold, centered)
- Report title line (bold, smaller)
- Metadata lines (date, generated, etc.) in muted gray
- Column headers: filled (BLUE `FF1E3A8A` for most; RED `FF991B1B` for grades/COE)
- Data rows: Calibri 10pt, light bottom border
- Total/footer row (if applicable): GRAY `FFE5E7EB` fill, DARK `FF111827` bold text

## PDF Format (uniform across all)
- School name + "OF LA PAZ HOMES II, INC." centered header
- Report title centered below
- Metadata (period, generated date) in smaller font
- autoTable with `headStyles: { fillColor: [153, 27, 27] }` (red) for top-level tables
- Grade tables use `fillColor: [30, 58, 138]` (blue)
- Total row via `foot` with `footStyles: { fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [17, 24, 39] }`

---

## Implementation Order
1. [x] `components/ui/dropdown-menu.tsx` — created (Radix wrapper)
2. [x] `components/ui/export-dropdown.tsx` — created (reusable ExportDropdown)
3. [x] `lib/export-excel.ts` — created (shared Excel utility)
4. [x] 14 page files — all done (see table above)
