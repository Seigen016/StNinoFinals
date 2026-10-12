'use client';

import { supabase } from "@/lib/supabaseClient";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export interface User {
    id: string;
    email: string;
    role?: string;
    first_name?: string;
    last_name?: string;
}

interface UserContextType {
    user: User | null;
}

const UserContext = createContext<UserContextType | null>(null);

// Keys the custom portals use to store session in localStorage
const ROLE_STORAGE_KEYS: { key: string; role: string }[] = [
    { key: 'student',  role: 'student'  },
    { key: 'teacher',  role: 'teacher'  },
    { key: 'admin',    role: 'admin'    },
    { key: 'parent',   role: 'parent'   },
];

function getUserFromLocalStorage(): User | null {
    try {
        for (const { key, role } of ROLE_STORAGE_KEYS) {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const data = JSON.parse(raw);
            if (data?.id) {
                return {
                    id:         String(data.id),
                    email:      data.email      || '',
                    role,
                    first_name: data.first_name || undefined,
                    last_name:  data.last_name  || undefined,
                };
            }
        }
    } catch { /* ignore parse errors */ }
    return null;
}

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // 1. Try localStorage first (custom portal auth)
        const localUser = getUserFromLocalStorage();
        if (localUser) {
            setUser(localUser);
            return;
        }

        // 2. Fall back to Supabase JWT session (standard auth)
        supabase.auth.getUser().then(({ data, error }) => {
            if (error || !data.user) { setUser(null); return; }
            supabase
                .from('users')
                .select('id, email, role, first_name, last_name')
                .eq('id', data.user.id)
                .single()
                .then(({ data: profile }) => {
                    if (profile) {
                        setUser({
                            id:         profile.id,
                            email:      profile.email ?? data.user!.email ?? '',
                            role:       profile.role ?? undefined,
                            first_name: profile.first_name ?? undefined,
                            last_name:  profile.last_name  ?? undefined,
                        });
                    } else {
                        setUser({ id: data.user!.id, email: data.user!.email || '' });
                    }
                });
        });
    }, []); // run once on mount

    return (
        <UserContext.Provider value={{ user }}>
            {children}
        </UserContext.Provider>
    );
}

/**
 * Custom hook to access user authentication state
 * Must be used within a UserProvider component
 * 
 * @returns UserContextType containing user state
 * @throws Error if used outside UserProvider
 */
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return ctx;
}