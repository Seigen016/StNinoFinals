# To-Do Analysis — StNiño de Praga Academy SIS

> Generated: 2026-06-08

---

## 1. Remove school year from Subject add/edit form

**Complexity:** Low  
**File:** `app/admin/classes/page.tsx` — lines 95, 195, 628–635

**Finding:**  
The class creation/edit form has a `school_year` select dropdown. The school year is already handled globally via `getActiveSchoolYear()` (auto-set on save at line 195), so exposing it in the form is redundant and confusing.

**Fix:**  
- Remove the `school_year` field from the form state initializer (line 95)  
- Remove the dropdown from the JSX (lines 628–635)  
- Keep the auto-assignment on submit (`normalizeSchoolYear()` + `getActiveSchoolYear()`) so it still saves correctly

---

## 2. Remove Print button from Class List

**Complexity:** Low  
**File:** `app/admin/class-list/page.tsx` — line 8 (`Printer` import), lines 161–162 (button)

**Fix:**  
- Delete the `<Button>` element and its `Printer` icon  
- Remove unused `Printer` import from lucide-react

---

## 3. Move Intended Grade Level higher in enrollment form

**Complexity:** Low  
**File:** `app/student/enrollment/page.tsx` — form field order in JSX

**Finding:**  
`intended_grade_level` / `grade_level` field currently appears lower in the form. It should be one of the first fields since it affects section options and context.

**Fix:**  
Reorder the JSX so the grade level select renders near the top of the form (after enrollment type or student name section).

---

## 4. Enrollment form should pre-fill from admission record

**Complexity:** Medium  
**File:** `app/student/enrollment/page.tsx` — lines 197–226  
**Related:** `app/api/admissions/approve/route.ts` — line 191

**Finding:**  
When an admission is approved, the API creates an enrollment request and copies `intended_grade_level → grade_level`. However the enrollment form on the student side populates fields from **enrollment history** (`suggestedGrade`) and falls back to `student.grade_level` — it does NOT read the originating admission record's full data (name, parent, previous school, etc.).

**Fix:**  
- On enrollment page load, fetch the linked admission record (via `admission_id` on the enrollment request or student record)  
- Pre-fill form fields: first_name, last_name, middle_name, grade_level, previous_school, parent_name, contact_number, etc. from the admission  
- Make pre-filled fields read-only or visually distinct so the student knows they came from their application

---

## 5. Enrollment page shows form immediately instead of loading state

**Complexity:** Low  
**File:** `app/student/enrollment/page.tsx` — lines 158, 167, 754–757

**Finding:**  
`isLoading` from `useStudentAuth()` and `dataLoading` both exist, but the loading UI at lines 754–757 only shows plain text "Loading...". The form fields appear to flash/render before data is ready.

**Fix:**  
- Ensure the full form section is gated behind `!dataLoading && !isLoading` (not just buttons being disabled)  
- Show a proper skeleton/spinner covering the form area while loading  
- Prevent the empty form from flashing on first render

---

## 6. Add top loader to app layout

**Complexity:** Low  
**File:** `app/layout.tsx` (no top loader currently)  
**Suggested package:** `next-nprogress-bar` (or `nextjs-toploader`)

**Finding:**  
No top loading bar exists. Page navigations give no visual feedback.

**Fix:**  
```bash
pnpm add nextjs-toploader
```
Add `<NextTopLoader color="#991b1b" />` (school red) inside `app/layout.tsx` before `{children}`, outside any auth provider.

---

## 7. Remove `enrollment_type` from Enrollment Management UI

**Complexity:** Low  
**File:** `app/admin/enrollment/page.tsx` — lines 457 (table column), 536 (detail panel), 89–104 (badge component + config)

**Finding:**  
`enrollment_type` (new / returning / transferee / returnee / repeater) is shown as a badge in both the enrollment table row and the detail panel. User wants this removed from the UI.

**Fix:**  
- Remove the `EnrollmentTypeBadge` column from the table  
- Remove it from the detail panel  
- Keep `TYPE_CONFIG` and the component in code if other parts use it; otherwise delete  
- Do NOT remove the field from the database — it may still be needed server-side

---

## 8. Teacher profile image upload not working

