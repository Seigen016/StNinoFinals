# PLAN.md — Client Checklist Follow-ups

Status ng mga item mula sa client checklist audit (2026-08-07). Naka-group by feature area.
Legend: ❌ Not done · ⚠️ Partial · ❓ Need clarification

> ⚠️ **Before deploying:** run `migrations/add-address-lrn-to-admissions.sql` sa Supabase SQL editor (adds `address`, `address_type`, `lrn` columns sa `admissions` table). Kailangan ito para gumana ang bagong Address/LRN fields sa admission form.

---

## 🔴 Quick wins (mababa ang effort, malaki ang impact)

- [x] ⚠️ **"Maliit daw website"** — Removed the `html { font-size: 14px }` / `body { font-size: 0.875rem }` override in `app/globals.css`; root sizing now defaults to the standard 16px so Tailwind rem sizing renders at intended scale.
- [x] ❌ **Reports: Overall Total, hiwalay ang Male/Female** — API already computed `genderBreakdown` (`app/api/admin/stats/route.ts:93-105`), just wasn't surfaced. Added "Male Students" / "Female Students" cards to `summaryCards` in `app/admin/reports/page.tsx`.
- [x] ❌ **Green badge kapag approved AND passed** — Added `getStatusVisual(status, isPassing)` helper in `app/admin/grades/page.tsx`; an approved-but-failing grade now shows a distinct orange "Approved (Failed)" badge instead of green, so green is reserved for approved + passing.
- [x] ⚠️ **Block grade input >100 sa UI** — `updateGrade` in `app/teacher/grades/page.tsx` now clamps out-of-range values to 0–100 live as the teacher types, instead of relying only on the passive HTML `max="100"`.

---

## 🟠 Admission Form fields

- [x] ❌ **Address field (Permanent/Current)** — Idinagdag ang Address input + Permanent/Current select sa admission form (`app/page.tsx`), naka-save sa bagong `address`/`address_type` columns. **Kailangan pang i-run ang migration** `migrations/add-address-lrn-to-admissions.sql` sa Supabase SQL editor.
- [x] ❌ **LRN / Student ID sa admission form** — Idinagdag ang optional LRN field (`app/page.tsx`), naka-save sa bagong `lrn` column sa `admissions` table. Kasama sa parehong migration file sa itaas.
- [x] ❌ **Definition of Terms** — Bagong "Definition of Terms" tab sa Admissions section (glossary ng LRN, Guardian, Transferee, Returnee, atbp.).
- [x] ❌ **Enrollment Process** — Bagong "Enrollment Process" tab na naglalahad ng 6-step na proseso (Inquiry → Documents → Exam → Decision → Enrollment/Payment → Start of Classes).
- [x] ❌ **Duplicate Schedule check** — Idinagdag ang `checkStudentScheduleConflicts()` sa `app/api/admin/classes/route.ts`; hindi na papayagan ang admin na mag-add ng student sa class na may overlapping schedule sa existing class niya (POST at PUT). *Scope note: hindi pa saklaw ang batch-enroll/enrollment-requests approval flow (section-wide auto-enroll) — sabihin lang kung gusto ring i-extend dito.*
- [ ] ⚠️ **Semester to enroll** — school year lang ang matatanong ngayon (`app/page.tsx`), walang semester field. Hindi pa ginagalaw — need i-confirm kung applicable ba talaga ang "semester" sa basic ed context bago idagdag.
- [x] ⚠️ **Guardian Information — separate section** — Nilagyan ng hiwalay na "Guardian Information" heading + divider sa form (`app/page.tsx`), naka-group na ang Guardian Name/Email/Phone.

---

## 🟡 Footer / Portal editability

- [x] ⚠️ **Footer editable via portal, not code** — Turns out `schoolName` was already a fully-wired admin setting (`app/admin/settings/page.tsx:191-197`, saved/read via `/api/admin/settings`) — the public page just never consumed it. Wired `schoolContact.schoolName` into the header, footer, and copyright line in `app/page.tsx`; editing School Name in admin settings now updates all three. Terms/Privacy footer links already point to the admin-editable `/terms` and `/privacy` pages, so those were already covered.

---

## 🟢 School Year / Classes

- [x] ❌ **Auto-archive classes sa bagong school year** — Idinagdag sa `app/api/admin/academic-periods/end-school-year/route.ts` ang step na nag-set ng `is_active: false` sa lahat ng classes ng school year na na-close, kasabay ng existing unenroll/archive logic. Awtomatiko na itong tatakbo sa susunod na "End School Year" action ng admin.

---

## 🔵 Grades — CSV & pass/fail feedback

- [x] ⚠️ **CSV import sa admin side** — Idinagdag ang "Verify CSV" sa `app/admin/grades/page.tsx`: nag-upload ng CSV (student number, grade), tinutugma laban sa mga submitted grades, at hinihighlight ang mismatches (hindi ito nag-o-overwrite ng data — double-check tool lang, hindi input tool, dahil approve/reject lang ang role ng admin dito).
- [x] ⚠️ **Immediate pass/fail indicator sa teacher input** — Idinagdag ang live PASS/FAIL badge sa tabi ng grade input sa `app/teacher/grades/page.tsx`, updating habang nag-type ang teacher.

---

## ❓ Need clarification from client

- [ ] **"MI to Middle Initial"** — walang "MI" label na nakita kahit saan sa codebase; ang field ay "Middle Name" na. Baka ibang page/form ito na hindi pa na-audit, o ibang wording na tinutukoy?
- [ ] **"Domain: Bumili / Parent / Returning student"** — hindi malinaw ang buong context nito. Kailangan ng follow-up kay client kung ano talaga ang tinutukoy dito (dropdown option? domain/category ng applicant?).
- [ ] **"Remove 'student's' sa form"** — walang literal na "Student's ___" text na nakita sa admission form JSX. Kailangan ng specific screenshot/label na tinutukoy ng client.

---

## ✅ Already done (walang aksyon kailangan)

- Guardian's phone number field
- Email notification kapag declined ang application
- Date of Birth field
- New Student / Transferee question sa admission
- Name order (First → Middle → Last → Suffix)
- Terms & Privacy Policy editable sa admin settings
- "Invalid number format" error (working as intended)
- Alphabetical list ng student names (grades)
- History ng rejected grades + reason
- Notify teacher via email kapag na-reject ang grades
- RFID assigned indicator
- Daily Attendance Record view
- Filter for viewing attendance records
