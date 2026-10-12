import { describe, expect, it } from 'vitest';
import {
  computeStatus,
  getTodayISO,
  isCurrentPeriodGrade,
  pickCurrentPeriod,
  type AcademicPeriod,
} from '../lib/academic-period';

function period(
  quarter: number,
  startDate: string | null,
  endDate: string | null,
  status: AcademicPeriod['status']
): AcademicPeriod {
  return {
    id: `q${quarter}`,
    schoolYear: '2026-2027',
    quarter,
    label: `Quarter ${quarter}`,
    startDate,
    endDate,
    isActive: false,
    isGradingOpen: true,
    status,
  };
}

// Quarter 1: Jun 1 – Aug 31, Quarter 2: Sep 1 – Nov 30 (no gap, from the brief's first example)
const noGapQ1 = { startDate: '2026-06-01', endDate: '2026-08-31' };
const noGapQ2 = { startDate: '2026-09-01', endDate: '2026-11-30' };

// Quarter 1: Jun 1 – Aug 31, Quarter 2: Sep 10 – Nov 30 (with a 9-day gap)
const gapQ1 = { startDate: '2026-06-01', endDate: '2026-08-31' };
const gapQ2 = { startDate: '2026-09-10', endDate: '2026-11-30' };

// ─────────────────────────────────────────────────────────────────────────────
// computeStatus
// ─────────────────────────────────────────────────────────────────────────────
describe('computeStatus', () => {
  it('is active while today is within [start, end]', () => {
    expect(computeStatus(noGapQ1, '2026-06-01')).toBe('active'); // start boundary
    expect(computeStatus(noGapQ1, '2026-07-15')).toBe('active'); // mid-range
    expect(computeStatus(noGapQ1, '2026-08-31')).toBe('active'); // end boundary, inclusive
  });

  it('is ended once today passes the end date', () => {
    expect(computeStatus(noGapQ1, '2026-09-01')).toBe('ended');
    expect(computeStatus(noGapQ1, '2030-01-01')).toBe('ended');
  });

  it('is upcoming before the start date', () => {
    expect(computeStatus(noGapQ1, '2026-05-31')).toBe('upcoming');
  });

  it('returns null when dates are not configured', () => {
    expect(computeStatus({ startDate: null, endDate: '2026-08-31' }, '2026-06-01')).toBeNull();
    expect(computeStatus({ startDate: '2026-06-01', endDate: null }, '2026-06-01')).toBeNull();
    expect(computeStatus({ startDate: null, endDate: null }, '2026-06-01')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pickCurrentPeriod — the actual quarter-transition logic
// ─────────────────────────────────────────────────────────────────────────────
describe('pickCurrentPeriod', () => {
  it('picks the quarter whose range contains today (active before end date)', () => {
    const periods = [
      period(1, noGapQ1.startDate, noGapQ1.endDate, computeStatus(noGapQ1, '2026-08-31')!),
      period(2, noGapQ2.startDate, noGapQ2.endDate, computeStatus(noGapQ2, '2026-08-31')!),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(1);
    expect(result?.status).toBe('active');
  });

  it('transitions to the next quarter exactly on its start date, no gap case', () => {
    const today = '2026-09-01';
    const periods = [
      period(1, noGapQ1.startDate, noGapQ1.endDate, computeStatus(noGapQ1, today)!),
      period(2, noGapQ2.startDate, noGapQ2.endDate, computeStatus(noGapQ2, today)!),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(2);
    expect(result?.status).toBe('active');
  });

  it('the day before the boundary, the old quarter is still active', () => {
    const today = '2026-08-31';
    const periods = [
      period(1, noGapQ1.startDate, noGapQ1.endDate, computeStatus(noGapQ1, today)!),
      period(2, noGapQ2.startDate, noGapQ2.endDate, computeStatus(noGapQ2, today)!),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(1);
    expect(result?.status).toBe('active');
  });

  it('shows the previous quarter as Ended during a gap, with no active quarter', () => {
    const today = '2026-09-05'; // Q1 ended Aug 31, Q2 starts Sep 10 — mid-gap
    const periods = [
      period(1, gapQ1.startDate, gapQ1.endDate, computeStatus(gapQ1, today)!),
      period(2, gapQ2.startDate, gapQ2.endDate, computeStatus(gapQ2, today)!),
    ];
    expect(periods.find((p) => p.status === 'active')).toBeUndefined(); // no active quarter at all
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(1);
    expect(result?.status).toBe('ended');
  });

  it('automatically transitions to Q2 exactly on the gap-quarter start date', () => {
    const today = '2026-09-10';
    const periods = [
      period(1, gapQ1.startDate, gapQ1.endDate, computeStatus(gapQ1, today)!),
      period(2, gapQ2.startDate, gapQ2.endDate, computeStatus(gapQ2, today)!),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(2);
    expect(result?.status).toBe('active');
  });

  it('one day before the gap-quarter starts, still shows the ended quarter', () => {
    const today = '2026-09-09';
    const periods = [
      period(1, gapQ1.startDate, gapQ1.endDate, computeStatus(gapQ1, today)!),
      period(2, gapQ2.startDate, gapQ2.endDate, computeStatus(gapQ2, today)!),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(1);
    expect(result?.status).toBe('ended');
  });

  it('picks the most recently ended quarter across a full year of gaps (Q1, Q2 both ended)', () => {
    const periods = [
      period(1, '2026-06-01', '2026-08-31', 'ended'),
      period(2, '2026-09-10', '2026-11-30', 'ended'),
      period(3, '2026-12-10', '2027-02-28', 'upcoming'),
    ];
    const result = pickCurrentPeriod(periods);
    expect(result?.quarter).toBe(2); // the latest one to have ended, not Q1
    expect(result?.status).toBe('ended');
  });

  it('returns null before the school year has started (only upcoming quarters)', () => {
    const periods = [
      period(1, '2026-06-01', '2026-08-31', 'upcoming'),
      period(2, '2026-09-01', '2026-11-30', 'upcoming'),
    ];
    expect(pickCurrentPeriod(periods)).toBeNull();
  });

  it('returns null when there are no periods at all', () => {
    expect(pickCurrentPeriod([])).toBeNull();
  });

  it('is deterministic across repeated calls (same input → same output for every caller)', () => {
    const today = '2026-09-05';
    const periods = [
      period(1, gapQ1.startDate, gapQ1.endDate, computeStatus(gapQ1, today)!),
      period(2, gapQ2.startDate, gapQ2.endDate, computeStatus(gapQ2, today)!),
    ];
    const first = pickCurrentPeriod(periods);
    const second = pickCurrentPeriod(periods);
    expect(first).toEqual(second);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTodayISO — timezone handling
// ─────────────────────────────────────────────────────────────────────────────
describe('getTodayISO', () => {
  it('uses Asia/Manila (UTC+8), not the host machine/UTC calendar day', () => {
    // 2026-09-30T20:00:00Z is already 2026-10-01 04:00 in Manila (UTC+8).
    const utcLateEvening = new Date('2026-09-30T20:00:00Z');
    expect(getTodayISO(utcLateEvening)).toBe('2026-10-01');
  });

  it('does not roll over early: 2026-09-30T15:59:00Z is still 2026-09-30 23:59 in Manila', () => {
    const utcAfternoon = new Date('2026-09-30T15:59:00Z');
    expect(getTodayISO(utcAfternoon)).toBe('2026-09-30');
  });
});

describe('isCurrentPeriodGrade', () => {
  const q2 = { quarter: 2, schoolYear: '2026-2027' };
  const q3 = { quarter: 3, schoolYear: '2026-2027' };
  const g = (quarter: number | null, gradeLevel: string, schoolYear: string | null = '2026-2027') => ({
    quarter,
    gradeLevel,
    schoolYear,
  });

  it('junior high: only the active quarter is current', () => {
    expect(isCurrentPeriodGrade(g(2, 'Grade 8'), q2)).toBe(true);
    expect(isCurrentPeriodGrade(g(1, 'Grade 8'), q2)).toBe(false);
  });

  it('senior high: both quarters of the active semester are current', () => {
    expect(isCurrentPeriodGrade(g(1, 'Grade 11'), q2)).toBe(true);
    expect(isCurrentPeriodGrade(g(2, 'Grade 12'), q3)).toBe(false);
    expect(isCurrentPeriodGrade(g(4, 'Grade 12'), q3)).toBe(true);
  });

  it('other school years are archived, legacy year format included', () => {
    expect(isCurrentPeriodGrade(g(2, 'Grade 8', '2025-2026'), q2)).toBe(false);
    expect(isCurrentPeriodGrade(g(2, 'Grade 8', '2026'), q2)).toBe(true);
  });

  it('rows missing quarter or school year stay visible', () => {
    expect(isCurrentPeriodGrade(g(null, 'Grade 8'), q2)).toBe(true);
    expect(isCurrentPeriodGrade(g(2, 'Grade 8', null), q2)).toBe(true);
  });
});
