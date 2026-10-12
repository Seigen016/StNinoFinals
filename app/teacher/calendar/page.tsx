'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar, ChevronDownIcon, Clock } from 'lucide-react';
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

export default function TeacherCalendar() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Get day name from date
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  };

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

  // Fetch schedule for selected date
  useEffect(() => {
    if (teacher && teacher.id) {
      fetchSchedule();
    }
  }, [selectedDate, teacher]);

  const fetchSchedule = async () => {
    if (!teacher || !teacher.id) return;

    try {
      const response = await fetch(
        `/api/teacher/schedule?teacherId=${teacher.id}&date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

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
          <CardTitle className="text-red-800">Daily Class Schedule</CardTitle>
          <CardDescription>
            View your class schedule timeline for the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="flex flex-col gap-3 mb-6">
              <Label htmlFor="schedule-date" className="text-sm font-medium">
                Select Date
              </Label>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="schedule-date"
                      className="w-64 justify-between font-normal border-red-200 hover:bg-red-50"
                    >
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <CalendarComponent
                      mode="single"
                      selected={
                        selectedDate ? new Date(selectedDate) : new Date()
                      }
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          // Format date in local timezone to avoid off-by-one errors
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(
                            2,
                            '0'
                          );
                          const day = String(date.getDate()).padStart(2, '0');
                          setSelectedDate(`${year}-${month}-${day}`);
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {getDayName(selectedDate)}
                </Badge>
              </div>
            </div>

            {/* Timeline */}
            {schedule.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200"></div>

                {/* Schedule items */}
                <div className="space-y-6">
                  {schedule.map((item, index) => (
                    <div
                      key={item.id}
                      className="relative flex items-start gap-4"
                    >
                      {/* Time indicator */}
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center text-white font-semibold shadow-lg">
                          <div className="text-center">
                            <div className="text-xs leading-tight">
                              {item.timeStart}
                            </div>
                            <div className="text-xs leading-tight">-</div>
                            <div className="text-xs leading-tight">
                              {item.timeEnd}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Schedule card */}
                      <Card className="flex-1 ml-4 border-l-4 border-l-red-800 shadow-md">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-500 mb-1">
                                Subject
                              </div>
                              <div className="text-lg font-semibold text-red-800">
                                {item.subject}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">
                                Room Number
                              </div>
                              <div className="text-lg font-semibold">
                                {item.room}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 mb-1">
                                Section
                              </div>
                              <div className="text-lg font-semibold">
                                {item.section}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>
                              Duration: {item.timeStart} - {item.timeEnd}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  No classes scheduled for {getDayName(selectedDate)}
                </p>
                <p className="text-sm text-gray-500">
                  Select a different date to view your schedule
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
