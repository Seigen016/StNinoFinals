# FIX PLAN — Sto. Niño de Praga Academy Portal

> Organized by module · Priority: 🔴 Critical → 🟠 Major → 🟡 Enhancement → 🔵 Label/Polish
> Track completion by checking off each box.

---

## Legend

| Icon | Meaning |
|------|---------|
| 🔴 | **Critical Bug** — broken functionality, data loss, silent failure |
| 🟠 | **Major Bug** — wrong data, missing render, validation gap |
| 🟡 | **Enhancement** — new behavior, new field, new UX flow |
| 🔵 | **Polish** — label rename, cosmetic, remove unused UI |

---

## 1 · ADMISSION

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 1.1 | 🟡 | Add **Suffix** field (Jr., Sr., II, III, IV) to admission inquiry form | `app/admin/admission/page.tsx` |
| 1.2 | 🟡 | Add **Parent Email** field — required when grade level is Grade 6 or below | `app/admin/admission/page.tsx` |
| 1.3 | 🟡 | Show **RFID warning indicator** on student rows where RFID is not yet assigned — admin awareness | `app/admin/students/page.tsx`, `app/admin/admission/page.tsx` |

- [ ] 1.1 — Suffix field on admission form
- [ ] 1.2 — Parent email (required ≤ Grade 6)
- [x] 1.3 — RFID missing warning on student rows

---

## 2 · ENROLLMENT — Student Side

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 2.1 | 🟡 | **Auto-select Grade Level** in the enrollment form — pull from latest admission record; leave blank if none | `app/student/enrollment/page.tsx` |

- [x] 2.1 — Auto-select grade level from admission data

---

## 3 · ENROLLMENT — Admin Review

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 3.1 | 🔴 | **Rejection email not sent** when a previously-approved enrollment is subsequently rejected — the re-rejection path skips the email trigger | `app/api/admin/enrollment-requests/route.ts` |
| 3.2 | 🟠 | **Section-based class assignment** — admin should select a **Section**, and the system should auto-resolve all classes in that section (not pick individual class) | `app/admin/enrollment/page.tsx`, `app/api/admin/enrollment-requests/route.ts` |
| 3.3 | 🟡 | **Structured rejection reason** — replace free-text-only with a dropdown of preset reasons (e.g. "Incomplete documents", "Over capacity", "Wrong grade level") + "Other" option reveals a text field | `app/admin/enrollment/page.tsx` |
| 3.4 | 🟠 | **Sidebar pending-enrollment count** does not update immediately after approve/reject — sidebar badge stays stale | Admin sidebar component |

- [x] 3.1 — Fix rejection email on re-rejection of approved enrollment
- [x] 3.2 — Section picker replaces individual class picker in approval modal
- [x] 3.3 — Structured rejection reason (dropdown + "Other" text field)
- [x] 3.4 — Sidebar enrollment count real-time update

---

## 4 · PROFILE — Student

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 4.1 | 🔴 | **Profile picture not saving** — upload succeeds visually but persists nothing on reload | `app/student/profile/page.tsx` |
| 4.2 | 🔴 | **Suffix not saving** to the student profile | `app/student/profile/page.tsx` |
| 4.3 | 🟠 | **LRN and Student Number** not visible anywhere on the student-facing profile page | `app/student/profile/page.tsx` |
| 4.4 | 🔵 | **Middle name label** inconsistency — standardize to "M.I." abbreviation format across all profile views | `app/student/profile/page.tsx`, shared profile components |

- [x] 4.1 — Fix profile picture save (photo_url field + admin client)
- [x] 4.2 — Fix suffix save (column exists in DB; now included in update-profile API)
- [x] 4.3 — Display LRN and Student Number on profile
- [x] 4.4 — Standardize Middle Name → "M.I." label

---

## 5 · PROFILE — Teacher

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 5.1 | 🔴 | **Profile image not uploading** — teacher My Account page, image upload has no effect | `app/teacher/account/page.tsx` |
| 5.2 | 🔴 | **Update button broken** — saving profile changes does nothing / no feedback | `app/teacher/account/page.tsx` |

