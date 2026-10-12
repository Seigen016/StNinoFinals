'use client';

import { useRefresh } from '@/lib/refresh-context';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  className?: string;
}

export function RefreshButton({ className }: RefreshButtonProps) {
  const { triggerRefresh, isRefreshing } = useRefresh();

  return (
    <button
      type="button"
      onClick={triggerRefresh}
      title="Refresh data"
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
        'text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors',
        className
      )}
    >
      <RefreshCw
        className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')}
      />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
