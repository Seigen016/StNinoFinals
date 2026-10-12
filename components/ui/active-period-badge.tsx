'use client';

import { useEffect, useState } from 'react';

interface Period {
  schoolYear: string;
  quarter: number;
  status: 'active' | 'ended' | 'upcoming';
}

export function ActivePeriodBadge() {
  const [period, setPeriod] = useState<Period | null>(null);

  useEffect(() => {
    fetch('/api/active-period')
      .then((r) => r.json())
      .then((d) => { if (d.success) setPeriod({ schoolYear: d.schoolYear, quarter: d.quarter, status: d.status }); })
      .catch(() => {});
  }, []);

  if (!period) return null;

  const ended = period.status === 'ended';

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        ended ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ended ? 'bg-amber-500' : 'bg-green-500 animate-pulse'}`} />
      A.Y. {period.schoolYear} &nbsp;·&nbsp; Quarter {period.quarter}
      {ended && <span className="font-semibold">· Ended</span>}
    </span>
  );
}