- [x] 5.1 — Fix teacher profile image upload
- [x] 5.2 — Fix teacher profile update button

---

## 6 · PROFILE — Parent / Guardian

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 6.1 | 🟠 | **Parent profile inconsistencies** — fields, layout, and save behavior not consistent with student/teacher profile (audit and align) | `app/parent/page.tsx`, `app/parent-dashboard/page.tsx`, `app/guardian/page.tsx` |

- [x] 6.1 — Audit and fix parent/guardian profile page

---

## 7 · ATTENDANCE — Admin

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 7.1 | 🔴 | **Sections missing in attendance logs** — section column/filter not displaying | `app/admin/attendance/page.tsx`, `app/admin/attendance-reports/page.tsx` |
| 7.2 | 🟡 | **Add filter** to Daily Attendance Records (by section, grade level, date range) | `app/admin/attendance/page.tsx` |
| 7.3 | 🔵 | **Remove "Today's"** word from Live Attendance page header | `app/admin/live-attendance/page.tsx` |
| 7.4 | 🔵 | Live attendance list — show **Date + Time** instead of time only | `app/admin/live-attendance/page.tsx` |
| 7.5 | 🔵 | **Remove Rating and Tardiness** fields from attendance records/display | `app/admin/attendance/page.tsx`, `app/admin/attendance-reports/page.tsx` |
| 7.6 | 🔵 | Change attendance status label **"Present" → "Time In / Time Out"** | All attendance pages |

- [x] 7.1 — Fix sections missing in attendance logs
- [x] 7.2 — Add filter to Daily Attendance Records
- [x] 7.3 — Remove "Today's" from Live Attendance header
- [x] 7.4 — Live attendance: date + time display
- [x] 7.5 — Remove Rating and Tardiness
- [x] 7.6 — Rename "Present" → "Time In / Time Out"

---

## 8 · ATTENDANCE — Teacher

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 8.1 | 🟠 | **Section dropdown shows nothing** when there are no attendance records yet — all assigned sections should always appear regardless of record existence | `app/teacher/attendance/page.tsx` |

- [x] 8.1 — Show all teacher sections in attendance dropdown even with no records

---

## 9 · PARENT / GUARDIAN MODULE

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 9.1 | 🔴 | **MyStudent attendance list not rendering** — attendance records inside the parent's "My Student" panel not appearing in the container/list | `app/parent/page.tsx`, `app/parent-dashboard/page.tsx`, `app/guardian/page.tsx` |
| 9.2 | 🔵 | **Rename "Parent" → "Guardian"** across the entire application (sidebar labels, page titles, table headers, form labels) | All files — see grep list |
| 9.3 | 🔵 | **Link Student modal** — rename field label "Relationship" → "Relationship to Student" | `app/admin/parents/page.tsx` |

- [x] 9.1 — Fix MyStudent attendance not rendering
- [x] 9.2 — Global rename: "Parent" → "Guardian"
- [x] 9.3 — "Relationship" → "Relationship to Student" in link modal

---

## 10 · TEACHER DASHBOARD

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 10.1 | 🔴 | **Total Students not fetching** — stat card shows 0 or error | `app/teacher/page.tsx`, `app/teacher/components/TeacherDashboard.tsx` |
| 10.2 | 🔴 | **Pending Grades not fetching** — stat card shows 0 or error | `app/teacher/page.tsx`, `app/teacher/components/TeacherDashboard.tsx` |
| 10.3 | 🔴 | **"Classes Today"** — stat card not fetching data | `app/teacher/page.tsx`, `app/teacher/components/TeacherDashboard.tsx` |
| 10.4 | 🔵 | Rename stat card **"Classes Today" → "Total Classes"** | `app/teacher/page.tsx`, `app/teacher/components/TeacherDashboard.tsx` |

