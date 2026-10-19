import { describe, expect, it } from 'vitest';
import { formatDate, formatDateRange, formatDateTime } from '../lib/format-date';

describe('formatDate', () => {
  it('formats date-only strings without shifting the day', () => {
    expect(formatDate('2026-01-01')).toBe('January 1, 2026');
  });

  it('formats timestamps in Manila time', () => {
    // 20:00 UTC Dec 31 = 4:00 AM Jan 1 in Manila
    expect(formatDate('2025-12-31T20:00:00Z')).toBe('January 1, 2026');
    expect(formatDateTime('2025-12-31T20:00:00Z')).toBe('January 1, 2026, 4:00 AM');
  });

  it('falls back on empty or invalid input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not a date', 'N/A')).toBe('N/A');
  });

  it('formats ranges', () => {
    expect(formatDateRange('2026-01-01', '2026-01-31')).toBe('January 1, 2026 – January 31, 2026');
    expect(formatDateRange('2026-01-01', '2026-01-01')).toBe('January 1, 2026');
  });
});
