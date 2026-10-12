'use client';

import { cn } from '@/lib/utils';
import { SortState } from '@/hooks/use-table-controls';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

interface SortHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortState | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortHeader({ label, sortKey, currentSort, onSort, className }: SortHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const dir = isActive ? currentSort!.dir : null;

  return (
    <th
      className={cn(
        'px-4 py-2.5 text-left whitespace-nowrap select-none cursor-pointer group',
        className,
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span className={cn(
          'text-[11px] font-semibold uppercase tracking-wider transition-colors',
          isActive ? 'text-gray-700' : 'text-gray-400 group-hover:text-gray-600',
        )}>
          {label}
        </span>
        <span className={cn(
          'transition-colors',
          isActive ? 'text-gray-700' : 'text-gray-300 group-hover:text-gray-400',
        )}>
          {dir === 'asc'  ? <ArrowUp   className="w-3 h-3" /> :
           dir === 'desc' ? <ArrowDown  className="w-3 h-3" /> :
                            <ArrowUpDown className="w-3 h-3" />}
        </span>
      </div>
    </th>
  );
}
