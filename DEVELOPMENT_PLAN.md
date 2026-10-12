# St. Niño School Management System — Development Plan

**Stack:** Next.js 16 · React 19 · TypeScript · Supabase (PostgreSQL) · Tailwind CSS  
**Roles:** Admin · Teacher · Student · Parent  
**Last updated:** 2026-05-02

---

## Overview

This document tracks all outstanding feature work and bug fixes for the St. Niño School Management System. Items are ordered from lowest to highest implementation complexity. Each item includes a scope, acceptance criteria, and the affected area of the codebase.

---

## Tier 1 — Low Complexity (UI / Validation Tweaks)

These are self-contained UI or form changes with no new backend logic required.

---

### 1. Required Field Indicators (Red Asterisks)

**Scope:** All forms across Admin, Teacher, Student, and Parent portals.  
**What to do:** Add a red `*` indicator (`<span className="text-red-500">*</span>`) next to every required field label.  
**Acceptance:** All mandatory inputs are visually marked before the user submits.

---

### 2. LRN Field — 11-Character Integer Limit

**Scope:** Student admission form · Student profile edit form.  
**What to do:**
- Add `maxLength={11}` and a pattern validator that accepts digits only.
- Display an inline error if the user types non-numeric characters.

**Acceptance:** LRN field rejects non-integer input and caps at 11 characters.

---

### 3. Student Number — Read-Only After Initial Assignment

**Scope:** Student profile edit (`/admin/students`, `/student/profile`).  
**What to do:**
- Render the student number field as read-only (`disabled` / `readOnly`) once a value has been saved.
- Remove any edit affordance (pencil icon, focus ring) for that field.

**Acceptance:** Existing student numbers cannot be changed through the UI.

---

### 4. Announcement Status — Urgent & Normal Only (with Priority Stacking)

**Scope:** `/admin/announcements` · Announcement display components.  
**What to do:**
- Remove all status options except `urgent` and `normal`.
- Sort the announcement list so `urgent` items always render above `normal` ones.
- Update any badge/chip colours to reflect the two-tier system.

**Acceptance:** Only two statuses exist; urgent announcements always appear at the top of every list.

---

### 5. Remove Gender Filter from Reports / Print Views

**Scope:** PDF print templates · Report pages that currently show Male/Female breakdown.  
**What to do:** Remove the male/female columns and filter controls from affected report layouts.  
**Acceptance:** No gender-specific columns appear in any generated report or PDF.

---

### 6. Grade Approval — Conditional Button Label

**Scope:** Grade approval panel (`/admin/grades` or equivalent approval view).  
**What to do:**
- If exactly **1** grade is pending → show a single **"Approve"** button.
- If **2 or more** grades are pending → show **"Approve All"** button.

**Acceptance:** Button label matches the pending count dynamically; never shows both buttons simultaneously.

---

### 7. Grand Total Label in Grade PDF

**Scope:** jsPDF grade print template.  
**What to do:** Replace the current label for the final row aggregate with **"Grand Total"**.  
**Acceptance:** Printed grade sheets display "Grand Total" on the summary row.

---

### 8. Remove "Status" Column from Student / Teacher / Parent Management Tables

**Scope:** `/admin/students` · `/admin/teachers` · `/admin/parents` table views.  
**What to do:** Remove the status column from the table and any related filter UI. Do not remove the underlying database column — it may still be used elsewhere.  
**Acceptance:** Management tables no longer show a status column or status filter.

---

### 9. Remove "Parent" from Student Add/Edit Dropdown

**Scope:** Add/Edit Student form — the role or relationship dropdown.  
**What to do:** Filter out the "Parent" option from any dropdown that currently lists it as a selectable role or linked-contact type during student creation.  
**Acceptance:** The dropdown does not offer "Parent" as a selectable option when adding a student.

---

### 10. Landing Page — Logo Size & Information Update

**Scope:** Public landing page (`/`).  
**What to do:**
- Increase the school logo size.
- Update school contact info, tagline, or any placeholder text as directed by stakeholders.

**Acceptance:** Landing page reflects current branding and up-to-date information.

---

## Tier 2 — Medium Complexity (Feature Additions / Data Fixes)

These require new logic, additional API work, or cross-component coordination.

---

### 11. Editable Personal Information — Student, Teacher, Parent

