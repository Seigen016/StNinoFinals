import { describe, expect, it } from 'vitest';
import { formatAddress, missingAddressFields, normalizeAddress } from '../lib/address';

describe('address helpers', () => {
  const full = { street: 'Blk 23 Lt 20 Pacific Town', barangay: 'Luciano', city: 'Trece Martires City', province: 'Cavite' };

  it('formats all parts in order', () => {
    expect(formatAddress(full)).toBe('Blk 23 Lt 20 Pacific Town, Brgy. Luciano, Trece Martires City, Cavite');
  });

  it('skips blank parts', () => {
    expect(formatAddress({ ...full, street: ' ', barangay: '' })).toBe('Trece Martires City, Cavite');
  });

  it('lists missing fields, treating whitespace as blank', () => {
    expect(missingAddressFields(full)).toEqual([]);
    expect(missingAddressFields({ ...full, city: '  ' })).toEqual(['City/Municipality']);
    expect(missingAddressFields(undefined)).toHaveLength(4);
  });
});

describe('normalizeAddress', () => {
  it('trims strings and blanks out non-strings', () => {
    expect(normalizeAddress({ street: ' 1 Main ', barangay: 5, city: null })).toEqual({
      street: '1 Main',
      barangay: '',
      city: '',
      province: '',
    });
    expect(normalizeAddress(undefined)).toEqual({ street: '', barangay: '', city: '', province: '' });
  });
});