**Complexity:** Medium  
**File:** `app/teacher/account/page.tsx` — lines 85–120

**Finding:**  
The teacher account page calls `/api/upload-avatar` with `role: 'teacher'` and then updates via `/api/teacher/update-profile` with `photo_url`. The same pattern works for parent (recently fixed). Most likely cause: the `/api/upload-avatar` route handles `'teacher'` role differently, or Storage RLS blocks unauthenticated writes.

**Fix path:**  
1. Check `/api/upload-avatar/route.ts` — confirm it handles `role === 'teacher'` and uses `supabaseAdmin` (not client)  
2. Confirm the teacher account page sends `userId` matching the correct DB record  
3. Confirm `/api/teacher/update-profile` updates the correct column (`photo_url` or `avatar_url`)  
4. Mirror the exact working pattern from the parent dashboard fix

---

## 9. Auto-unenroll students at end of 4th quarter

**Complexity:** High  
**File:** `app/api/cron/auto-reject/route.ts` (existing cron pattern to follow)  
**Related:** `migrations/supabase-cron-auto-reject.sql`

**Finding:**  
No logic exists for quarter-end unenrollment. A cron job pattern is already established.

**Plan:**  
- Create `app/api/cron/end-of-quarter/route.ts`  
- Trigger: when `active_quarter` transitions from Q4 → new school year (or manually via admin)  
- Actions:  
  1. Set `enrollment_status = 'unenrolled'` on all active students  
  2. Remove students from `user_classes` (clear section assignments)  
  3. Optionally mark enrollment_requests as expired  
- Schedule via Supabase Cron or trigger from the Academic Period admin page when advancing past Q4  
- **Decision needed:** Should this fire automatically via cron or only when admin manually advances the period?

---

## 10. Remove parent-student relationship when student transitions to Grade 7+

**Complexity:** High  
**File:** Parent-student link managed via `app/api/admin/parents/link-student/route.ts`  
**Related:** `database.types.ts` — no dedicated `parent_students` table found; relationship likely stored on student record or via a linking table

**Finding:**  
No automatic cleanup logic exists. When a student moves from Grade 6 → Grade 7 (JHS) or similar SHS transition, the parent link should be severed since "Miranda na yon" (the student is now old enough to be independent in the system).

**Plan:**  
- Identify exact schema: is it `users.parent_id`, a `parent_students` join table, or something else?  
- Add cleanup hook in the grade promotion flow (wherever `grade_level` is updated on student advance)  
- Threshold: Grade 7 and above — remove parent link  
- Also run as a one-time migration for existing Grade 7+ students who still have parent links  
- **Decision needed:** Should parents still see historical grades but not be linked going forward, or fully severed?

---

## 11. Remove non-functional dashboard buttons (Check Grades, etc.)

**Complexity:** Low  
**File:** `app/student/components/StudentDashboard.tsx` — lines 63–79  
**Also:** `app/student/dashboard/page.tsx` — line 244

**Finding:**  
Quick Access grid has 4 buttons: Take Attendance, Check Grades, View Progress, Enrollment Status. Some of these navigate to pages that may not be fully implemented or are dead ends.

**Fix:**  
- Audit each button: does it navigate to a working page?  
- Remove buttons that go nowhere or crash  
- Keep only functional ones (e.g., Enrollment Status → `/student/enrollment` works)  
- Do not add placeholder pages — just remove the broken buttons cleanly

---

## Priority Order (suggested)

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 6 | Top loader | 10 min | High — affects all pages |
| 2 | Remove print button | 5 min | Low |
| 1 | Remove school year from subject form | 10 min | Medium |
| 7 | Remove enrollment_type badge | 10 min | Medium |
| 11 | Remove broken dashboard buttons | 15 min | Medium |
| 5 | Enrollment page loading state | 20 min | Medium |
| 3 | Move grade level field up | 15 min | Low |
| 8 | Fix teacher avatar upload | 30 min | High |
| 4 | Pre-fill enrollment from admission | 1–2 hrs | High |
| 9 | Auto-unenroll at Q4 end | 2–3 hrs | High (needs decision) |
| 10 | Parent link cleanup on grade 7+ | 2–3 hrs | Medium (needs decision) |
