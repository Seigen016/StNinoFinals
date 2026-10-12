/**
 * Philippine school year: starts June, ends April.
 *
 * getActiveSchoolYear()     — for grades, classes, reports, attendance
 *   Jan–May  → (year-1)–year
 *   Jun–Dec  → year–(year+1)
 *
 * getEnrollmentSchoolYear() — for enrollment requests
 *   Jan–Feb  → (year-1)–year   (finishing current SY)
 *   Mar–Dec  → year–(year+1)   (preparing for next SY)
 *
 * getSchoolYearOptions()    — returns [currentSY, nextSY] for dropdowns
 */

export function getActiveSchoolYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  return month >= 6
    ? `${year}-${year + 1}`
    : `${year - 1}-${year}`;
}

export function getEnrollmentSchoolYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month <= 2
    ? `${year - 1}-${year}`
    : `${year}-${year + 1}`;
}

/**
 * Returns [currentSY, nextSY] — always two options for dropdowns.
 * e.g. in Jan 2026 → ["2025-2026", "2026-2027"]
 */
export function getSchoolYearOptions(date: Date = new Date()): string[] {
  const current = getActiveSchoolYear(date);
  const [start] = current.split('-').map(Number);
  const next = `${start + 1}-${start + 2}`;
  return [current, next];
}

/**
 * Converts bare-year values (e.g. "2026") to the YYYY-YYYY format ("2026-2027").
 * Already-formatted values like "2025-2026" are returned unchanged.
 */
export function normalizeSchoolYear(raw: string): string {
  if (!raw) return raw;
  if (/^\d{4}-\d{4}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) {
    const y = parseInt(raw, 10);
    return `${y}-${y + 1}`;
  }
  return raw;
}
