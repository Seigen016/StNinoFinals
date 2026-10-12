import { describe, expect, it } from 'vitest';
import { normalizeGender } from '../lib/gender';

describe('normalizeGender', () => {
  it('maps common spellings to the stored value', () => {
    expect(normalizeGender('male')).toBe('Male');
    expect(normalizeGender(' F ')).toBe('Female');
    expect(normalizeGender('Female')).toBe('Female');
  });

  it('returns null for blank or unknown input', () => {
    expect(normalizeGender('')).toBeNull();
    expect(normalizeGender('unspecified')).toBeNull();
    expect(normalizeGender(1)).toBeNull();
    expect(normalizeGender(undefined)).toBeNull();
  });
});
