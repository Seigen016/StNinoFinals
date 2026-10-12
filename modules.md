# Sto. Niño de Praga Academy — System Modules Checklist

Last reviewed: March 7, 2026

Legend: ✅ Complete · ⚠️ Incomplete / Needs work · ❌ Placeholder / Not built · 🔒 Security issue

---

## ADMIN MODULE (`/admin`)

| Feature                                      | Status | Notes                                                                                  |
| -------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| Dashboard                                    | ✅     | Stats cards, attendance bar chart, grade approval pie chart — all real data            |
| Admissions                                   | ✅     | View/approve/reject admission applications. Missing: rejection email not actually sent |
| Classes                                      | ✅     | Full CRUD — teacher, room, schedule, students, school year/semester                    |
| Enrollment Requests                          | ✅     | Review pending requests, assign class, approve/reject                                  |
| Grade Approval                               | ✅     | Approve/reject teacher-submitted grades per subject per student                        |
| Students                                     | ✅     | Full CRUD — address, RFID, grade level, section, student number                        |
| Teachers                                     | ✅     | Full CRUD — department, specialization, date hired, RFID                               |
| Parents                                      | ✅     | Full CRUD + link parent to student via student number                                  |
| Live Attendance                              | ✅     | Polls every 5s, shows 50 most recent RFID scans, popup on new scan                     |
| RFID Display                                 | ✅     | Fullscreen scan display with name, photo, time-in/out, timeout countdown               |
| Attendance Reports                           | ✅     | Date-range filter, grade/section filter, per-student drill-down, CSV export            |
| Teacher Attendance                           | ✅     | Calendar grid view per teacher, date-range filter, percentage                          |
| Test SMS                                     | ✅     | Dev tool — sends test SMS via TextBee. Keep for diagnostics                            |
| **Settings**                                 | ⚠️     | UI toggles shown but DB save code is commented out — nothing persists                  |
| **Reports**                                  | ❌     | "Coming soon" stub — no implementation                                                 |
| **Attendance (general `/admin/attendance`)** | ❌     | "Coming soon" stub — separate from the working reports/live pages                      |

---

## TEACHER MODULE (`/teacher`)

| Feature      | Status | Notes                                                                    |
| ------------ | ------ | ------------------------------------------------------------------------ |
| Dashboard    | ✅     | Total students, classes today, pending grades, journal entries; charts   |
| Grades       | ✅     | Select class → loads students with grades and approval status → submit   |
| ~~Journal~~  | ❌     | Removed — feature no longer needed                                      |
| Calendar     | ✅     | Class schedule pulled from DB, filtered by day of week                   |
| **Account**  | ⚠️     | Read-only profile display. No edit form, no save capability              |
| **Settings** | ❌     | Placeholder text only — "Settings panel will be available here"          |
| Login        | 🔒     | Works but compares passwords in plaintext — no hashing                   |

---

## STUDENT MODULE (`/student`)

| Feature             | Status | Notes                                                                                                                                          |
| ------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard           | ⚠️     | GPA and attendance are real; assignments and course progress always empty (no backend)                                                         |
| Grades              | ✅     | Approved grades only, letter grade calculated, GPA shown, PDF export                                                                           |
| Enrollment          | ✅     | Submit enrollment request, view status (pending/approved/rejected), PDF                                                                        |
| **Schedule**        | ❌     | All calendar events are hardcoded in the component for SY 2025-2026 only — no DB, no API                                                       |
| **Profile**         | ⚠️     | Shows name and student ID only. No grade level, section, address, photo, or edit form                                                          |
| `/student/page.tsx` | ⚠️     | Legacy monolithic page (~2000 lines) with embedded login/register. Likely superseded by the sub-pages above. Needs to be cleaned up or removed |

---

## PARENT MODULE (`/parent` and `/parent-dashboard`)

