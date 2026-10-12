'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  filteredCount: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}

const PAGE_SIZES = [10, 25, 50, 100];

function pageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

export function Pagination({
  page,
  pageCount,
  totalCount,
  filteredCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const from = Math.min((page - 1) * pageSize + 1, filteredCount);
  const to = Math.min(page * pageSize, filteredCount);
  const pages = pageRange(page, pageCount);
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">

      {/* Left: count */}
      <p className="text-[11px] text-gray-400">
        {filteredCount === 0 ? 'No results' : `${from}–${to} of ${filteredCount}`}
        {isFiltered && (
          <span className="ml-1 text-gray-300">(filtered from {totalCount})</span>
        )}
      </p>

      {/* Right: page size + pages */}
      <div className="flex items-center gap-3">

        {/* Page size */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-[11px] text-gray-600 bg-transparent border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Pages */}
        {pageCount > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {pages.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-[11px] text-gray-300 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    'min-w-[24px] h-6 px-1.5 rounded text-[11px] font-medium transition-colors',
                    p === page
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
                  )}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === pageCount}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
