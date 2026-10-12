import { describe, expect, it } from 'vitest';
import { parseScheduleTime, timesOverlap } from '../lib/rooms';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ROOM SCHEDULE PARSING
// ─────────────────────────────────────────────────────────────────────────────
describe('parseScheduleTime', () => {
  it('parses "MWF 08:00 - 09:00" correctly', () => {
    const result = parseScheduleTime('MWF 08:00 - 09:00');
    expect(result).toEqual({ start: 480, end: 540 });
  });

  it('parses "TTh 13:30 - 15:00"', () => {
    const result = parseScheduleTime('TTh 13:30 - 15:00');
    expect(result).toEqual({ start: 810, end: 900 });
  });

  it('parses schedule with em-dash separator', () => {
    const result = parseScheduleTime('MWF 07:00 – 08:30');
    expect(result).toEqual({ start: 420, end: 510 });
  });

  it('returns null for empty string', () => {
    expect(parseScheduleTime('')).toBeNull();
  });

  it('returns null for schedule with no time', () => {
    expect(parseScheduleTime('MWF')).toBeNull();
  });

  it('returns null for garbage input', () => {
    expect(parseScheduleTime('Room 101')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TIME OVERLAP DETECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('timesOverlap', () => {
  // 08:00–09:00 vs 08:30–09:30 → OVERLAP (starts in the middle)
  it('detects partial overlap', () => {
    expect(timesOverlap({ start: 480, end: 540 }, { start: 510, end: 570 })).toBe(true);
  });

  // 08:00–09:00 vs 09:00–10:00 → NO OVERLAP (back-to-back, not overlapping)
  it('no overlap when back-to-back', () => {
    expect(timesOverlap({ start: 480, end: 540 }, { start: 540, end: 600 })).toBe(false);
  });

  // 08:00–10:00 vs 08:30–09:30 → OVERLAP (fully contained)
  it('detects full containment as overlap', () => {
    expect(timesOverlap({ start: 480, end: 600 }, { start: 510, end: 570 })).toBe(true);
  });

  // 08:00–09:00 vs 10:00–11:00 → NO OVERLAP
  it('no overlap when completely separate', () => {
    expect(timesOverlap({ start: 480, end: 540 }, { start: 600, end: 660 })).toBe(false);
  });

  // 10:00–11:00 vs 08:00–09:00 → NO OVERLAP (reversed order)
  it('no overlap reversed', () => {
    expect(timesOverlap({ start: 600, end: 660 }, { start: 480, end: 540 })).toBe(false);
  });

  // Same exact time → OVERLAP
  it('detects identical times as overlap', () => {
    expect(timesOverlap({ start: 480, end: 540 }, { start: 480, end: 540 })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONFLICT DETECTION END-TO-END (parse + overlap combined)
// ─────────────────────────────────────────────────────────────────────────────
describe('Room conflict detection (parse + overlap)', () => {
  function hasConflict(newSchedule: string, existingSchedule: string): boolean {
    const a = parseScheduleTime(newSchedule);
    const b = parseScheduleTime(existingSchedule);
    if (!a || !b) return false;
    return timesOverlap(a, b);
  }

  it('conflicts when same time slot', () => {
    expect(hasConflict('MWF 08:00 - 09:00', 'TTh 08:00 - 09:00')).toBe(true);
  });

  it('conflicts when partially overlapping', () => {
    expect(hasConflict('MWF 08:00 - 09:30', 'MWF 09:00 - 10:00')).toBe(true);
  });

  it('no conflict when consecutive', () => {
    expect(hasConflict('MWF 08:00 - 09:00', 'MWF 09:00 - 10:00')).toBe(false);
  });

  it('no conflict when completely different times', () => {
    expect(hasConflict('MWF 08:00 - 09:00', 'TTh 13:00 - 14:00')).toBe(false);
  });

  it('returns false when schedule is unparseable', () => {
    expect(hasConflict('No time here', 'MWF 08:00 - 09:00')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GRADE COLOR CODING (≥75 = passing/yellow, <75 = failing/red)
// ─────────────────────────────────────────────────────────────────────────────
describe('Grade passing threshold', () => {
  const isPassing = (grade: number) => grade >= 75;

  it('75 is passing', () => expect(isPassing(75)).toBe(true));
  it('100 is passing', () => expect(isPassing(100)).toBe(true));
  it('74 is failing', () => expect(isPassing(74)).toBe(false));
  it('0 is failing', () => expect(isPassing(0)).toBe(false));
  it('74.9 is failing', () => expect(isPassing(74.9)).toBe(false));
  it('75.0 is passing', () => expect(isPassing(75.0)).toBe(true));
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ALPHANUMERIC PASSWORD VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
describe('Alphanumeric password validation', () => {
  const isValidPassword = (pw: string) =>
    pw.length >= 8 && /(?=.*[a-zA-Z])(?=.*\d)/.test(pw);

  it('accepts valid alphanumeric password', () => {
    expect(isValidPassword('abc12345')).toBe(true);
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('hello123world')).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    expect(isValidPassword('abc123')).toBe(false);
    expect(isValidPassword('ab1')).toBe(false);
  });

  it('rejects all-letter password (no digit)', () => {
    expect(isValidPassword('abcdefgh')).toBe(false);
    expect(isValidPassword('PasswordOnly')).toBe(false);
  });

  it('rejects all-digit password (no letter)', () => {
    expect(isValidPassword('12345678')).toBe(false);
    expect(isValidPassword('99999999')).toBe(false);
  });

  it('rejects empty password', () => {
    expect(isValidPassword('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PHONE NUMBER FORMAT (+63 / PH validation)
// ─────────────────────────────────────────────────────────────────────────────
describe('Philippine phone number validation', () => {
  const isValidPhone = (phone: string) =>
    /^(\+63\d{10}|0\d{10}|\d{10,11})$/.test(phone);

  it('accepts +63XXXXXXXXXX (13 chars)', () => {
    expect(isValidPhone('+639171234567')).toBe(true);
    expect(isValidPhone('+639991234567')).toBe(true);
  });

  it('accepts 09XXXXXXXXX (11 digits)', () => {
    expect(isValidPhone('09171234567')).toBe(true);
    expect(isValidPhone('09991234567')).toBe(true);
  });

  it('rejects +63 with wrong digit count', () => {
    expect(isValidPhone('+6391712345')).toBe(false);   // only 9 digits after +63
    expect(isValidPhone('+639171234567890')).toBe(false); // too many digits
  });

  it('rejects numbers with letters', () => {
    expect(isValidPhone('+63917abcdefg')).toBe(false);
    expect(isValidPhone('0917XXXXXXX')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });

  it('rejects plain +63 with no digits', () => {
    expect(isValidPhone('+63')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. QUARTER LABEL (semester renamed to quarter)
// ─────────────────────────────────────────────────────────────────────────────
describe('Quarter label display', () => {
  const quarterLabel = (n: number) => `Quarter ${n}`;
  const shortLabel = (n: number) => `Q${n}`;

  it('produces correct full labels', () => {
    expect(quarterLabel(1)).toBe('Quarter 1');
    expect(quarterLabel(2)).toBe('Quarter 2');
    expect(quarterLabel(3)).toBe('Quarter 3');
    expect(quarterLabel(4)).toBe('Quarter 4');
  });

  it('produces correct short labels', () => {
    expect(shortLabel(1)).toBe('Q1');
    expect(shortLabel(4)).toBe('Q4');
  });
});
