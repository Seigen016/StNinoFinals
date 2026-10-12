'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useState } from 'react';
import { useStudentAuth } from '../hooks/useStudentAuth';

// Calendar of Activities Data
interface CalendarActivity {
  date: string; // Format: "YYYY-MM-DD"
  title: string;
  category:
    | 'academic'
    | 'event'
    | 'holiday'
    | 'test'
    | 'workshop'
    | 'celebration'
    | 'other';
}

const calendarActivities: CalendarActivity[] = [
  // June 2025
  { date: '2025-06-16', title: 'Brigada Eskwela', category: 'event' },
  { date: '2025-06-17', title: 'Brigada Eskwela', category: 'event' },
  { date: '2025-06-18', title: 'Brigada Eskwela', category: 'event' },
  { date: '2025-06-19', title: 'Brigada Eskwela', category: 'event' },
  { date: '2025-06-20', title: 'Brigada Eskwela', category: 'event' },
  {
    date: '2025-06-23',
    title: 'SNDPALPH Workshop and Seminar',
    category: 'workshop',
  },
  {
    date: '2025-06-24',
    title: 'SNDPALPH Workshop and Seminar',
    category: 'workshop',
  },
  {
    date: '2025-06-25',
    title: 'SNDPALPH Workshop and Seminar',
    category: 'workshop',
  },
  {
    date: '2025-06-26',
    title: 'Orientation of Student Manual',
    category: 'event',
  },
  { date: '2025-06-27', title: 'TEAM BUILDING', category: 'event' },
  {
    date: '2025-06-30',
    title: 'Grade 11 (SHS) Orientation',
    category: 'event',
  },
  // July 2025
  {
    date: '2025-07-01',
    title: 'Junior High School and Grade 12 (SHS) Orientation',
    category: 'event',
  },
  {
    date: '2025-07-02',
    title: 'Elementary, Junior HS and Grade 11 Orientation',
    category: 'event',
  },
  {
    date: '2025-07-03',
    title: 'Kinder to Junior HS and Grade 12 Orientation',
    category: 'event',
  },
  {
    date: '2025-07-04',
    title: 'Start of Regular Classes',
    category: 'academic',
  },
  { date: '2025-07-07', title: 'ID Picture Taking', category: 'event' },
  { date: '2025-07-08', title: 'ID Picture Taking', category: 'event' },
  { date: '2025-07-09', title: 'ID Picture Taking', category: 'event' },
  { date: '2025-07-10', title: 'ID Picture Taking', category: 'event' },
  { date: '2025-07-11', title: 'ID Picture Taking', category: 'event' },
  {
    date: '2025-07-12',
    title: 'Training for Campus Journalism',
    category: 'workshop',
  },
  { date: '2025-07-14', title: 'Dental Check-Up', category: 'event' },
  { date: '2025-07-15', title: 'Dental Check-Up', category: 'event' },
  { date: '2025-07-16', title: 'Dental Check-Up', category: 'event' },
  { date: '2025-07-17', title: 'Dental Check-Up', category: 'event' },
  { date: '2025-07-18', title: 'Dental Check-Up', category: 'event' },
  { date: '2025-07-21', title: 'Worksheet No. 1', category: 'academic' },
  { date: '2025-07-22', title: 'Worksheet No. 1', category: 'academic' },
  { date: '2025-07-23', title: 'Worksheet No. 1', category: 'academic' },
  { date: '2025-07-24', title: 'Worksheet No. 1', category: 'academic' },
  { date: '2025-07-25', title: 'Worksheet No. 1', category: 'academic' },
  // August 2025
  {
    date: '2025-08-04',
    title: 'FIRST QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-08-05',
    title: 'FIRST QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-08-06',
    title: 'FIRST QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-08-07',
    title: 'FIRST QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-08-08',
    title: 'FIRST QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-08-12',
    title: 'Elimination Round for Quiz Bee',
    category: 'event',
  },
  {
    date: '2025-08-13',
    title: 'Elimination Round for Quiz Bee',
    category: 'event',
  },
  {
    date: '2025-08-16',
    title: 'Orientation for SHS Work Immersion',
    category: 'event',
  },
  { date: '2025-08-18', title: 'Interprivate 2025', category: 'event' },
  { date: '2025-08-19', title: 'Interprivate 2025', category: 'event' },
  { date: '2025-08-20', title: 'PEAC SEMINAR', category: 'workshop' },
  {
    date: '2025-08-22',
    title: 'CPAPS Campus Journalism (Elem)',
    category: 'event',
  },
  {
    date: '2025-08-23',
    title: 'Final Round for Quiz Bee',
    category: 'event',
  },
  { date: '2025-08-25', title: 'PEAC INSET (JHS)', category: 'workshop' },
  {
    date: '2025-08-26',
    title: 'CPAPS Campus Journalism (JHS/SHS)',
    category: 'event',
  },
  {
    date: '2025-08-28',
    title: 'Language Month Celebration for Junior and Senior High',
    category: 'celebration',
  },
  {
    date: '2025-08-29',
    title: 'Language Month Celebration for Kinder and Elementary',
    category: 'celebration',
  },
  // September 2025
  {
    date: '2025-09-01',
    title: 'FIRST QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-09-02',
    title: 'FIRST QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-09-03',
    title: 'FIRST QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-09-04',
    title: 'FIRST QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-09-05',
    title: 'FIRST QUARTER TEST - PART II',
    category: 'test',
  },
  { date: '2025-09-06', title: 'City Meet', category: 'event' },
  { date: '2025-09-08', title: 'City Meet', category: 'event' },
  { date: '2025-09-09', title: 'City Meet', category: 'event' },
  { date: '2025-09-10', title: "DR. GALICIA'S DAY", category: 'celebration' },
  {
    date: '2025-09-11',
    title: 'Initial Interview for SGO Party-list',
    category: 'event',
  },
  {
    date: '2025-09-12',
    title: 'Initial Interview for SGO Party-list',
    category: 'event',
  },
  {
    date: '2025-09-13',
    title: 'Initial Interview for SGO Party-list',
    category: 'event',
  },
  { date: '2025-09-15', title: 'Campaign Period for SGO', category: 'event' },
  { date: '2025-09-16', title: 'Campaign Period for SGO', category: 'event' },
  { date: '2025-09-17', title: 'Campaign Period for SGO', category: 'event' },
  {
    date: '2025-09-20',
    title: 'Career Orientation for Grade 12',
    category: 'event',
  },
  {
    date: '2025-09-22',
    title: 'Submission of 2nd Quarter Test - Part I',
    category: 'academic',
  },
  {
    date: '2025-09-23',
    title: 'Submission of 2nd Quarter Test - Part I',
    category: 'academic',
  },
  {
    date: '2025-09-24',
    title: 'FIRST PARENTS TEACHERS CONFERENCE',
    category: 'event',
  },
  { date: '2025-09-25', title: 'Class Pictorial', category: 'event' },
  {
    date: '2025-09-26',
    title: 'School Festival of Talent (SFOT) - Elementary',
    category: 'celebration',
  },
  {
    date: '2025-09-27',
    title: 'School Festival of Talent (SFOT) - High School',
    category: 'celebration',
  },
  {
    date: '2025-09-29',
    title: 'SECOND QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-09-30',
    title: 'SECOND QUARTER TEST - PART I',
    category: 'test',
  },
  // October 2025
  {
    date: '2025-10-01',
    title: 'SECOND QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-10-02',
    title: 'SECOND QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-10-03',
    title: 'SECOND QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-10-10',
    title: "SNDPALPH TEACHER'S DAY CELEBRATION",
    category: 'celebration',
  },
  { date: '2025-10-15', title: 'Investiture Practice', category: 'event' },
  { date: '2025-10-16', title: 'Investiture Practice', category: 'event' },
  { date: '2025-10-17', title: 'CPAPS DFOK (JHS/SHS)', category: 'event' },
  { date: '2025-10-18', title: 'Investiture', category: 'event' },
  {
    date: '2025-10-21',
    title: 'Kinder Leadership Training',
    category: 'workshop',
  },
  { date: '2025-10-22', title: 'Star and Kab Scout', category: 'event' },
  { date: '2025-10-23', title: 'Girl and Boy Scout', category: 'event' },
  {
    date: '2025-10-24',
    title: 'JHS and SHS Leadership Training',
    category: 'workshop',
  },
  // November 2025
  { date: '2025-11-03', title: 'Resume of Classes', category: 'academic' },
  { date: '2025-11-07', title: 'Reading Evaluation', category: 'test' },
  {
    date: '2025-11-10',
    title: 'SECOND QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-11-11',
    title: 'SECOND QUARTER TEST - PART II',
    category: 'test',
  },
  { date: '2025-11-12', title: 'CPAPS JHS DEOK 2025', category: 'event' },
  {
    date: '2025-11-13',
    title: 'SECOND QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-11-14',
    title: 'SECOND QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2025-11-17',
    title: 'Elimination for Science Quiz Bee',
    category: 'event',
  },
  {
    date: '2025-11-25',
    title: 'SNDPA-LPH EDUCATIONAL TOUR',
    category: 'event',
  },
  {
    date: '2025-11-28',
    title: 'SECOND PARENTS TEACHERS CONFERENCE',
    category: 'event',
  },
  {
    date: '2025-11-29',
    title: 'Final Round for Science Quiz Bee',
    category: 'event',
  },
  // December 2025
  {
    date: '2025-12-08',
    title: 'THIRD QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-12-09',
    title: 'THIRD QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-12-10',
    title: 'THIRD QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-12-11',
    title: 'THIRD QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-12-12',
    title: 'THIRD QUARTER TEST - PART I',
    category: 'test',
  },
  {
    date: '2025-12-13',
    title: 'PARENTS TEACHERS GRATITUDE NIGHT',
    category: 'event',
  },
  { date: '2025-12-18', title: 'CHRISTMAS CONCERT', category: 'celebration' },
  {
    date: '2025-12-19',
    title: 'PRAGANIANS CHRISTMAS PARTY',
    category: 'celebration',
  },
  {
    date: '2025-12-20',
    title: 'FACULTY AND STAFF CHRISTMAS PARTY',
    category: 'celebration',
  },
  {
    date: '2025-12-22',
    title: 'START OF CHRISTMAS BREAK',
    category: 'holiday',
  },
  // January 2026
  { date: '2026-01-05', title: 'RESUMPTION OF CLASSES', category: 'academic' },
  {
    date: '2026-01-06',
    title: 'Elimination for Spelling Bee',
    category: 'event',
  },
  {
    date: '2026-01-10',
    title: 'Final Round for Spelling Bee',
    category: 'event',
  },
  {
    date: '2026-01-12',
    title: 'Elimination for Spelling Bee',
    category: 'event',
  },
  { date: '2026-01-16', title: 'CPAPS I-Spell', category: 'event' },
  {
    date: '2026-01-17',
    title: 'Final Round for Spelling Bee',
    category: 'event',
  },
  { date: '2026-01-19', title: 'Graduation Pictorial', category: 'event' },
  { date: '2026-01-20', title: 'Graduation Pictorial', category: 'event' },
  { date: '2026-01-21', title: 'Graduation Pictorial', category: 'event' },
  {
    date: '2026-01-22',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-23',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-24',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-25',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-26',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-27',
    title: 'THIRD QUARTER TEST - PART II',
    category: 'test',
  },
  {
    date: '2026-01-29',
    title: 'SNDPA-LPH 28th Founding Anniversary (Opening)',
    category: 'celebration',
  },
  {
    date: '2026-01-30',
    title: 'INTERCOLOR (Grades 1 to 3)',
    category: 'event',
  },
  {
    date: '2026-01-31',
    title: 'INTERCOLOR (Grades 4 to 6)',
    category: 'event',
  },
  // February 2026
  { date: '2026-02-02', title: 'INTERCOLOR (JHS and SHS)', category: 'event' },
  { date: '2026-02-03', title: 'INTERCOLOR (JHS and SHS)', category: 'event' },
  { date: '2026-02-04', title: 'PRE-SCHOOLYMPICS', category: 'event' },
  {
    date: '2026-02-05',
    title: 'SNDPA-LPH 28th Founding Anniversary (Closing)',
    category: 'celebration',
  },
  {
    date: '2026-02-13',
    title: 'DISTRIBUTION OF REPORT CARDS',
    category: 'academic',
  },
  {
    date: '2026-02-16',
    title: 'Elimination for Math Wizard',
    category: 'event',
  },
  {
    date: '2026-02-20',
    title: 'JUNIOR AND SENIOR PROM',
    category: 'celebration',
  },
  {
    date: '2026-02-28',
    title: 'Final Round for Math Wizard',
    category: 'event',
  },
  // March 2026
  { date: '2026-03-09', title: 'CUMULATIVE TEST', category: 'test' },
  { date: '2026-03-10', title: 'CUMULATIVE TEST', category: 'test' },
  { date: '2026-03-11', title: 'CUMULATIVE TEST', category: 'test' },
  { date: '2026-03-12', title: 'CUMULATIVE TEST', category: 'test' },
  { date: '2026-03-13', title: 'CUMULATIVE TEST', category: 'test' },
  {
    date: '2026-03-14',
    title: 'WATER FUN AND FAREWELL PARTY FOR KINDER',
    category: 'celebration',
  },
  { date: '2026-03-16', title: 'CLEARANCE WEEK', category: 'academic' },
  { date: '2026-03-17', title: 'FAREWELL PARTY', category: 'celebration' },
  { date: '2026-03-18', title: 'Recognition Practice', category: 'event' },
  { date: '2026-03-19', title: 'Graduation Practice', category: 'event' },
  { date: '2026-03-20', title: 'Recognition Practice', category: 'event' },
  { date: '2026-03-23', title: 'Graduation Practice', category: 'event' },
  { date: '2026-03-25', title: 'DELIBERATION OF HONOR', category: 'academic' },
  {
    date: '2026-03-26',
    title: 'General Practice for Recognition',
    category: 'event',
  },
  {
    date: '2026-03-27',
    title: 'General Practice for Graduation',
    category: 'event',
  },
  { date: '2026-03-29', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-03-30', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-03-31', title: 'HOLY WEEK', category: 'holiday' },
  // April 2026
  { date: '2026-04-01', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-04-02', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-04-03', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-04-04', title: 'HOLY WEEK', category: 'holiday' },
  { date: '2026-04-06', title: 'Graduation Mass Practice', category: 'event' },
  { date: '2026-04-07', title: 'GRADUATION MASS', category: 'celebration' },
  { date: '2026-04-09', title: 'RECOGNITION DAY', category: 'celebration' },
  { date: '2026-04-10', title: 'GRADUATION DAY', category: 'celebration' },
];

// Color mapping for activity categories
const categoryColors: Record<string, string> = {
  academic: 'bg-blue-200/50',
  event: 'bg-green-200/50',
  holiday: 'bg-purple-200/50',
  test: 'bg-red-200/50',
  workshop: 'bg-yellow-200/50',
  celebration: 'bg-pink-200/50',
  other: 'bg-gray-200/50',
};

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function SchedulePage() {
  const { student, isLoading } = useStudentAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const getActivitiesForDate = (date: Date): CalendarActivity[] => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarActivities.filter((activity) => activity.date === dateStr);
  };

  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold text-red-800">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Calendar of Activities
      </h2>

      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SY 2025-2026 Calendar of Activities</CardTitle>
              <CardDescription>
                School activities and important dates
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="border-gray-300"
              >
                ←
              </Button>
              <span className="font-semibold text-gray-800 min-w-[200px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="border-gray-300"
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-gray-700 text-base"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              const activities = getActivitiesForDate(day);
              const isToday =
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();
              const primaryCategory = activities[0]?.category || null;
              const bgColor = primaryCategory
                ? categoryColors[primaryCategory]
                : '';

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square border border-gray-200 rounded p-2 relative flex flex-col items-center justify-center ${
                    isToday ? 'ring-2 ring-red-600' : ''
                  } ${bgColor}`}
                >
                  <div
                    className={`text-lg font-semibold text-center ${
                      isToday ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {activities.length > 0 && (
                    <div className="mt-1 space-y-1 w-full">
                      {activities.slice(0, 2).map((activity, idx) => (
                        <div
                          key={idx}
                          className={`text-xs px-1 py-1 rounded text-center truncate ${
                            categoryColors[activity.category]
                          }`}
                          title={activity.title}
                        >
                          {activity.title.length > 20
                            ? activity.title.substring(0, 20) + '...'
                            : activity.title}
                        </div>
                      ))}
                      {activities.length > 2 && (
                        <div className="text-xs text-gray-600 font-semibold text-center">
                          +{activities.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3">Legend:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-blue-200/50 border border-blue-300"></div>
                <span className="text-sm text-gray-700">Academic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-200/50 border border-green-300"></div>
                <span className="text-sm text-gray-700">Event</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-red-200/50 border border-red-300"></div>
                <span className="text-sm text-gray-700">Test</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-yellow-200/50 border border-yellow-300"></div>
                <span className="text-sm text-gray-700">Workshop</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-pink-200/50 border border-pink-300"></div>
                <span className="text-sm text-gray-700">Celebration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-purple-200/50 border border-purple-300"></div>
                <span className="text-sm text-gray-700">Holiday</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
