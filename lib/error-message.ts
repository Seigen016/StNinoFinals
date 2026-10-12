// Turns Supabase / Postgres / network failures into something a student, parent or
// staff member can actually act on. Raw `error.message` text ("violates foreign key
// constraint ...", "Could not find the 'address' column ... in the schema cache") is
// never shown to a user — it is logged instead.

// ponytail: only the codes this app actually hits. Add a row when a new one shows up in logs.
const BY_CODE: Record<string, string> = {
  '23505': 'This record already exists.',
  '23503': 'Some of the linked information no longer exists. Please refresh the page and try again.',
  '23502': 'A required field is missing. Please complete all fields and try again.',
  '23514': 'Some of the information does not meet the school’s requirements. Please review your entries.',
  '22P02': 'Some of the information is in the wrong format. Please check your entries and try again.',
  '22001': 'One of your entries is too long. Please shorten it and try again.',
  // Missing column / table / stale PostgREST schema cache — a pending database update.
  '42703': 'The system is missing a recent database update. Please contact the school administrator.',
  '42P01': 'The system is missing a recent database update. Please contact the school administrator.',
  PGRST204: 'The system is missing a recent database update. Please contact the school administrator.',
  PGRST116: 'We could not find that record. Please refresh the page and try again.',
  '42501': 'You do not have permission to do that. Please contact the school administrator.',
};

const OFFLINE = 'You appear to be offline. Check your internet connection and try again.';
const UNREACHABLE = 'We could not reach the server. Check your internet connection and try again.';

/**
 * @param fallback what to show when the cause is unknown — write it for the user,
 *   e.g. "We could not submit your enrollment request. Please try again in a moment."
 */
export function friendlyError(err: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return OFFLINE;

  const e = (typeof err === 'object' && err !== null ? err : {}) as {
    code?: string;
    message?: string;
  };

  if (e.code && BY_CODE[e.code]) return BY_CODE[e.code];

  const message = e.message || (typeof err === 'string' ? err : '');
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) return UNREACHABLE;
  if (/schema cache/i.test(message)) return BY_CODE.PGRST204;
  if (/row-level security|not authorized|permission denied/i.test(message)) return BY_CODE['42501'];
  if (/exceeded the maximum allowed size|payload too large/i.test(message)) {
    return 'That file is too large. Please upload a smaller file and try again.';
  }

  return fallback;
}
