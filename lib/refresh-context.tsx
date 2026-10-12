'use client';

import { supabase } from '@/lib/supabaseClient';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface RefreshContextValue {
  refreshKey: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextValue>({
  refreshKey: 0,
  triggerRefresh: () => {},
  isRefreshing: false,
});

const WATCHED_TABLES = [
  'users',
  'enrollment_requests',
  'grades',
  'attendance_records',
  'announcements',
  'classes',
  'class_enrollments',
  'user_classes',
  'admissions',
  'class_subjects',
  'rooms',
];

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsRefreshing(false), 800);
  }, []);

  useEffect(() => {
    const channels = WATCHED_TABLES.map((table) =>
      supabase
        .channel(`realtime:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => triggerRefresh()
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [triggerRefresh]);

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh, isRefreshing }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
