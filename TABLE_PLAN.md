# Table Redesign Plan

Unified plan for migrating all tables to Stripe-style UI + adding filter, sort, search, and pagination.

---

## Design Rules (apply to every table)

- White card: `bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm`
- Header row: `bg-gray-50`, `text-[11px] font-semibold text-gray-400 uppercase tracking-wider`
- Body rows: `divide-y divide-gray-100`, `hover:bg-gray-50 group cursor-pointer`
- Empty cell: `<span className="text-gray-300">—</span>` (never "N/A")
- IDs / codes: `font-mono text-[12px] text-gray-500`
- RFID / codes: `bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-mono text-[11px]`
- Status: `inline-flex items-center gap-1.5` with colored dot + label (no badge box)
- Actions: `opacity-0 group-hover:opacity-100 transition-opacity` — appear only on row hover
- Row click: opens detail sheet/dialog
- **Name column: plain text only — no avatar or initials beside it**
- Footer: record count `"N students"` in `text-[11px] text-gray-400`

---

## Phase 1 — Shared Infrastructure

Build once, imported by every table.

- [x] **`hooks/use-table-controls.ts`** — single hook for search + filter + sort + pagination
  - Input: `data[]` + config (`searchFields`, `defaultSort`, `pageSize`, filters shape)
  - Output: `{ rows, page, setPage, pageCount, totalCount, search, setSearch, sort, setSort, filters, setFilter }`
  - Pipeline: raw data → search → filter → sort → paginate → return slice

- [x] **`components/ui/data-table/Pagination.tsx`** — reusable bottom bar
  - Prev / Next buttons
  - Page number pills (with `…` ellipsis for large page counts)
  - Page-size selector: 10 / 25 / 50

- [x] **`components/ui/data-table/SortHeader.tsx`** — `<th>` wrapper
  - Click cycles: unsorted → asc → desc
  - Icon: `↕` unsorted · `↑` asc · `↓` desc
  - Props: `label`, `sortKey`, `currentSort`, `onSort`

---

## Phase 2 — Already Stripe-Style (add controls only)

These pages already have the new table UI. Just wire up the hook + components.

### `app/admin/students/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: `first_name`, `last_name`, `student_number`, `email`
- [x] Filter: Grade Level · Status
- [x] Sort: Name · Grade · Section · Email · Status
- [x] Pagination (default 25/page)

### `app/admin/teachers/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: `first_name`, `last_name`, `employee_number`, `email`
- [x] Filter: Department · Status
- [x] Sort: Name · Department · Specialization · Email · Status
- [x] Pagination (default 25/page)

### `app/admin/parents/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: `first_name`, `last_name`, `email`, `phone_number`
- [x] Filter: Status
- [x] Sort: Name · Email · Phone · Status
- [x] Pagination (default 25/page)

---

## Phase 3 — Needs Migration + Controls

These pages still use the old `Card + shadcn Table` pattern. Migrate to Stripe-style AND add controls.

### `app/admin/enrollment/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: student name
- [x] Filter: Status (pending · approved · rejected) · Grade Level
- [x] Sort: Student name · Submitted date · Status
- [x] Pagination (default 25/page)
- **Note:** status tabs converted to filter pills in toolbar

### `app/admin/admission/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: name, email, parent name
- [x] Filter: Status (pending · approved · rejected) · Grade Level
- [x] Sort: Name · Submitted date · Status
- [x] Pagination (default 25/page)
- **Note:** converted to fully client-side (fetch limit=1000); server-side pagination removed

### `app/admin/grades/page.tsx`
- [x] Stripe-style table (right panel)
- [x] Name column — plain text (no avatar)
- [x] Search: student name, student number, subject
- [x] Filter: Status (pending · approved · rejected)
- [x] Sort: kept existing tab+search pattern; two-panel grouping preserved
- [x] Pagination: not needed (per-group view, small data set)
- **Note:** two-panel layout kept; subject groups on left, student table on right

### `app/admin/announcements/page.tsx`
- [x] Stripe-style table
- [x] Search: title, content
- [x] Filter: Priority (high · normal · low) · Audience · Status (active · inactive)
- [x] Sort: Title · Published date · Expires date
- [x] Pagination (default 25/page)

### `app/admin/classes/page.tsx`
- [x] Stripe-style table (main class list)
- [x] Stripe-style table (student list inside class detail modal)
- [x] Name column — plain text (no avatar)
- [x] Search: class name, class code, teacher name
- [x] Filter: Grade Level · Status (active · inactive)
- [x] Sort: Class name · Grade · Quarter · Teacher
- [x] Pagination (default 25/page)

### `app/admin/class-list/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: name, student number, email
- [x] Filter: Grade Level (filter pills)
- [x] Sort: N/A (hierarchical collapsible layout kept)
- [x] Pagination: N/A (hierarchical view)
- **Note:** kept hierarchical (grade → section → students) with collapsible grades; removed shadcn Badge/Card/Input

### `app/admin/reports/population/page.tsx`
- [x] Stripe-style table
- [x] Search: grade level name
- [x] Filter: none (< 15 rows total, small table)
- [x] Sort: Grade Level · Male · Female · Total
- [x] Pagination: not needed (small data set, show all)

---

## Phase 4 — Teacher Pages

### `app/teacher/classes/page.tsx`
- [x] Stripe-style table (student list inside class detail)
- [x] Name column — plain text (no avatar)
- [x] Search: student name, student number
- [x] Filter: N/A (already filtered by class)
- [x] Sort: Name · Student number · Grade · Section
- [x] Pagination (default 25/page)
- **Note:** main view converted to plain divs (card layout preserved); student list modal migrated

### `app/teacher/grades/page.tsx`
- [x] Stripe-style table
- [x] Name column — plain text (no avatar)
- [x] Search: student name, student number
- [x] Filter: Status (pending · approved · rejected · unsaved)
- [x] Sort: Student name · Grade · Status
- [x] Pagination (default 25/page)

### `app/teacher/reports/page.tsx`
- [x] Stripe-style table
- [x] Search: class name
- [x] Filter: School Year (select)
- [x] Sort: Class name · Grade Level · Students count · Quarter
- [x] Pagination: not needed (small dataset, pageSize 100)

---

## Progress Summary

| Phase | Total | Done |
|-------|-------|------|
| 1 — Shared infrastructure | 3 | 3 ✅ |
| 2 — Add controls (already Stripe) | 3 × 4 tasks = 12 | 12 ✅ |
| 3 — Migrate + controls (admin) | 7 pages | 7 ✅ |
| 4 — Migrate + controls (teacher) | 3 pages | 3 ✅ |

---

## Execution Order

```
[x] Step 1   Build use-table-controls.ts hook
[x] Step 2   Build Pagination.tsx component
[x] Step 3   Build SortHeader.tsx component
[x] Step 4   Wire students + teachers + parents (Phase 2)
[x] Step 5   Migrate enrollment + admission
[x] Step 6   Migrate grades + announcements
[x] Step 7   Migrate classes + class-list + population
[x] Step 8   Migrate teacher/classes + teacher/grades + teacher/reports
```