- [x] 10.1 — Fix Total Students fetch on teacher dashboard
- [x] 10.2 — Fix Pending Grades fetch on teacher dashboard
- [x] 10.3 — Fix Classes stat fetch on teacher dashboard
- [x] 10.4 — Rename "Classes Today" → "Total Classes"

---

## 11 · TEACHER REPORTS

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 11.1 | 🟠 | **Slanted/rotated label** in reports PDF — fix label to read "Teacher" (not the current value that requires manual revision) | `app/teacher/reports/page.tsx` |
| 11.2 | 🟡 | **Add CSV export** to teacher reports — format must match the PDF layout | `app/teacher/reports/page.tsx` |
| 11.3 | 🔵 | **Remove Calendar** from teacher sidebar — feature is unused | `app/teacher/components/TeacherSidebar.tsx`, `app/teacher/calendar/page.tsx` |

- [x] 11.1 — Fix slanted label in teacher reports
- [x] 11.2 — Add CSV export for teacher reports
- [x] 11.3 — Remove Calendar from teacher sidebar

---

## 12 · GRADES (Admin)

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 12.1 | 🟡 | **Multi-select checkboxes** for batch approve/reject — select multiple grade submissions at once | `app/admin/grades/page.tsx` |
| 12.2 | 🟡 | **Confirmation modal** on approve/reject — shows student name, subject, quarter, and asks for confirmation before committing | `app/admin/grades/page.tsx` |
| 12.3 | 🟡 | **Improve CSV export format** — align columns, proper headers, school info header row, consistent with PDF structure | `app/admin/grades/page.tsx` |

- [x] 12.1 — Multi-select batch approve/reject for grades
- [x] 12.2 — Confirmation modal before grade approval/rejection action
- [x] 12.3 — Improve CSV grade export format

---

## 13 · CLASSES / SUBJECT MANAGEMENT (Admin)

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 13.1 | 🟠 | **Wrong counts** — GRADE LEVELS and TOTAL SECTIONS stat cards in class-list show incorrect numbers | `app/admin/class-list/page.tsx` |
| 13.2 | 🔵 | **Remove "Status" column** from classes management table | `app/admin/classes/page.tsx` |
| 13.3 | 🔵 | **Rename "Classes Management" → "Subject Management"** (page title, sidebar link, breadcrumb) | `app/admin/classes/page.tsx`, sidebar component |

- [x] 13.1 — Fix wrong grade level and section counts in class list
- [x] 13.2 — Remove Status column from classes table
- [x] 13.3 — Rename "Classes Management" → "Subject Management"

---

## 14 · SECTIONS (Admin)

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 14.1 | 🟠 | **Prevent section deletion** when there are enrolled students in that section — show a warning and block the action | `app/admin/sections/page.tsx`, `app/api/admin/settings/sections/route.ts` |

- [x] 14.1 — Block section deletion when students are enrolled

---

## 15 · REPORTS (Admin)

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 15.1 | 🔵 | **Rename "Population Report" → "Enrollment Report"** (page title, sidebar link, report header) | `app/admin/reports/population/page.tsx`, `app/admin/reports/page.tsx` |
| 15.2 | 🟡 | **Add CSV export** to every page that already has PDF export — same data, matching column structure | All report pages |

- [x] 15.1 — Rename Population Report → Enrollment Report
- [x] 15.2 — Add CSV to all PDF-export pages

---

## 16 · ANNOUNCEMENTS

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 16.1 | 🟠 | **Verify duration-based expiry** — confirm announcements disappear from student/teacher views after the set duration lapses; fix if they remain visible indefinitely | `app/admin/announcements/page.tsx`, announcement display components |

- [x] 16.1 — Verify and fix announcement expiry by duration

---

## 17 · VALIDATION & DATA FORMAT

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 17.1 | 🟠 | **Student Number** — enforce digits only, max 12 characters; update input mask and placeholder example to also be 12 digits | All student forms and profile pages |
| 17.2 | 🔵 | **Employee Number** — enforce digits only, exactly 12 characters (teacher and admin profiles) | Teacher/admin profile forms |

