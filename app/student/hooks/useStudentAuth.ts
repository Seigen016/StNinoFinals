'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Student {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  student_number?: string;
  grade_level?: string;
  section?: string;
  [key: string]: any;
}

export function useStudentAuth() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedStudent = localStorage.getItem('student');

    if (!storedStudent) {
      router.push('/login?role=student');
      setIsLoading(false);
      return;
    }

    try {
      const studentData = JSON.parse(storedStudent);
      setStudent(studentData);
    } catch (error) {
      console.error('Error parsing student data:', error);
      localStorage.removeItem('student');
      router.push('/login?role=student');
    }

    setIsLoading(false);
  }, [router]);

  return { student, setStudent, isLoading };
}
