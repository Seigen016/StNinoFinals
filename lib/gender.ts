export type Gender = 'Male' | 'Female';

// Canonical stored value for gender input; accepts "male", "M", " Female " etc.
// Anything else (including '') means not specified → null.
export function normalizeGender(raw: unknown): Gender | null {
  const g = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (g === 'male' || g === 'm') return 'Male';
  if (g === 'female' || g === 'f') return 'Female';
  return null;
}