- [x] 17.1 — Student number: digits-only, max 12, fix example
- [x] 17.2 — Employee number: digits-only, 12 digits

---

## 18 · SCHOOL YEAR

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 18.1 | 🟡 | **School year always defaults to next year** — e.g., if current year is 2025-2026, the school year picker/default should be 2026-2027; handle automatic rollover | Enrollment form, admin settings, all school year selectors |

- [x] 18.1 — Default school year to next academic year

---

## 19 · ARCHIVE / DELETE

| # | Pri | Item | File(s) |
|---|-----|------|---------|
| 19.1 | 🟡 | **Deletion reason field** — add a reason modal before any delete/archive action so admin intent is recorded | All admin delete/archive actions |

- [x] 19.1 — Add reason prompt on all delete/archive actions

---

## Summary Checklist (All Items)

### 🔴 Critical (fix first)
- [x] 3.1 Rejection email not sent on re-rejection of approved enrollment
- [x] 4.1 Student profile picture not saving
- [x] 4.2 Student suffix not saving
- [x] 5.1 Teacher profile image upload broken
- [x] 5.2 Teacher profile update button broken
- [x] 7.1 Sections missing in attendance logs
- [x] 9.1 Parent MyStudent attendance list not rendering
- [x] 10.1 Teacher dashboard — Total Students not fetching
- [x] 10.2 Teacher dashboard — Pending Grades not fetching
- [x] 10.3 Teacher dashboard — Classes stat not fetching

### 🟠 Major (fix before release)
- [x] 3.2 Section picker in enrollment approval (not individual class)
- [x] 3.4 Sidebar enrollment count real-time update
- [x] 4.3 LRN and Student Number not visible on student profile
- [x] 6.1 Parent/guardian profile inconsistencies
- [x] 7.1 Sections missing in attendance logs (admin)
- [x] 8.1 Teacher attendance — all sections in dropdown even with no records
- [x] 13.1 Wrong grade level and section counts in class list
- [x] 14.1 Block section deletion when students enrolled
- [x] 16.1 Announcement expiry by duration
- [x] 17.1 Student number validation (digits only, 12 max)

### 🟡 Enhancement
- [ ] 1.1 Suffix field on admission form
- [ ] 1.2 Parent email on admission (required ≤ Grade 6)
- [x] 1.3 RFID missing warning on student rows
- [x] 2.1 Auto-select grade level from admission in enrollment form
- [x] 3.3 Structured rejection reason (dropdown + Other)
- [x] 7.2 Filter on Daily Attendance Records
- [x] 11.2 CSV export for teacher reports
- [x] 12.1 Multi-select batch approve/reject for grades
- [x] 12.2 Confirmation modal for grade approve/reject
- [x] 12.3 Improve CSV grade export format
- [x] 15.2 CSV export on all PDF-export pages
- [x] 18.1 Default school year to next academic year
- [x] 19.1 Reason prompt on all delete/archive actions

### 🔵 Polish / Label Changes
- [x] 4.4 "Middle Name" → "M.I." label consistency
- [x] 7.3 Remove "Today's" from Live Attendance header
- [x] 7.4 Live attendance: show date + time
- [x] 7.5 Remove Rating and Tardiness from attendance
- [x] 7.6 Rename "Present" → "Time In / Time Out"
- [x] 9.2 Global rename "Parent" → "Guardian"
- [x] 9.3 "Relationship" → "Relationship to Student" in link modal
- [x] 10.4 Rename "Classes Today" → "Total Classes"
- [x] 11.1 Fix slanted label in teacher reports
- [x] 11.3 Remove Calendar from teacher sidebar
- [x] 13.2 Remove Status column from classes table
- [x] 13.3 Rename "Classes Management" → "Subject Management"
- [x] 15.1 Rename "Population Report" → "Enrollment Report"
- [x] 17.2 Employee number: digits-only, 12 digits

---

> **Total items: 44**
> Last updated: 2026-06-07
