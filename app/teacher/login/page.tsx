'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TeacherLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=teacher');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800" />
    </div>
  );
}
