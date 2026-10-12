// Philippine address split the way the admission form collects it.
// City and municipality are the same administrative level, so one field.
export interface AddressParts {
  street: string;
  barangay: string;
  city: string;
  province: string;
}

export const EMPTY_ADDRESS: AddressParts = { street: '', barangay: '', city: '', province: '' };

const LABELS: Record<keyof AddressParts, string> = {
  street: 'House No./Street',
  barangay: 'Barangay',
  city: 'City/Municipality',
  province: 'Province',
};

export function formatAddress(a: AddressParts): string {
  return [a.street, a.barangay && `Brgy. ${a.barangay}`, a.city, a.province]
    .map((p) => (p || '').trim())
    .filter(Boolean)
    .join(', ');
}

// Labels of the blank fields, for "Required: ..." messages
export function missingAddressFields(a: Partial<AddressParts> | null | undefined): string[] {
  return (Object.keys(LABELS) as (keyof AddressParts)[])
    .filter((k) => !(a?.[k] || '').trim())
    .map((k) => LABELS[k]);
}

// Coerces untrusted input (request bodies) into trimmed string parts
export function normalizeAddress(raw: unknown): AddressParts {
  const r = (raw ?? {}) as Record<string, unknown>;
  const part = (k: keyof AddressParts) => (typeof r[k] === 'string' ? (r[k] as string).trim() : '');
  return { street: part('street'), barangay: part('barangay'), city: part('city'), province: part('province') };
}