**Scope:** Profile edit pages for all three roles.  
**What to do:**
- Ensure all personal info fields (name, address, contact number, email, birthday, etc.) are editable via a form with save/cancel actions.
- Validate required fields before submission.
- Persist changes through the existing `update-profile` API endpoints or create equivalent endpoints for teachers and parents.

**Acceptance:** Any authorized user can update their own personal information and see the changes reflected immediately after saving.

---

### 12. Required Fields Enforcement Across All Important Forms

**Scope:** Admission, enrollment, student add/edit, teacher add/edit, parent add/edit forms.  
**What to do:**
- Audit all forms and define a required-fields list with the product owner.
- Add server-side and client-side validation for each required field.
- Display clear inline error messages.

**Acceptance:** Submitting a form with missing required fields is blocked, and each missing field is identified to the user.

---

### 13. Fix PDF Download in Grade Approval

**Scope:** Grade approval page — PDF export button.  
**What to do:**
- Investigate why `jsPDF` / `jspdf-autotable` is not triggering a download.
- Likely causes: missing `doc.save()` call, CORS issue with assets, or a client/server rendering conflict in Next.js App Router.
- Fix the root cause and verify the download works across Chrome, Firefox, and Safari.

**Acceptance:** Clicking the PDF export button downloads a correctly formatted grade sheet.

---

### 14. Fix Form 138 — Grade Data Not Fetching

**Scope:** Form 138 view (read-only report card).  
**What to do:**
- Trace the data flow from the Form 138 component to the grades API.
- Identify where the fetch is failing (wrong query params, missing join, RLS policy, etc.).
- Fix the API or component so all subject grades load correctly.

**Acceptance:** Form 138 displays complete, accurate grade data for the selected student and school year.

---

### 15. Attendance Log per Section — Teacher Portal with CSV Export

**Scope:** New view inside the Teacher portal (`/teacher/attendance` or a tab on `/teacher/classes`).  
**What to do:**
- Build a read-only attendance log table, filterable by section and date range.
- Each row: student name, date, time-in, time-out, status (Present / Absent / Late).
- Add a **"Export CSV"** button that generates a properly formatted CSV using the browser's download API.
- Data source: `attendance_records` table, filtered by the teacher's assigned sections.

**Acceptance:** A teacher can view attendance for any of their sections, apply date filters, and download the result as a CSV file.

---

### 16. Auto-Rejection After 2-Day Non-Compliance Window

**Scope:** Admission / enrollment request workflow (`/admin/admission`, `/admin/enrollment`).  
**What to do:**
- When a request has no attached supporting files, set its status to `pending` automatically.
- After **48 hours** without the required files being uploaded, automatically transition the status to `rejected`.
- Implement via a Supabase Edge Function (cron) or a Next.js API route called by a scheduled job that checks `created_at` timestamps.
- Notify the applicant by email when auto-rejected.

**Acceptance:** Requests without attachments are marked pending immediately; they are auto-rejected after 48 hours if still incomplete.

---

### 17. Soft Delete — Archive Instead of Hard Delete

**Scope:** Student, Teacher, and Parent delete actions across all admin management pages.  
**What to do:**
- Add a boolean column `is_archived` (or `deleted_at` timestamp) to the relevant database tables if not already present.
- Replace all hard-delete operations with a soft-delete that sets `is_archived = true`.
- Filter all management list queries to exclude archived records by default.
- Create an **"Archive"** or **"Deleted"** view in the admin portal where archived records are visible (read-only).

**Acceptance:** Deleting a record hides it from normal views but keeps it in the database; archived records are accessible in a dedicated view.

---

## Tier 3 — High Complexity (New Modules / Hardware Integration)

These require significant architecture work, new database structures, or external system integration.

---

### 18. RFID Tagging Module — Student Management

**Scope:** Student profile edit form (`/admin/students`).  
**What to do:**
- Remove the direct text input for RFID number on the student profile edit form.
- Replace it with a **read-only display** of the current RFID tag (if any) and a **"Scan to Update"** button.
- Clicking "Scan to Update" opens a modal that:
  1. Sends a request to the RFID scanner API (see Item 19) to enter "pairing mode."
  2. Polls or listens (WebSocket / SSE) for a scan event.
  3. On successful scan, displays the scanned tag ID for confirmation before saving.
  4. On confirm, updates `rfid_devices` / student record via `POST /api/admin/update-teacher-rfid` (or a new student equivalent).
