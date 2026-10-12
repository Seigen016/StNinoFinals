'use client';

import { useEffect, useMemo, useState } from 'react';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface TableControlsConfig<T> {
  searchFields: (keyof T & string)[];
  defaultSort?: SortState;
  pageSize?: number;
}

export interface TableControls<T> {
  rows: T[];
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  totalCount: number;
  filteredCount: number;
  search: string;
  setSearch: (s: string) => void;
  sort: SortState | null;
  toggleSort: (key: string) => void;
  filters: Record<string, string>;
  setFilter: (key: string, val: string) => void;
  clearFilters: () => void;
  pageSize: number;
  setPageSize: (n: number) => void;
}

export function useTableControls<T extends Record<string, any>>(
  data: T[],
  config: TableControlsConfig<T>,
): TableControls<T> {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState | null>(config.defaultSort ?? null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pageSize ?? 25);

  // Reset to page 1 whenever search / filters / sort change
  useEffect(() => { setPage(1); }, [search, filters, sort, pageSize]);

  const processed = useMemo(() => {
    let rows = [...data];

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) =>
        config.searchFields.some((field) => {
          const val = row[field];
          return val != null && String(val).toLowerCase().includes(q);
        }),
      );
    }

    // Filters
    Object.entries(filters).forEach(([key, val]) => {
      if (val) {
        rows = rows.filter((row) => String(row[key] ?? '') === val);
      }
    });

    // Sort
    if (sort) {
      rows.sort((a, b) => {
        const av = a[sort.key] ?? '';
        const bv = b[sort.key] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return rows;
  }, [data, search, filters, sort, config.searchFields]);

  const totalCount = data.length;
  const filteredCount = processed.length;
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  const setFilter = (key: string, val: string) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
  };

  return {
    rows,
    page: safePage,
    setPage,
    pageCount,
    totalCount,
    filteredCount,
    search,
    setSearch,
    sort,
    toggleSort,
    filters,
    setFilter,
    clearFilters,
    pageSize,
    setPageSize,
  };
}
