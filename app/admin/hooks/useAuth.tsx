'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import type { Admin } from '../types';

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('admin');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!admin);

  useEffect(() => {
    // If we already have admin from cache, skip fetching
    if (admin) {
      setLoading(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Auth error:', error);
          localStorage.removeItem('admin');
          window.location.href = '/login?role=admin';
          return;
        }

        if (!data.user) {
          localStorage.removeItem('admin');
          window.location.href = '/login?role=admin';
          return;
        }

        const { data: adminData, error: adminError } = await supabase
          .from('users')
          .select('*')
          .eq('email', data.user.email || '')
          .eq('role', 'admin')
          .single();

        if (adminError || !adminData) {
          console.error('Admin check error:', adminError);
          localStorage.removeItem('admin');
          window.location.href = '/login?role=admin';
          return;
        }

        setAdmin(adminData as Admin);
        localStorage.setItem('admin', JSON.stringify(adminData));
      } catch (error) {
        console.error('Unexpected error:', error);
        localStorage.removeItem('admin');
        window.location.href = '/login?role=admin';
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { admin, loading };
}
