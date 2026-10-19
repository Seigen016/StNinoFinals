import { describe, expect, it } from 'vitest';
import { birthDateError, nameCase, nameCaseFields } from '../lib/person';

describe('nameCase', () => {
  it('capitalizes each word', () => {
    expect(nameCase('juan DELA cruz')).toBe('Juan Dela Cruz');
    expect(nameCase('  maria   clara ')).toBe('Maria Clara');
  });

  it('handles hyphens, apostrophes and ñ', () => {
    expect(nameCase('santos-reyes')).toBe('Santos-Reyes');
    expect(nameCase("o'neil")).toBe("O'Neil");
    expect(nameCase('ñino')).toBe('Ñino');
  });

  it('leaves missing values alone', () => {
    expect(nameCase(undefined)).toBeUndefined();
    expect(nameCaseFields({ first_name: 'ana', email: 'A@B.COM' }, ['first_name', 'last_name'])).toEqual({
      first_name: 'Ana',
      email: 'A@B.COM',
    });
  });
});

describe('birthDateError', () => {
  const now = new Date('2026-10-19T00:00:00Z');

  it('accepts 2021 and earlier in 2026', () => {
    expect(birthDateError('2021-12-31', now)).toBeNull();
    expect(birthDateError('2010-05-01', now)).toBeNull();
  });

  it('rejects 2022 onwards in 2026', () => {
    expect(birthDateError('2022-01-01', now)).toBe('Applicants must be born in 2021 or earlier.');
    expect(birthDateError('2026-03-01', now)).not.toBeNull();
  });
});
