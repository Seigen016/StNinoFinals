'use client';

import { useEffect, useState } from 'react';

// School year tab bar shared by admin list pages. value '' means all years
// (only offered when allowAll). Selects the active year on first load unless
// startOnAll, for pages where upcoming-year rows matter (enrollment).
export function SchoolYearTabs({
  value,
  onChange,
  allowAll = true,
  startOnAll = false,
  onActiveYear,
}: {
  value: string;
  onChange: (schoolYear: string) => void;
  allowAll?: boolean;
  startOnAll?: boolean;
  onActiveYear?: (schoolYear: string) => void;
}) {
  const [years, setYears] = useState<string[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    fetch('/api/admin/school-years')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setYears(d.years);
        setActive(d.active);
        onActiveYear?.(d.active);
        if (!value && !startOnAll) onChange(d.active);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (years.length === 0) return null;

  const tabs = [...(allowAll ? [{ key: '', label: 'All' }] : []), ...years.map((y) => ({ key: y, label: y }))];

  return (
    <div role="tablist" aria-label="School year" className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((t) => {
        const selected = value === t.key;
        return (
          <button
            key={t.key || 'all'}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={`shrink-0 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
              selected ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            {t.key === active && <span className="ml-1.5 text-[10px] font-medium text-green-700">Current</span>}
          </button>
        );
      })}
    </div>
  );
}
