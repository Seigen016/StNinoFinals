'use client';

import { normalizeGender } from '@/lib/gender';
import { useState } from 'react';

// Inline gender picker for admin user tables: saves on change, so filling in
// missing genders is one click per row instead of opening the edit dialog.
export function GenderCell({
  resource,
  userId,
  value,
  onSaved,
}: {
  resource: 'students' | 'teachers' | 'parents';
  userId: string;
  value: string | null | undefined;
  onSaved: (gender: string | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = normalizeGender(value) ?? '';

  const save = async (next: string) => {
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/admin/${resource}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: next }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error);
      onSaved(next || null);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={current}
      disabled={saving}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => save(e.target.value)}
      aria-label="Gender"
      title={failed ? 'Could not save, try again' : undefined}
      className={`text-[12px] rounded-md border px-1.5 py-0.5 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50 ${
        failed ? 'border-red-300 text-red-700' : current ? 'border-gray-200 text-gray-700' : 'border-amber-200 text-amber-700'
      }`}
    >
      <option value="">—</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    </select>
  );
}