| Feature                                | Status | Notes                                                                                                                                  |
| -------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Parent Dashboard (`/parent-dashboard`) | ✅     | Real API calls for child grades, attendance, and announcements                                                                         |
| Link Student                           | ✅     | Link parent account to a child via student number                                                                                      |
| Enrollment Request                     | ✅     | Parent can submit enrollment request on behalf of linked child                                                                         |
| **Parent Portal (`/parent`)**          | ❌     | All data (GPA, grades, attendance, announcements) is hardcoded mock/random data — should be removed or replaced by `/parent-dashboard` |
| Announcements                          | ⚠️     | API exists and queries the DB but no admin UI exists to create announcements — always returns empty                                    |
| Login                                  | 🔒     | Two-path fragile lookup (parents table → student parent_email fallback), plaintext password                                            |

---

## GUARDIAN MODULE (`/guardian`)

| Feature             | Status | Notes                                                                                                                       |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Guardian Portal** | ❌     | Full prototype — username "Maria Torres" is hardcoded, all grades/assignments/progress are mock data, no auth, no API calls |

---

## PUBLIC / SHARED

| Feature                          | Status | Notes                                                                                                       |
| -------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Homepage                         | ✅     | School info, admission inquiry form (real API), login dialog                                                |
| Password Change Modal            | ✅     | Forces password change on first login                                                                       |
| **`/test-password-change` page** | 🔒     | Debug page — allows flipping `password_change_required` on any user UUID. Must be removed before production |

---

## API / BACKEND ISSUES

| Route                         | Status | Issue                                                                                            |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| `/api/admin/login`            | 🔒     | Plaintext password comparison                                                                    |
| `/api/teacher/login`          | 🔒     | Plaintext password comparison                                                                    |
| `/api/parent/login`           | 🔒     | Plaintext password comparison                                                                    |
| `/api/admin/settings`         | ❌     | DB save code is commented out; returns hardcoded defaults                                        |
| `/api/admin/students`         | ⚠️     | Falls back to hardcoded `mockStudents` on any DB error — silently masks outages                  |
| `/api/admin/attendance`       | ⚠️     | `recentScans` and `recentAlerts` contain hardcoded names ("Juan Dela Cruz", etc.)                |
| `/api/send-email`             | ❌     | Only `console.log`s — no email is actually sent                                                  |
| `/api/teacher/stats`          | ⚠️     | References `class_enrollments` table; real table is `user_classes` — stats likely always 0       |
| `/api/student/update-profile` | ⚠️     | Has a `NODE_ENV === 'development'` bypass that returns success without saving                    |
| `/api/debug/*`                | 🔒     | `set-password-flag`, `database`, `env` — all unprotected, must be removed/secured for production |

---

## SUMMARY — WHAT NEEDS TO BE FINISHED

### Must fix before production (security)

- [ ] Hash all passwords (admin, teacher, parent login routes) — use bcrypt
- [ ] Remove or protect all `/api/debug/*` endpoints
- [ ] Remove `/test-password-change` page
- [ ] Remove `/parent/page.tsx` (mock data portal) — redirect to `/parent-dashboard`

### Incomplete features to build

- [ ] **Admin Settings** — wire up DB persistence for all setting toggles
- [ ] **Admin Reports** — define what reports are needed and implement
- [ ] **Teacher Account** — add edit form with save (name, phone, address, photo)
- [ ] **Teacher Settings** — define what settings teachers need
- [ ] **Student Schedule** — replace hardcoded events with DB-driven school calendar
- [ ] **Student Profile** — add full profile fields + edit/save form
- [ ] **Student Dashboard** — assignments and course progress need a backend
- [ ] **Guardian Portal** — wire up real auth + real API calls, or remove if not needed
- [ ] **Announcements** — build admin UI to create/manage announcements so the parent dashboard announcements tab has content
- [ ] **Admission rejection email** — implement the TODO in `/api/admissions`
- [ ] Fix `/api/teacher/stats` to query `user_classes` instead of `class_enrollments`
- [ ] Remove mock fallback from `/api/admin/students` and `/api/admin/attendance`
- [ ] Fix or remove legacy `/student/page.tsx`
