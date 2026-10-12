import { describe, expect, it } from 'vitest';
import { friendlyError } from '../lib/error-message';

const FALLBACK = 'We could not submit your enrollment request. Please try again in a moment.';

describe('friendlyError', () => {
  it('never leaks raw Postgres text', () => {
    const pg = {
      code: '23503',
      message:
        'insert or update on table "enrollment_requests" violates foreign key constraint "enrollment_requests_student_id_fkey"',
    };
    const out = friendlyError(pg, FALLBACK);
    expect(out).not.toMatch(/constraint|violates|fkey/i);
    expect(out).toMatch(/refresh the page/i);
  });

  it('maps a stale schema cache to a pending database update', () => {
    const out = friendlyError(
      { code: 'PGRST204', message: "Could not find the 'address' column of 'admissions' in the schema cache" },
      FALLBACK
    );
    expect(out).toMatch(/database update/i);
    expect(out).not.toMatch(/schema cache/i);
  });

  it('recognises a dropped connection', () => {
    expect(friendlyError(new TypeError('Failed to fetch'), FALLBACK)).toMatch(
      /internet connection/i
    );
  });

  it('turns an RLS denial into a permission message', () => {
    expect(
      friendlyError({ message: 'new row violates row-level security policy' }, FALLBACK)
    ).toMatch(/permission/i);
  });

  it('falls back for anything it does not recognise', () => {
    expect(friendlyError(new Error('kaboom'), FALLBACK)).toBe(FALLBACK);
    expect(friendlyError(null, FALLBACK)).toBe(FALLBACK);
    expect(friendlyError(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
