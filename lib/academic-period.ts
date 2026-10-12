import { normalizeSchoolYear } from './school-year';
import { getSupabaseAdmin } from './supabaseAdmin';

export type PeriodStatus = 'active' | 'ended' | 'upcoming';

export interface AcademicPeriod {
  id: string;
  schoolYear: string;
  quarter: number;
  label: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isGradingOpen: boolean;
  /** Computed from start/end dates vs. today — not a stored column. */
  status: PeriodStatus;
}

const TIMEZONE = 'Asia/Manila';

/**
 * Today's date as YYYY-MM-DD in the app's configured timezone. Plain ISO date
 * strings compare correctly with lexicographic `<`/`>`, so no Date-object
 * timezone arithmetic is needed anywhere else in this file.
 */
export function getTodayISO(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Pure date-range status for one period. Returns null when the period has no
 * dates configured (admin hasn't filled them in yet) — callers fall back to
 * the manually-toggled `is_active` flag in that case.
 */
export function computeStatus(
  period: { startDate: string | null; endDate: string | null },
  todayISO: string
): PeriodStatus | null {
  if (!period.startDate || !period.endDate) return null;
  if (todayISO < period.startDate) return 'upcoming';
  if (todayISO > period.endDate) return 'ended';
  return 'active';
}

/**
 * Given every quarter of a school year (each already carrying a computed
 * `status`), picks the one the whole system should treat as "current":
 *  - whichever quarter's date range contains today, or otherwise
 *  - the most recently ended quarter, kept as "current" but marked Ended —
 *    this is the gap between quarters (previous one closed, next hasn't
 *    started yet).
 * Returns null when nothing has started yet or no period has dates.
 */
export function pickCurrentPeriod(periods: AcademicPeriod[]): AcademicPeriod | null {
  const active = periods.find((p) => p.status === 'active');
  if (active) return active;

  const ended = periods.filter((p) => p.status === 'ended');
  if (ended.length === 0) return null;
  return ended.reduce((latest, p) => (p.quarter > latest.quarter ? p : latest));
}

/**
 * Returns the academic period the whole system should currently show.
 * Computed fresh from `start_date`/`end_date` on every call — the same
 * answer for every user/session, no admin action or cache involved. Falls
 * back to the manually-toggled `is_active` flag only when dates aren't
 * configured yet (pre-migration / not-yet-set-up schools).
 */
export async function getActivePeriod(now: Date = new Date()): Promise<AcademicPeriod | null> {
  const supabase = getSupabaseAdmin();

  const { data } = await supabase
    .from('academic_periods')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (data) {
    const flagged = rowToAcademicPeriod(data, now);
    const allQuarters = await getPeriodsForYear(flagged.schoolYear, now);
    const computed = pickCurrentPeriod(allQuarters);
    // Fall back to the raw flag when no quarter has dates yet, or when today
    // is before the school year's first configured start date.
    return computed ?? flagged;
  }

  // Fallback: derive from system_settings
  const { data: rows } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['active_school_year', 'active_quarter']);

  if (!rows || rows.length === 0) return null;

  const map: Record<string, string> = {};
  for (const r of rows) map[r.setting_key] = r.setting_value ?? '';

  const schoolYear = map['active_school_year'];
  const quarter = parseInt(map['active_quarter'] || '1', 10);
  if (!schoolYear || !quarter) return null;

  return {
    id: '',
    schoolYear,
    quarter,
    label: `Quarter ${quarter}`,
    startDate: null,
    endDate: null,
    isActive: true,
    isGradingOpen: true,
    status: 'active',
  };
}

/**
 * Returns all four periods for the given school year, ordered by quarter,
 * each carrying a computed `status`.
 */
export async function getPeriodsForYear(schoolYear: string, now: Date = new Date()): Promise<AcademicPeriod[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('academic_periods')
    .select('*')
    .eq('school_year', schoolYear)
    .order('quarter', { ascending: true });

  return (data || []).map((row) => rowToAcademicPeriod(row, now));
}

/**
 * Returns the display label for the active quarter, formatted for the given
 * student's grade level.  Grade 11/12 → "1st Semester" or "2nd Semester".
 * All other levels → "Quarter N".
 */
export function getSemesterLabel(quarter: number, gradeLevel: string): string {
  if (isSeniorHigh(gradeLevel)) {
    return quarter <= 2 ? '1st Semester' : '2nd Semester';
  }
  return `Quarter ${quarter}`;
}

/**
 * Returns both quarters that make up the given SHS semester.
 * semester 1 → [1, 2],  semester 2 → [3, 4]
 */
export function getQuartersForSemester(semester: 1 | 2): [number, number] {
  return semester === 1 ? [1, 2] : [3, 4];
}

function isSeniorHigh(gradeLevel: string | null | undefined): boolean {
  return gradeLevel === 'Grade 11' || gradeLevel === 'Grade 12';
}

/**
 * Whether a grade belongs to the current grading window, i.e. is not archived:
 * same school year, and for Grades 11–12 the active semester, for every other
 * level the active quarter. A missing quarter or school year (legacy rows) is
 * treated as current so nothing silently disappears.
 */
export function isCurrentPeriodGrade(
  grade: { quarter: number | null; schoolYear: string | null; gradeLevel: string | null },
  active: { quarter: number; schoolYear: string }
): boolean {
  if (grade.schoolYear && normalizeSchoolYear(grade.schoolYear) !== active.schoolYear) return false;
  if (grade.quarter == null) return true;
  if (isSeniorHigh(grade.gradeLevel)) {
    return getQuartersForSemester(active.quarter <= 2 ? 1 : 2).includes(grade.quarter);
  }
  return grade.quarter === active.quarter;
}

// ─── internal ────────────────────────────────────────────────────────────────

function rowToAcademicPeriod(row: any, now: Date = new Date()): AcademicPeriod {
  const startDate = row.start_date ?? null;
  const endDate = row.end_date ?? null;
  return {
    id: row.id,
    schoolYear: row.school_year,
    quarter: row.quarter,
    label: row.label,
    startDate,
    endDate,
    isActive: row.is_active,
    isGradingOpen: row.is_grading_open,
    status: computeStatus({ startDate, endDate }, getTodayISO(now)) ?? 'active',
  };
}
