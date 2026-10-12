'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Teacher {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

export default function TeacherSettings() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  // Check if teacher is logged in
  useEffect(() => {
    const storedTeacher = localStorage.getItem('teacher');
    if (!storedTeacher) {
      router.push('/login?role=teacher');
      return;
    }

    try {
      const teacherData = JSON.parse(storedTeacher);
      setTeacher(teacherData);
    } catch (error) {
      console.error('Error parsing stored teacher data:', error);
      localStorage.removeItem('teacher');
      router.push('/login?role=teacher');
    }
  }, [router]);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold text-red-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Settings panel will be available here.
              </p>
              <p className="text-sm text-gray-500">
                Configure your account preferences and notification settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
