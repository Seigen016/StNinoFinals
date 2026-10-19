// Shared rules for people records (students, teachers, parents).

/**
 * "juan DELA cruz" → "Juan Dela Cruz"; capitalizes after spaces, hyphens and
 * apostrophes ("santos-reyes" → "Santos-Reyes", "o'neil" → "O'Neil").
 * Returns non-strings (undefined/null) untouched so partial updates still work.
 */
export function nameCase<T>(value: T): T {
  if (typeof value !== 'string') return value;
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase()) as T;
}

/** Name fields that get name-cased on every create/edit API. */
export const NAME_FIELDS = ['first_name', 'middle_name', 'last_name', 'suffix', 'parent_name', 'guardian_name'];

/** Name-cases the name fields present on a body (first/middle/last/suffix). */
export function nameCaseFields<T extends Record<string, any>>(body: T, fields: string[]): T {
  const out: Record<string, any> = { ...body };
  for (const f of fields) if (f in out) out[f] = nameCase(out[f]);
  return out as T;
}

/** Youngest accepted applicant: Kinder age (5). */
export const MIN_ENROLL_AGE = 5;

/** Latest accepted birth year, e.g. 2021 in 2026. Moves with the calendar. */
export function latestBirthYear(now: Date = new Date()): number {
  return now.getFullYear() - MIN_ENROLL_AGE;
}

/** null when the birth date is acceptable, otherwise a user-facing error. */
export function birthDateError(dateOfBirth: string | null | undefined, now: Date = new Date()): string | null {
  if (!dateOfBirth) return null;
  const year = Number(String(dateOfBirth).slice(0, 4));
  if (!Number.isInteger(year)) return 'Please enter a valid date of birth.';
  const max = latestBirthYear(now);
  if (year > max) return `Applicants must be born in ${max} or earlier.`;
  return null;
}