- Ensure the existing `POST /api/admin/check-rfid` is used to prevent duplicate tag assignments.

**Acceptance:** RFID number is never manually typed; it is always assigned via a physical scan through the UI flow described above.

---

### 19. RFID Attendance Scanning — External API Integration

**Scope:** Live attendance system (`/admin/live-attendance`, `/admin/rfid-display`).  
**What to do:**
- Define and document the RFID scanner hardware API contract (endpoint, auth, payload shape).
- Replace any existing Arduino-specific serial/USB integration with HTTP calls to the hardware API.
- The scanner API should POST to a Next.js webhook endpoint (`POST /api/attendance/rfid-scan`) when a card is tapped.
- The webhook handler: looks up the student by RFID tag → records an `attendance_record` → pushes a real-time update to the live attendance display via Supabase Realtime.
- Handle edge cases: unknown tag, student already checked in, outside of school hours.

**Acceptance:** When a student taps their card on the RFID reader, their attendance is recorded and appears on the live attendance display within 2 seconds, with no Arduino code required.

---

### 20. Three-Strike RFID Security — Unauthorized Access Alert

**Scope:** RFID attendance system · Monitoring tab attendance view.  
**What to do:**
- Track consecutive failed/unauthorized RFID scan attempts (unknown or suspended tag).
- After **3 consecutive unauthorized attempts**:
  1. Log a security event to a new `security_events` table (tag ID, timestamp, location).
  2. Trigger an audible alarm signal via the RFID hardware API.
  3. Display a **pop-up alert modal** on the admin Monitoring → Attendance tab showing: tag ID attempted, timestamp, and number of attempts.
  4. Send an SMS/email notification to the admin.
- Reset the attempt counter after a successful scan or after a configurable cooldown period.

**Acceptance:** Three unauthorized taps in sequence trigger an alarm, a visible admin alert, and a logged security event. The counter resets on a valid scan.

---

## Implementation Notes

### Database Migrations
All schema changes (new columns, new tables, soft-delete fields) must be written as numbered migration files in `/migrations/` and reviewed before applying to production.

### API-First for RFID
The hardware integration (Items 19–20) must be built against a documented API spec before any frontend work begins. Agree on the request/response contract with the hardware vendor first.

### Testing
- UI changes (Tier 1): manual verification in Chrome + Safari.
- Business logic (Tier 2): add unit tests in Vitest for validation rules and auto-rejection timing.
- RFID integration (Tier 3): integration tests with a mock scanner API before connecting real hardware.

---

## Progress Tracker

| # | Item | Tier | Status |
|---|------|------|--------|
| 1 | Red asterisks on required fields | 1 | `[ ] Todo` |
| 2 | LRN — 11-digit integer only | 1 | `[ ] Todo` |
| 3 | Student number — read-only | 1 | `[ ] Todo` |
| 4 | Announcements — urgent/normal only + stacking | 1 | `[ ] Todo` |
| 5 | Remove gender from reports/PDF | 1 | `[ ] Todo` |
| 6 | Grade approval — conditional button | 1 | `[ ] Todo` |
| 7 | Grand Total label in grade PDF | 1 | `[ ] Todo` |
| 8 | Remove Status column from management tables | 1 | `[ ] Todo` |
| 9 | Remove Parent from student add dropdown | 1 | `[ ] Todo` |
| 10 | Landing page — logo + info update | 1 | `[ ] Todo` |
| 11 | Editable personal info — all roles | 2 | `[ ] Todo` |
| 12 | Required fields enforcement on all forms | 2 | `[ ] Todo` |
| 13 | Fix PDF download in grade approval | 2 | `[ ] Todo` |
| 14 | Fix Form 138 grade data fetching | 2 | `[ ] Todo` |
| 15 | Attendance log per section + CSV export (teacher) | 2 | `[ ] Todo` |
| 16 | Auto-rejection after 2-day non-compliance | 2 | `[ ] Todo` |
| 17 | Soft delete → archive | 2 | `[ ] Todo` |
| 18 | RFID tagging module — student profile | 3 | `[ ] Todo` |
| 19 | RFID attendance — external API integration | 3 | `[ ] Todo` |
| 20 | Three-strike unauthorized scan alert | 3 | `[ ] Todo` |
