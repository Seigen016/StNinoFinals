# ENROLLMENT_REFACTOR_PLAN.md
## Annual Enrollment Architecture — St. Nino School Information System

**Prepared by:** Architecture Review  
**Date:** June 2026  
**Status:** Pre-Implementation Design Document  
**Scope:** Full enrollment subsystem refactor

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Analysis](#2-current-system-analysis)
3. [Problems with the Existing Quarterly Enrollment Model](#3-problems-with-the-existing-quarterly-enrollment-model)
4. [Proposed Annual Enrollment Architecture](#4-proposed-annual-enrollment-architecture)
5. [Business Rules](#5-business-rules)
6. [Complete Enrollment Workflow](#6-complete-enrollment-workflow)
7. [Quarter and Semester Management](#7-quarter-and-semester-management)
8. [Edge Cases and Special Scenarios](#8-edge-cases-and-special-scenarios)
9. [Required Backend Changes](#9-required-backend-changes)
10. [Required Frontend Changes](#10-required-frontend-changes)
11. [API Changes](#11-api-changes)
12. [Database Impact Analysis](#12-database-impact-analysis)
13. [Data Migration Strategy](#13-data-migration-strategy)
14. [Backward Compatibility Considerations](#14-backward-compatibility-considerations)
15. [Risks and Mitigation](#15-risks-and-mitigation)
16. [Step-by-Step Implementation Plan](#16-step-by-step-implementation-plan)
17. [Testing Strategy](#17-testing-strategy)
18. [Future Extensibility](#18-future-extensibility)

---

## 1. Executive Summary

The current system treats enrollment as a **per-quarter event** — students submit a separate enrollment request for Q1, Q2, Q3, and Q4 every school year. This fundamentally contradicts how Philippine K-12 education works. A student enrolls **once** per school year and then simply progresses through academic periods.

This document proposes a complete redesign of the enrollment subsystem based on three separable concerns that the current code incorrectly merges:

| Concern | What it is | Who controls it |
|---|---|---|
| **Admission** | Is this student accepted into the school? | Admin / Registrar |
| **Enrollment** | Register the student for this school year and assign a section | Admin / Registrar |
| **Academic Period** | Which quarter/semester is currently active for instruction | Admin / Registrar |

The refactor introduces:
- **Annual enrollment** — one request per student per school year
- **Section-based assignment** — enrolling in a section automatically enrolls in all subject classes
- **Active period management** — admin sets the current quarter; all modules follow automatically
- **Enrollment type classification** — new, returning, transferee, returnee, repeater
- Preserves all historical data and grades

**Estimated scope:** Medium-high. The data model changes are non-trivial but backward-compatible. The migration path is fully defined and safe.

---

## 2. Current System Analysis

### 2.1 What the Codebase Actually Does

After a full read of the enrollment subsystem, the actual flow is:

```
Student selects: grade level + quarter (1/2/3/4) + school year
  → POST /api/student/enrollment-request
  → Creates enrollment_requests row (status: 'pending', quarter: N)

Admin approves:
  → PATCH /api/admin/enrollment-requests
  → Picks a specific class to assign
  → Inserts student into that class's section siblings via user_classes
  → Updates users.grade_level and users.section
```

The `quarter` field on `enrollment_requests` determines which quarter the student is enrolling for — which implies a student must repeat this entire flow four times per school year.

### 2.2 Key Tables (Current State)

```
enrollment_requests
  ├─ student_id
  ├─ grade_level
  ├─ strand (nullable, SHS only)
  ├─ school_year
  ├─ quarter (INTEGER 1–4)          ← THE CORE PROBLEM
  ├─ status (pending|approved|rejected)
  ├─ assigned_class_id              ← assigns to ONE class, not a section
  └─ previous_grades_url

classes
  ├─ quarter (VARCHAR '1'–'4')      ← each class is tied to one quarter
  ├─ section (TEXT)
  ├─ grade_level (TEXT)
  └─ school_year (TEXT)

user_classes
  ├─ user_id
  ├─ class_id
  └─ membership_type (student|teacher)

grades
  ├─ class_id
  └─ quarter (INTEGER)              ← grade submitted per quarter
```

### 2.3 Pre-existing Schema Issues Discovered

1. **Dual `semester`/`quarter` naming**: A migration renamed the column but the API still accepts `semester` as a field name in some routes.
2. **`class_enrollments` table exists alongside `user_classes`**: Two tables track the same relationship. The code primarily uses `user_classes`. `class_enrollments` is unused dead weight.
3. **`classes.quarter` is VARCHAR** ('1','2','3','4') but **`enrollment_requests.quarter` is INTEGER** — type inconsistency across the schema.
4. **`system_settings` table exists** but does not yet store the active academic period — a natural home for that concept.
5. **`section` is a free-text field everywhere** — there is no formal `sections` table, making it impossible to enumerate valid sections, enforce capacity, or assign section advisers.

### 2.4 Modules That Depend on Enrollment State

Every major module in the system needs to know the current academic period:

| Module | How it uses quarter/enrollment |
|---|---|
| Attendance | RFID scans tagged to school_year; summary shown per quarter |
| Grades | Submitted per class per quarter; displayed per quarter |
| Schedule | Classes have quarters; teachers see quarterly schedules |
| Report cards | Generated per quarter per student |
| Dashboard | Shows current quarter's GPA, attendance rate |
| Admin reports | Population reports filtered by school_year |
| Email notifications | References school_year and quarter in messages |
| COE PDF | Shows enrolled school year and grade level |

All of these currently get their quarter context from `classes.quarter` or `enrollment_requests.quarter`. Under the new model, they will get it from the **active academic period** — a single authoritative source.

---

## 3. Problems with the Existing Quarterly Enrollment Model

### 3.1 Fundamental Conceptual Error

Enrollment is not a quarterly event in Philippine K-12 education. DepEd Order No. 11, s. 2022 (Revised Guidelines on the Use of DepEd Computerized Forms) and the Basic Education Enrollment Form (BEEF) treat enrollment as a **single annual event**. The quarterly breakdown is purely an academic tracking mechanism, not an admission gate.

Requiring students to re-enroll every quarter creates:
- 4× the administrative burden for registrar
- 4× the friction for parents
- 4× the opportunity for records to become inconsistent

### 3.2 Broken Grade and Attendance Continuity

The current model assigns a student to a specific class for a specific quarter. When Q2 begins, the student technically needs a new enrollment request to be placed in the Q2 version of each class. If that request is delayed or rejected, the student has no class assignment — even though they are a fully enrolled student. Grades and attendance have no home.

### 3.3 Section Assignment is Fragile

When an admin approves a Q1 enrollment request, they assign to one class, and the system auto-enrolls the student in "sibling classes" (same section/grade/school_year). This relies on all sibling classes having identical `section`, `grade_level`, and `school_year` values — a brittle string-matching approach that breaks the moment any class has a typo in its section name.

### 3.4 No Differentiation Between Student Types

The current system has no concept of whether a student is:
- Enrolling for the first time (new)
- Re-enrolling after completing the previous year (returning)
- Entering mid-year from another school (transferee)
- Returning after dropping out (returnee)
- Repeating the same grade level (repeater)

These cases require different documentation, different workflows, and different handling of historical records. The current model treats all of them identically.

### 3.5 No Active Period Concept

There is no single source of truth for "what quarter is it right now?" Every module independently infers this from class data or requires the user to select it from a dropdown. If a teacher submits grades for Q1 after Q2 has started, there is no guard against this. If an admin advances to Q2, no module automatically knows.

### 3.6 SHS Semester vs K-10 Quarter Conflation

Grade 11 and 12 students follow a **semester** structure:
- 1st Semester = Q1 + Q2
- 2nd Semester = Q3 + Q4

The current system shows "Quarter 1, 2, 3, 4" uniformly across all grade levels. SHS students should see "1st Semester" and "2nd Semester." Displaying "Quarter" to a Grade 11 student is factually incorrect per DepEd curriculum structure.

---

## 4. Proposed Annual Enrollment Architecture

### 4.1 Core Concept: Three Separated Concerns

```
ADMISSION          ENROLLMENT         ACADEMIC PERIOD
─────────────      ─────────────      ────────────────
Is the student     Assign the         What quarter is
accepted into      student to a       currently active?
the school?        section for        (Admin sets this
                   the school year.   globally, once.)
Happens once       Happens once
per new student.   per school year.
```

### 4.2 The Section as the Unit of Enrollment

The key architectural insight: **students enroll into a SECTION, not individual classes.**

A section (e.g., "Grade 7 — Rizal, SY 2026-2027") is a cohort. All classes for that section across all four quarters are automatically associated with every student in that section.

```
section: "Grade 7 - Rizal" (SY 2026-2027)
  └─ Q1 Classes:  Filipino Q1, Math Q1, Science Q1, English Q1, ...
  └─ Q2 Classes:  Filipino Q2, Math Q2, Science Q2, English Q2, ...
  └─ Q3 Classes:  Filipino Q3, Math Q3, Science Q3, English Q3, ...
  └─ Q4 Classes:  Filipino Q4, Math Q4, Science Q4, English Q4, ...

Student enrolled in section → enrolled in ALL 20+ classes automatically
Teacher submits grades for Math Q1 → student automatically has a grade slot
```

### 4.3 The Active Academic Period as a Global Setting

```
system_settings:
  active_school_year  = "2026-2027"
  active_quarter      = "2"          ← admin sets this
```

Every module reads these two values. Changing `active_quarter` from "1" to "2" instantly advances the entire school:
- Grade entry forms show Q2
- Attendance summaries show Q2 records
- Dashboards show Q2 performance
- Teachers see Q2 class schedules

No per-student or per-class changes required.

### 4.4 New Data Model Overview

```
                     ┌──────────────────┐
                     │ academic_periods  │
                     │ (school_year,     │
                     │  quarter,         │
                     │  is_active,       │
                     │  start_date,      │
                     │  end_date)        │
                     └──────────────────┘
                              ▲
                    reads active period
                              │
┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   sections   │    │enrollment_       │    │   classes    │
│  (per SY,    │◄───│requests          │    │ (per quarter,│
│   grade,     │    │(per student,     │    │  per section)│
│   strand)    │    │ per SY, type)    │    └──────────────┘
└──────┬───────┘    └─────────────────┘           ▲
       │                                          │
       │ enroll student                           │
       ▼                                          │
┌──────────────┐                         ┌────────┴──────┐
│ user_classes │◄────────────────────────│  user_classes │
│ (student →   │  (student added to all  │ (teacher →    │
│  all section │   section's classes)    │  class)       │
│  classes)    │                         └───────────────┘
└──────────────┘
```

### 4.5 Enrollment Type Classification

```
enrollment_type:
  'new'          — first-time enrollee, may require admission documents
  'returning'    — enrolled last year, lighter process
  'transferee'   — coming from another school mid-year or at year start
  'returnee'     — previously dropped out, returning
  'repeater'     — retained in same grade level
```

Each type triggers different document requirements and workflow steps.

---

## 5. Business Rules

### 5.1 Annual Enrollment Rules

**BR-001:** A student may have at most **one approved enrollment** per school year.  
**BR-002:** A student may have at most **one pending enrollment request** at any time.  
**BR-003:** Enrollment for the upcoming school year may open in **March** and close before the start of Q1 (typically June).  
**BR-004:** Approved enrollment assigns the student to a **section**, not individual classes.  
**BR-005:** Section assignment automatically enrolls the student in all subject classes for that section across all four quarters.

### 5.2 Grade Level Progression Rules

**BR-006:** Upon re-enrollment, the system suggests the **next grade level** (current + 1), subject to promotion status.  
**BR-007:** Retained/repeater students are re-enrolled in the **same grade level**.  
**BR-008:** Grade 10 completers must choose a **strand** when enrolling in Grade 11.  
**BR-009:** Grade 12 completers are **not eligible for re-enrollment** (they graduate).

### 5.3 Academic Period Rules

**BR-010:** The active academic period is a **global school setting** — one quarter applies to all students.  
**BR-011:** Only **admin/registrar** may change the active quarter.  
**BR-012:** Advancing the quarter does NOT require students to re-enroll.  
**BR-013:** When the active quarter changes, all modules (grades, attendance, dashboards) automatically reflect the new period.  
**BR-014:** Historical period data (Q1 grades when Q2 is active) remains accessible but is locked for editing.

### 5.4 SHS-Specific Rules

**BR-015:** For Grade 11–12, Q1+Q2 = **1st Semester**, Q3+Q4 = **2nd Semester**.  
**BR-016:** SHS students see semester labels in all UI; quarters are an internal tracking mechanism.  
**BR-017:** A strand change requires admin approval and may require re-assigning to a different section.

### 5.5 Special Enrollment Rules

**BR-018:** Transferees entering mid-year are enrolled at the **currently active quarter**. Prior quarters within the same school year are marked **"Not Applicable — Transferee"** in their records.  
**BR-019:** Returnees (re-entry after dropout) require admin to specify the entry quarter.  
**BR-020:** Late enrollees within the same school year (enrolled after Q1 started) are treated as late entries, not new enrollments.  
**BR-021:** Section capacity limits must be enforced. Admin is warned when a section is at capacity.

### 5.6 Data Integrity Rules

**BR-022:** Approved enrollment records are **immutable** — rejection after approval creates a separate withdrawal record, not a status reversal.  
**BR-023:** Grades submitted for a class in a quarter remain attached to that grade record even if the student later moves sections.  
**BR-024:** All enrollment history per student is preserved indefinitely for transcript generation.

---

## 6. Complete Enrollment Workflow

### 6.1 New Student Enrollment (First Time)

```
PHASE 1: ADMISSION (optional if admin creates account directly)
──────────────────────────────────────────────────────────────
Parent/student → submits admission inquiry
  └─ documents: PSA birth certificate, report card from previous school
Admin reviews → approves admission
  └─ creates student account in users table
  └─ sets role='student', generates student_number

PHASE 2: ENROLLMENT
───────────────────
Student/Parent → navigates to enrollment page
  ├─ selects: school year (auto-filled: next SY)
  ├─ selects: grade level (auto-filled: suggested based on records)
  ├─ selects: strand (only if Grade 11 or 12)
  ├─ enrollment_type: 'new'
  └─ uploads: previous_grades_url (required for new)

  → POST /api/student/enrollment-request
  → creates enrollment_requests row (status: 'pending')

PHASE 3: ADMIN REVIEW
─────────────────────
Admin → /admin/enrollment (sees pending requests list)
  ├─ reviews student info and documents
  ├─ selects available section (from sections table, filtered by grade+SY)
  ├─ system shows section capacity (current enrolled / max)
  └─ approves → PATCH /api/admin/enrollment-requests

  ON APPROVAL:
  ├─ sets enrollment_requests.status = 'approved'
  ├─ sets enrollment_requests.assigned_section_id
  ├─ updates users.grade_level, users.section, users.school_year
  ├─ finds all classes in assigned section (all quarters)
  ├─ inserts student into ALL those classes via user_classes
  └─ sends approval email to student/parent

  ON REJECTION:
  ├─ sets status = 'rejected', records admin_notes
  └─ sends rejection email with reason

PHASE 4: STUDENT IS ENROLLED
─────────────────────────────
Student can now:
  ├─ view class schedule (across all quarters)
  ├─ view active quarter's grades
  ├─ view attendance records
  └─ generate Certificate of Enrollment (COE)
```

### 6.2 Returning Student Re-enrollment

```
TRIGGER: End of Q4, admin marks SY as complete
         → system identifies students with approved enrollment for current SY
         → marks them as eligible for re-enrollment for next SY

Student/Parent → enrollment page shows: "Re-enroll for SY 2027-2028"
  ├─ grade level: auto-filled to current + 1
  ├─ enrollment_type: 'returning'
  ├─ NO need to re-upload admission documents
  └─ OPTIONAL: strand selection if moving to Grade 11

Admin review:
  ├─ lighter process (returning students are known)
  ├─ assigns section
  └─ approves → same flow as new enrollment
```

### 6.3 Transferee Enrollment

```
Student/Parent → enrollment page
  ├─ enrollment_type: 'transferee'
  ├─ previous_school (required)
  ├─ entry_quarter: currently active quarter (auto-filled, admin can override)
  ├─ transfer documents required
  └─ submits request

Admin approval:
  ├─ assigns to section
  ├─ ON APPROVAL — system handles partial enrollment:
  │   ├─ finds all classes in assigned section
  │   ├─ enrolls student in ALL classes (all quarters)
  │   ├─ for quarters BEFORE entry_quarter:
  │   │   └─ creates grade records with status='not_applicable'
  │   │       and notes='Transferee — not enrolled during this period'
  │   └─ for current and future quarters: normal enrollment
  └─ attendance records start from entry date
```

### 6.4 Academic Period Advancement (No Enrollment Action Needed)

```
Admin → /admin/settings/academic-period
  ├─ sees current active period: "Q1 — 2026-2027"
  ├─ clicks "Advance to Q2"
  ├─ system confirms: "All grade entry for Q1 will be locked. Continue?"
  └─ confirms

SYSTEM ACTION:
  ├─ sets system_settings.active_quarter = '2'
  ├─ sets academic_periods row for Q1: { end_date: today, is_active: false }
  ├─ sets academic_periods row for Q2: { start_date: today, is_active: true }
  └─ broadcasts event to connected clients (Supabase Realtime)

NOTHING ELSE CHANGES:
  ├─ all student-class relationships remain intact
  ├─ all grades remain accessible (Q1 grades locked, Q2 grade entry opens)
  ├─ all attendance records remain
  └─ all dashboards immediately show Q2 context
```

---

## 7. Quarter and Semester Management

### 7.1 The `academic_periods` Table

```sql
CREATE TABLE academic_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year TEXT NOT NULL,
  quarter     INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  label       TEXT NOT NULL,            -- "Quarter 1", "First Semester"
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN DEFAULT FALSE,
  is_grading_open BOOLEAN DEFAULT TRUE, -- can teachers submit grades?
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_year, quarter)
);
```

### 7.2 Active Period Resolution

Every API route that needs the current period calls a shared utility:

```typescript
// lib/academic-period.ts
export async function getActivePeriod(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('academic_periods')
    .select('*')
    .eq('is_active', true)
    .single();
  return data;  // { school_year, quarter, label, start_date, end_date }
}

// Fallback: read from system_settings if no active period row
export async function getActiveSchoolYearAndQuarter(supabase: SupabaseClient) {
  const period = await getActivePeriod(supabase);
  if (period) return period;
  // fallback to system_settings
  const { data } = await supabase
    .from('system_settings')
    .select('key, value')
    .in('key', ['active_school_year', 'active_quarter']);
  // ... parse and return
}
```

### 7.3 SHS Semester Display Logic

```typescript
// lib/academic-period.ts
export function getSemesterLabel(quarter: number, gradeLevel: string): string {
  const isSHS = gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12';
  if (!isSHS) return `Quarter ${quarter}`;
  return quarter <= 2 ? '1st Semester' : '2nd Semester';
}

export function getQuartersForSemester(semester: 1 | 2): number[] {
  return semester === 1 ? [1, 2] : [3, 4];
}
```

### 7.4 Grade Lock Behavior

When active quarter advances from Q1 to Q2:
- Q1 grade entry is **locked** (teachers cannot modify)
- Q2 grade entry **opens** for all teachers
- Q1 approved grades remain visible to students/parents
- Q1 pending grades → admin receives batch notification to review

### 7.5 Enrollment Window vs Academic Period

These are independent:

```
Enrollment Window (set by admin):
  enrollment_open_date   e.g., March 1, 2026
  enrollment_close_date  e.g., June 30, 2026

Active Academic Period (set by admin):
  active_school_year     "2026-2027"
  active_quarter         "1"  (advances throughout the year)
```

A student enrolled during the enrollment window begins appearing in classes once Q1 starts (or the active quarter, for transferees).

---

## 8. Edge Cases and Special Scenarios

### 8.1 Repeaters / Retained Students

**Scenario:** A student did not meet promotion requirements and is retained in Grade 7.

```
Handling:
  ├─ enrollment_type = 'repeater'
  ├─ grade_level = 'Grade 7' (same as previous year)
  ├─ system WARNS admin: "Student was enrolled in Grade 7 last year"
  ├─ admin confirms retention
  ├─ approved enrollment assigns to new Grade 7 section
  └─ previous year's Grade 7 records preserved separately
```

**DB impact:** Students can have enrollment_requests with the same grade_level in consecutive school_years — this is valid for repeaters.

### 8.2 Strand Changes (SHS)

**Scenario:** A Grade 11 student in STEM wants to switch to ABM.

```
Handling:
  ├─ Student requests strand change (separate form/workflow)
  ├─ Admin reviews and approves
  ├─ System:
  │   ├─ removes student from all current STEM section classes
  │   ├─ adds student to ABM section classes (same grade, same quarter)
  │   ├─ preserves all grades already submitted in STEM classes
  │   └─ creates audit log entry
  └─ report card shows both strand contexts with change date noted
```

**Note:** Strand changes should be a separate workflow, not a new enrollment request. Add a `section_changes` table to log these.

### 8.3 Section Changes (Same Grade)

**Scenario:** A Grade 5 student moves from Rizal section to Bonifacio section.

```
Handling:
  ├─ Admin triggers section transfer (admin-only action)
  ├─ System:
  │   ├─ removes student from all Rizal section classes
  │   ├─ adds student to all Bonifacio section classes (all quarters)
  │   ├─ preserves all grades (grades are tied to class_id, not section)
  │   └─ attendance records remain (tied to student, not section)
  └─ creates audit log entry
```

### 8.4 Dropouts / Withdrawal

**Scenario:** A student leaves school mid-year.

```
Handling:
  ├─ Admin marks student as 'withdrawn' (new status in users.status)
  ├─ Withdrawal date recorded
  ├─ System:
  │   ├─ removes student from all future-quarter classes
  │   │   (keeps in past/current quarter classes for grade purposes)
  │   ├─ attendance records remain (up to withdrawal date)
  │   └─ generates withdrawal form document
  └─ enrollment_requests status remains 'approved' (it was valid)
  
  enrollment_requests gets new field:
    withdrawal_date (nullable DATE)
    withdrawal_reason (nullable TEXT)
```

### 8.5 Returnees (Re-entry After Dropout)

**Scenario:** A student who dropped out in Q2 of 2025-2026 wants to return for 2026-2027.

```
Handling:
  ├─ enrollment_type = 'returnee'
  ├─ Admin reviews dropout history before approving
  ├─ Grade level may be same (if dropped mid-year) or promoted (if completed year)
  ├─ System allows enrollment as normal
  └─ Historical records from 2025-2026 preserved
```

### 8.6 Multiple Children / Siblings

**Scenario:** Three siblings, all enrolling at once.

```
Handling:
  ├─ Parent submits ONE enrollment request per child
  ├─ System processes independently (each child is a separate student)
  └─ No special handling needed — the existing parent-child relationship model handles this
```

### 8.7 Late Enrollment Within Active School Year

**Scenario:** It is already Q2 (October) and a new student applies.

```
Handling:
  ├─ enrollment_type = 'new' or 'transferee'
  ├─ entry_quarter = 2 (the active quarter)
  ├─ Admin approves → student enrolled in section
  ├─ System:
  │   ├─ adds student to ALL section classes (Q1–Q4)
  │   ├─ Q1 classes: student marked as 'not_applicable' (wasn't there)
  │   └─ Q2–Q4 classes: normal enrollment
  └─ Attendance tracking begins from approval date
```

### 8.8 School Year Rollover

**Scenario:** School year 2025-2026 ends; preparing for 2026-2027.

```
ADMIN ACTIONS (end of Q4):
  1. Lock Q4 grade entry
  2. Run promotion processing:
     ├─ review failed students → flag as 'repeater'
     └─ confirm Grade 12 graduates → mark as 'graduated'
  3. Open enrollment window for 2026-2027
  4. Create sections for 2026-2027 in admin panel
  5. As enrollment requests come in, assign to new sections

NO STUDENT ACTION NEEDED TO PROCEED BETWEEN QUARTERS
Enrollment is only needed at the START of each school year.
```

### 8.9 Summer Classes / Remedial

**Scenario:** Students who failed a subject need summer remediation.

```
This is OUT OF SCOPE for the annual enrollment model.
Summer classes are a separate enrollment event with their own:
  - school_year: "2026-2027-SUMMER" (or a separate period type)
  - limited to specific subjects (remedial)
  
Recommendation: Treat summer as a separate class type (add is_remedial flag to classes).
Do not conflate with regular enrollment.
```

### 8.10 Admin Creates Student Directly

**Scenario:** Registrar has all documents and wants to skip the online request flow.

```
Handling:
  ├─ Admin goes to /admin/students/new
  ├─ Fills in student info
  ├─ Selects: school year, grade level, section, strand
  ├─ System creates:
  │   ├─ users row (student)
  │   ├─ enrollment_requests row (status: 'approved', type: 'new')
  │   └─ user_classes rows for all section classes
  └─ Student receives credentials email
```

---

## 9. Required Backend Changes

### 9.1 New Supabase Tables

#### `academic_periods`
Tracks each quarter in a school year with dates and active status.

```sql
CREATE TABLE academic_periods (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_year     TEXT NOT NULL,
  quarter         INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  label           TEXT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT FALSE,
  is_grading_open BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (school_year, quarter)
);

-- Only one active period at a time (partial unique index)
CREATE UNIQUE INDEX academic_periods_one_active
  ON academic_periods (is_active)
  WHERE is_active = TRUE;
```

#### `sections`
Formalizes the section concept.

```sql
CREATE TABLE sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  grade_level  TEXT NOT NULL,
  strand       TEXT,            -- NULL for K-10
  school_year  TEXT NOT NULL,
  adviser_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  max_capacity INTEGER DEFAULT 45,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, grade_level, school_year)
);
```

#### `enrollment_withdrawals` (new)
Tracks withdrawals without mutating the approved enrollment record.

```sql
CREATE TABLE enrollment_withdrawals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id       UUID NOT NULL REFERENCES enrollment_requests(id),
  student_id          UUID NOT NULL REFERENCES users(id),
  school_year         TEXT NOT NULL,
  withdrawal_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_reason   TEXT,
  processed_by        UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 Modified Tables

#### `enrollment_requests` — column changes

| Column | Action | Details |
|---|---|---|
| `quarter` | **REMOVE** (after migration) | Not part of annual enrollment |
| `enrollment_type` | **ADD** | `'new' \| 'returning' \| 'transferee' \| 'returnee' \| 'repeater'` DEFAULT 'new' |
| `entry_quarter` | **ADD** | `INTEGER NULL` — for late enrollees/transferees |
| `assigned_section_id` | **ADD** | `UUID REFERENCES sections(id)` |
| `assigned_class_id` | **KEEP** (deprecated) | NULL-able; keep for backward compat until full migration |
| `previous_school` | **ADD** | `TEXT NULL` — required for transferees |

#### `system_settings` — new keys

```sql
-- Insert initial active period settings
INSERT INTO system_settings (key, value) VALUES
  ('active_school_year', '2026-2027'),
  ('active_quarter', '1'),
  ('enrollment_open', 'true'),
  ('enrollment_school_year', '2026-2027');
```

#### `classes` — add section reference

```sql
ALTER TABLE classes
  ADD COLUMN section_id UUID REFERENCES sections(id) ON DELETE SET NULL;
```

This links classes to formal sections. The `section` TEXT field is kept for backward compatibility.

### 9.3 New Shared Library

```
lib/
  academic-period.ts     ← getActivePeriod(), getSemesterLabel(), lockQuarter()
  sections.ts            ← getSection(), getSectionClasses()
  enrollment.ts          ← getEnrollmentStatus(), isEligibleForEnrollment()
```

---

## 10. Required Frontend Changes

### 10.1 Student/Parent Enrollment Form

**Remove:**
- Quarter selector (Q1/Q2/Q3/Q4 dropdown)

**Add:**
- Enrollment type indicator ("You are re-enrolling as a returning student")
- Suggested next grade level (with explanation)
- Strand selector for Grade 11 (already exists, keep)
- Previous school field (visible only for transferees)
- Read-only school year display (not a dropdown — one clear value)

**Simplify:**
- The form should be 3–5 fields maximum
- Clear progress: "Submit → Admin Review → Section Assignment → Enrolled"

### 10.2 Admin Enrollment Review Page

**Replace:**
- Class selector → **Section selector** (dropdown showing available sections with capacity)
- Quarter reference → Remove entirely from UI

**Add:**
- Enrollment type badge on each request row
- Capacity indicator per section
- "Direct enroll" shortcut for admin-created students
- Entry quarter override (for transferees)

### 10.3 New: Admin Academic Period Management Page

**Location:** `/admin/settings/academic-period`

**Features:**
- View all four quarters for active school year with dates
- One-click "Advance to Q2" button (with confirmation)
- Lock/unlock grade entry per quarter
- Set enrollment window open/close dates
- School year history (read-only past periods)

### 10.4 Admin Section Management Page

**Location:** `/admin/sections` or within `/admin/classes`

**Features:**
- Create sections per school year and grade level
- Set max capacity and section adviser
- View enrolled student count vs capacity
- Manage sections independent of classes

### 10.5 Teacher Grade Entry

**Change:**
- Current: teacher selects quarter from dropdown in grade entry form
- New: system auto-fills active quarter (read-only); teacher cannot change it
- Past quarters: shown as read-only history

### 10.6 Student/Parent Dashboard

**Change:**
- "Enrolled in Q1" label → "Enrolled — SY 2026-2027"
- Grade tabs: show "Quarter 1 / Quarter 2 / ..." for K-10, "1st Semester / 2nd Semester" for SHS
- Active period shown as a header badge: "Q2 — 2026-2027 | October 2026"

---

## 11. API Changes

### 11.1 New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/admin/academic-periods` | GET | List all periods for active school year |
| `/api/admin/academic-periods` | POST | Create/update period (set dates, open/close) |
| `/api/admin/academic-periods/advance` | POST | Advance to next quarter (atomic) |
| `/api/admin/sections` | GET | List sections (filter by grade, school_year) |
| `/api/admin/sections` | POST | Create section |
| `/api/admin/sections/[id]` | PUT | Update section |
| `/api/admin/sections/[id]/students` | GET | List enrolled students in section |
| `/api/admin/sections/[id]/transfer` | POST | Transfer student between sections |

### 11.2 Modified API Routes

#### `POST /api/student/enrollment-request`

**Remove from payload:**
- `semester` / `quarter` field

**Add to payload:**
- `enrollmentType`: `'new' | 'returning' | 'transferee' | 'returnee' | 'repeater'`
- `previousSchool` (required if type is 'transferee')
- `entryQuarter` (optional; defaults to active quarter for transferees)

**Validation changes:**
- No duplicate pending request per student per school year
- Grade level progression check (warn if repeating same grade)
- For Grade 11/12: strand is required

#### `PATCH /api/admin/enrollment-requests`

**Remove from payload:**
- `classId` (replaced by `sectionId`)

**Add to payload:**
- `sectionId` — UUID of the target section

**Processing change:**
- On approval: find all classes in the section (all quarters), enroll student in all
- For transferees: mark pre-entry-quarter classes as 'not_applicable'

#### `GET /api/student/enrollment`

**Add to response:**
- `activePeriod`: `{ schoolYear, quarter, label, startDate }`
- `section`: `{ id, name, gradeLevel, strand }`
- `allQuarterClasses`: grouped by quarter

#### `GET /api/teacher/grades` and `POST /api/teacher/grades`

**Change:**
- Quarter is no longer supplied by teacher; it is read from `academic_periods` where `is_active = true`
- If teacher tries to submit for a locked quarter, return 403

### 11.3 Deprecated/Removed Routes

| Route | Status | Replacement |
|---|---|---|
| `/api/admin/enrollment-requests` (PATCH with classId) | Deprecated → add sectionId support | Updated route |
| Any route that reads `enrollment_requests.quarter` | Update to use `academic_periods` | Updated routes |

---

## 12. Database Impact Analysis

### 12.1 Schema Change Summary

| Table | Change Type | Risk |
|---|---|---|
| `enrollment_requests` | Add columns (non-breaking); remove `quarter` (breaking, phase 5) | Low initially, Medium in phase 5 |
| `classes` | Add `section_id` column (non-breaking) | Low |
| `system_settings` | Add rows (non-breaking) | None |
| `academic_periods` | New table | None |
| `sections` | New table | None |
| `enrollment_withdrawals` | New table | None |
| `grades` | No schema change (quarter column kept) | None |
| `user_classes` | No schema change | None |
| `class_enrollments` | Dead table — can be dropped after audit | Low |

### 12.2 Foreign Key Impact

The new `enrollment_requests.assigned_section_id` FK requires that sections exist before enrollment requests can reference them. Admin must create sections for the school year before enrollment opens.

### 12.3 Query Impact

| Query pattern | Impact |
|---|---|
| `SELECT ... FROM enrollment_requests WHERE quarter = N` | Will break in Phase 5 when quarter is removed; update all queries in Phase 4 |
| `SELECT ... FROM classes WHERE section = 'Rizal'` | Still works; section text field preserved alongside section_id |
| Grade entry queries that need active quarter | Change to join with `academic_periods WHERE is_active = true` |
| Student dashboard "current quarter" display | Change to read from `system_settings` or `academic_periods` |

---

## 13. Data Migration Strategy

### 13.1 Migration Philosophy

Migrations run in phases aligned with implementation phases. No migration drops existing data until Phase 5 (cleanup), giving a full testing cycle before destructive changes.

### 13.2 Phase 1 Migration: Additive Only

```sql
-- M001: Add academic_periods table
CREATE TABLE academic_periods (...);

-- M002: Seed current academic periods
INSERT INTO academic_periods (school_year, quarter, label, is_active)
VALUES
  ('2025-2026', 1, 'Quarter 1', false),
  ('2025-2026', 2, 'Quarter 2', false),
  ('2025-2026', 3, 'Quarter 3', false),
  ('2025-2026', 4, 'Quarter 4', true),   -- adjust to current reality
  ('2026-2027', 1, 'Quarter 1', false),
  ('2026-2027', 2, 'Quarter 2', false),
  ('2026-2027', 3, 'Quarter 3', false),
  ('2026-2027', 4, 'Quarter 4', false);

-- M003: Add system_settings rows
INSERT INTO system_settings (key, value) VALUES
  ('active_school_year', '2025-2026'),
  ('active_quarter', '4')
ON CONFLICT (key) DO NOTHING;

-- M004: Add sections table
CREATE TABLE sections (...);
```

### 13.3 Phase 2 Migration: Enrollment Request Fields

```sql
-- M005: Add new columns to enrollment_requests
ALTER TABLE enrollment_requests
  ADD COLUMN enrollment_type TEXT DEFAULT 'new'
    CHECK (enrollment_type IN ('new','returning','transferee','returnee','repeater')),
  ADD COLUMN entry_quarter INTEGER CHECK (entry_quarter BETWEEN 1 AND 4),
  ADD COLUMN assigned_section_id UUID REFERENCES sections(id),
  ADD COLUMN previous_school TEXT;

-- M006: Backfill enrollment_type for existing records
-- Existing records with no history: assume 'new' for first-ever
-- Records with prior approval in previous year: assume 'returning'
UPDATE enrollment_requests er
SET enrollment_type = CASE
  WHEN (
    SELECT COUNT(*) FROM enrollment_requests er2
    WHERE er2.student_id = er.student_id
      AND er2.status = 'approved'
      AND er2.school_year < er.school_year
  ) > 0 THEN 'returning'
  ELSE 'new'
END;
```

### 13.4 Phase 3 Migration: Section Seeding and Class Linking

```sql
-- M007: Seed sections from existing class data
INSERT INTO sections (name, grade_level, strand, school_year)
SELECT DISTINCT
  section,
  grade_level,
  NULL as strand,  -- backfill strand separately for SHS
  school_year
FROM classes
WHERE section IS NOT NULL AND section != ''
ON CONFLICT (name, grade_level, school_year) DO NOTHING;

-- M008: Link classes to section_id
UPDATE classes c
SET section_id = s.id
FROM sections s
WHERE c.section = s.name
  AND c.grade_level = s.grade_level
  AND c.school_year = s.school_year;
```

### 13.5 Phase 5 Migration: Cleanup (Destructive — Run After Verification)

```sql
-- M009: Remove quarter from enrollment_requests
-- ONLY RUN AFTER: all code updated, all queries migrated, data verified
ALTER TABLE enrollment_requests DROP COLUMN quarter;

-- M010: Drop class_enrollments (dead table)
DROP TABLE IF EXISTS class_enrollments;
```

---

## 14. Backward Compatibility Considerations

### 14.1 What Continues Working Without Change

- All existing class records (classes table unchanged except new nullable columns)
- All existing grade records (grades table unchanged)
- All existing attendance records (attendance_records unchanged)
- All existing user_classes relationships
- All existing enrollment requests (still have their data; new columns are nullable)
- COE PDF generation (reads from enrollment_requests which still exists)
- Admin class management (class CRUD is unchanged)
- Teacher grade submission (temporarily unchanged during phases 1-3)

### 14.2 What Changes and Requires Coordination

- **Enrollment forms** for students/parents: quarter field disappears; must be deployed before enrollment opens for new SY
- **Admin enrollment approval flow**: must switch to section-based before going live with new SY enrollment
- **Grade entry period control**: teacher form changes must be deployed before Q2 starts to avoid confusion

### 14.3 Avoiding Breaking the Current School Year

Phases 1 and 2 are purely additive. The existing system continues to function in parallel. The new enrollment flow only becomes mandatory for the **next school year's enrollment**. Existing Q4 2025-2026 students are not disrupted.

---

## 15. Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sections not created before enrollment opens | Medium | High — approvals fail | Seed sections in Phase 3; add validation that sections exist |
| Teachers submit grades for wrong quarter | Medium | Medium | Lock grade entry to active quarter; UI makes active quarter prominent |
| Existing data doesn't backfill cleanly | Low | Medium | Phase 2 migration script tested on dev first; manual review of any nulls |
| `class_enrollments` table has undiscovered usages | Low | Medium | Full grep for `class_enrollments` before Phase 5 drop |
| Admin forgets to advance academic period | Medium | Low | Dashboard shows current period prominently with "It's been X days in Q1 — advance to Q2?" prompt |
| Rolling back Phase 5 if `quarter` column was dropped | Low | High | Take DB backup immediately before Phase 5; delay Phase 5 by 2 weeks after full verification |
| SHS semester display breaks for mixed grade sections | Low | Low | `getSemesterLabel()` is a pure function, easy to test |
| `normalizeSchoolYear` misses edge cases | Low | Low | Already in production, well-tested |

---

## 16. Step-by-Step Implementation Plan

### Phase 1: Foundation (No Breaking Changes)
**Goal:** Introduce new concepts without changing any existing behavior.

- [ ] **1.1** Write and run migration M001–M004 (academic_periods, sections tables, system_settings seeding)
- [ ] **1.2** Create `lib/academic-period.ts` with `getActivePeriod()`, `getSemesterLabel()`
- [ ] **1.3** Create `GET /api/admin/academic-periods` — read-only list of periods
- [ ] **1.4** Create `POST /api/admin/academic-periods/advance` — advance quarter with lock
- [ ] **1.5** Build admin academic period UI at `/admin/settings/academic-period`
- [ ] **1.6** Wire all dashboard/grade "current quarter" displays to read from `getActivePeriod()` instead of inferring
- [ ] **1.7** Test: advance quarter in dev, verify all modules show new quarter

### Phase 2: Enrollment Request Refactor
**Goal:** New enrollment requests no longer require a quarter.

- [ ] **2.1** Write and run migrations M005–M006 (add enrollment_type, entry_quarter, etc.)
- [ ] **2.2** Update `POST /api/student/enrollment-request` — remove quarter requirement, add enrollment_type
- [ ] **2.3** Update `POST /api/parent/enrollment-request` — same
- [ ] **2.4** Simplify student enrollment form — remove quarter selector
- [ ] **2.5** Add enrollment type indicator to student/parent form
- [ ] **2.6** Update admin enrollment request list to show enrollment_type badge
- [ ] **2.7** Update `GET /api/admin/enrollment-requests` to not filter by quarter
- [ ] **2.8** Test: submit enrollment request without quarter, verify it stores correctly

### Phase 3: Section-Based Assignment
**Goal:** Admin approves enrollment by assigning to a section, not a class.

- [ ] **3.1** Create `GET /api/admin/sections` and `POST /api/admin/sections`
- [ ] **3.2** Build admin section management UI at `/admin/sections`
- [ ] **3.3** Write and run migrations M007–M008 (seed sections from existing classes, link classes to section_id)
- [ ] **3.4** Update `PATCH /api/admin/enrollment-requests` to accept `sectionId`
- [ ] **3.5** Implement approval logic: find all section classes, enroll in all, handle transferee entry quarter
- [ ] **3.6** Update admin enrollment approval modal to show section selector instead of class selector
- [ ] **3.7** Test: approve enrollment by section, verify student appears in all 4 quarters of section classes

### Phase 4: UI/UX Polish and SHS Semester Display
**Goal:** All UI correctly reflects annual enrollment and SHS semesters.

- [ ] **4.1** Update student enrollment page to show SHS students "1st/2nd Semester" label
- [ ] **4.2** Update grade entry: teachers see active quarter (read-only); past quarters are locked
- [ ] **4.3** Update student dashboard: show "Enrolled — SY 2026-2027" not quarter-specific text
- [ ] **4.4** Update COE PDF to reflect annual enrollment (remove quarter from COE)
- [ ] **4.5** Add section transfer admin action (admin can move student between sections)
- [ ] **4.6** Handle late enrollees: admin sets entry_quarter during approval
- [ ] **4.7** Update all enrollment history views to remove quarter column

### Phase 5: Cleanup (Run After 4 Weeks of Stable Production)
**Goal:** Remove legacy artifacts; clean schema.

- [ ] **5.1** Audit all code for references to `enrollment_requests.quarter` — confirm all replaced
- [ ] **5.2** Audit all code for references to `class_enrollments` — confirm none found
- [ ] **5.3** Take database backup
- [ ] **5.4** Write and run migration M009 (drop enrollment_requests.quarter)
- [ ] **5.5** Write and run migration M010 (drop class_enrollments table)
- [ ] **5.6** Remove backward-compat shims in API routes that accepted `semester` field
- [ ] **5.7** Final end-to-end test with clean enrollment flow

---

## 17. Testing Strategy

### 17.1 Unit Tests (New Utilities)

```typescript
// lib/academic-period.test.ts
describe('getSemesterLabel', () => {
  it('returns "Quarter 1" for Grade 7 Q1', ...)
  it('returns "1st Semester" for Grade 11 Q1', ...)
  it('returns "1st Semester" for Grade 11 Q2', ...)
  it('returns "2nd Semester" for Grade 12 Q3', ...)
});

describe('getActivePeriod', () => {
  it('returns the single active period', ...)
  it('returns null if no active period', ...)
});
```

### 17.2 Integration Tests (API Routes)

**Enrollment submission (new):**
- Submit without quarter → 200 OK, enrollment_requests row created
- Submit without strand for Grade 11 → 400 Bad Request
- Submit second request while one is pending → 409 Conflict

**Enrollment approval (new):**
- Approve with valid sectionId → student in all section classes, users.section updated
- Approve transferee entering Q2 → Q1 classes marked not_applicable
- Approve without valid sectionId → 400 Bad Request

**Academic period advance:**
- Advance from Q1 to Q2 → academic_periods updated, system_settings updated
- Advance beyond Q4 → 400 Bad Request (next school year must be configured)

### 17.3 End-to-End Test Scenarios

| Scenario | Steps | Verification |
|---|---|---|
| New student annual enrollment | Submit request → Admin approves → check classes | Student in all 4 quarter classes |
| Returning student re-enrollment | Submit returning request → Admin approves | Same flow, enrollment_type='returning' |
| Transferee Q2 entry | Submit transferee request → Admin approves with entry_quarter=2 | Q1 classes not_applicable, Q2–Q4 active |
| Quarter advance | Admin advances Q1→Q2 | Teacher grade form shows Q2; Q1 locked |
| SHS semester display | Grade 11 student views schedule | Shows "1st Semester" not "Quarter 1/2" |

### 17.4 Regression Tests

Ensure all existing flows still work after each phase:
- [ ] Admin can still create and edit classes
- [ ] Teacher can still submit grades (for active quarter)
- [ ] Attendance RFID scans still record correctly
- [ ] COE PDF still generates
- [ ] Parent can still view child's enrollment status
- [ ] Population reports still work (filter by school year)

---

## 18. Future Extensibility

### 18.1 Multiple Active School Years

The `academic_periods` and `sections` tables are keyed by `school_year`, making it straightforward to support running two school years simultaneously (e.g., continuing school offers both regular and advanced SY tracks).

### 18.2 Grading Period Customization

`academic_periods` can store `start_date`/`end_date`, enabling future features like:
- Calendar view of academic year
- Automatic quarter advancement based on date
- Grade submission deadline enforcement

### 18.3 Formal Admission Workflow

The current system creates student accounts manually or via enrollment request. A future admission module can precede enrollment:
- Admission application (separate from enrollment)
- Document upload and review
- Admission decision → triggers account creation
- Student then completes enrollment

The enrollment types (`new`, `returning`, etc.) already anticipate this separation.

### 18.4 DepEd SF Integration

The formal `sections` table and clean annual enrollment data make it straightforward to generate DepEd School Form data:
- SF1: School Register (all enrolled students per section)
- SF5: Report on Promotion (based on enrollment history and grades)
- SF10: Permanent Record (cumulative enrollment and grade history)

### 18.5 Tuition / Billing Integration

Annual enrollment as a single event maps cleanly to billing:
- One enrollment → one tuition assessment per school year
- Billing broken into payment schedules (quarterly or monthly)
- This is currently out of scope but the enrollment record is the natural trigger for billing creation

### 18.6 Online Enrollment Open/Close Window

The `system_settings` keys `enrollment_open` and `enrollment_school_year` can drive:
- Public enrollment page that is inaccessible outside the window
- Countdown timer showing when enrollment opens
- Automatic closure at deadline

---

*End of Document*

---

**Next Step:** Review this plan. Once approved, begin implementation with Phase 1 (additive migrations and the academic period management UI). No existing data or code is at risk in Phase 1. It can be deployed and tested in production independently before any enrollment-facing changes are made.
