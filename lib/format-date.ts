// One readable date style for the whole app: "January 1, 2026".
// ponytail: always formats in Asia/Manila (the school's timezone), so a browser
// set to another timezone still sees the school's calendar day.
const TIMEZONE = 'Asia/Manila';

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  // Date-only strings ("2026-01-01") are calendar days, not instants: pin them
  // to noon UTC so no timezone can shift them to the previous/next day.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** "January 1, 2026" (fallback when empty/invalid) */
export function formatDate(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  const tz = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'UTC' : TIMEZONE;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: tz });
}

/** "8:30 AM" */
export function formatTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TIMEZONE });
}

/** "January 1, 2026, 8:30 AM" */
export function formatDateTime(value: DateInput, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/** "January 1, 2026 – January 31, 2026", or a single date when both ends match */
export function formatDateRange(from: DateInput, to: DateInput, fallback = '—'): string {
  const start = formatDate(from, '');
  const end = formatDate(to, '');
  if (!start) return fallback;
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}
