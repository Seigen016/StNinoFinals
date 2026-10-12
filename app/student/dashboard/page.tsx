'use client';

import { AnnouncementCards } from '@/components/AnnouncementCards';
import { ActivePeriodBadge } from '@/components/ui/active-period-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useRefresh } from '@/lib/refresh-context';
import { parseScheduleSlots } from '@/lib/rooms';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  RefreshCcw,
  TrendingUp,
  User2,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStudentAuth } from '../hooks/useStudentAuth';

interface DashboardData {
  stats: {
    gpa: number | null;
    attendanceRate: number | null;
    activeCourses: number;
    approvedGrades: number;
  };
  grades: {
    id: string;
    subject: string;
    grade: number;
    status: string;
    updatedAt: string;
  }[];
  classes: {
    id: string;
    class_name: string;
    class_code: string;
    grade_level: string | null;
    section: string | null;
    semester: string;
    school_year: string;
    room: string | null;
    schedule: string | null;
    teacher_name: string | null;
    is_active: boolean;
  }[];
  recentAttendance: { date: string; timeIn: string | null; status: string }[];
}

function gradeColor(g: number): string {
  if (g >= 90) return 'text-green-700 bg-green-50 border-green-200';
  if (g >= 80) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (g >= 75) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export default function StudentDashboardPage() {
  const { student, isLoading } = useStudentAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(
    null
  );

  const displayName = useMemo(() => {
    if (!student) return 'Student';
    return student.first_name
      ? `${student.first_name}`
      : (student.email?.split('@')[0] ?? 'Student');
  }, [student]);

  const fetchData = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/student/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        setError(payload?.error || 'Failed to load dashboard data.');
      } else {
        setData(payload.data);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [student]);

  const { refreshKey } = useRefresh();

  useEffect(() => {
    if (student) fetchData();
  }, [student, fetchData, refreshKey]);

  useEffect(() => {
    fetch('/api/announcements?role=students')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAnnouncements(res.data || []);
      })
      .catch(console.error);
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold text-red-800">Loading...</div>
      </div>
    );
  }
  if (!student) return null;

  const stats = data?.stats;
  const grades = data?.grades ?? [];
  const classes = data?.classes ?? [];
  const recentAttendance = data?.recentAttendance ?? [];

  const approvedGrades = grades.filter((g) => g.status === 'approved');
  const pendingGrades = grades.filter((g) => g.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {displayName}!
          </h2>
          <div className="mt-1.5">
            <ActivePeriodBadge />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <AnnouncementCards
        announcements={announcements}
        onSelect={setSelectedAnnouncement}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                GPA
              </span>
              <TrendingUp className="w-4 h-4 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.gpa != null ? stats.gpa.toFixed(2) : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {approvedGrades.length > 0
                ? `From ${approvedGrades.length} approved subject${approvedGrades.length !== 1 ? 's' : ''}`
                : 'No approved grades yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Attendance
              </span>
              <CalendarCheck className="w-4 h-4 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.attendanceRate != null ? `${stats.attendanceRate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last 60 records</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Classes
              </span>
              <BookOpen className="w-4 h-4 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '—' : (stats?.activeCourses ?? 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Enrolled this term</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Grades
              </span>
              <GraduationCap className="w-4 h-4 text-red-700" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '—' : grades.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {pendingGrades.length > 0
                ? `${pendingGrades.length} pending review`
                : 'All reviewed'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">My Grades</CardTitle>
            <CardDescription>Approved grades this term</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Loading grades...
              </p>
            ) : approvedGrades.length === 0 ? (
              <div className="text-center py-10">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No approved grades yet.</p>
                {pendingGrades.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pendingGrades.length} grade
                    {pendingGrades.length !== 1 ? 's' : ''} pending admin review
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {approvedGrades.map((g) => {
                  const num = parseFloat(String(g.grade));
                  return (
                    <div
                      key={g.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <p className="text-sm font-medium text-gray-800 truncate pr-4">
                        {g.subject}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-sm font-bold px-2 py-0.5 rounded border ${gradeColor(num)}`}
                        >
                          {num}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {pendingGrades.length > 0 && (
                  <p className="text-xs text-amber-600 pt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {pendingGrades.length} more subject
                    {pendingGrades.length !== 1 ? 's' : ''} pending
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Classes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              My Classes
            </CardTitle>
            <CardDescription>Enrolled classes this term</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Loading classes...
              </p>
            ) : classes.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Not enrolled in any classes yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                  >
                    {/* Subject icon */}
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-red-700" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Name + badge */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {cls.class_name}
                        </p>
                        <Badge
                          className={`shrink-0 text-[10px] px-1.5 py-0 ${cls.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
                          variant="outline"
                        >
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Teacher · Room */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User2 className="w-3 h-3 text-gray-400" />
                          {cls.teacher_name || 'No teacher assigned'}
                        </span>
                        {cls.room && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              {cls.room}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Schedule chips */}
                      {cls.schedule &&
                        (() => {
                          const slots = parseScheduleSlots(cls.schedule);
                          if (slots.length === 0) return null;
                          const groups: Record<string, string[]> = {};
                          slots.forEach((s: any) => {
                            const key = `${s.start}–${s.end}`;
                            (groups[key] ??= []).push(s.day);
                          });
                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(groups).map(([time, days]) => (
                                <div
                                  key={time}
                                  className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-0.5"
                                >
                                  <CalendarDays className="w-3 h-3 text-gray-400 shrink-0" />
                                  <div className="flex gap-0.5">
                                    {days.map((d: string) => (
                                      <span
                                        key={d}
                                        className="inline-flex items-center justify-center w-5 h-[16px] rounded text-[9px] font-bold bg-red-100 text-red-700"
                                      >
                                        {d}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-gray-500 font-medium">
                                    {time}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Attendance
          </CardTitle>
          <CardDescription>Your last 7 recorded days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Loading attendance...
            </p>
          ) : recentAttendance.length === 0 ? (
            <div className="text-center py-8">
              <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No attendance records found.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recentAttendance.map((r, i) => {
                const present = r.status === 'present';
                const date = new Date(r.date);
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs ${
                      present
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    <span className="font-semibold">
                      {date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-0.5 mt-1">
                      {present ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {present ? 'Present' : 'Absent'}
                    </span>
                    {r.timeIn && (
                      <span className="text-gray-500 mt-0.5">
                        {new Date(r.timeIn).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAnnouncement && (
        <Dialog
          open={!!selectedAnnouncement}
          onOpenChange={() => setSelectedAnnouncement(null)}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:rounded-md [&>button]:opacity-80 [&>button]:hover:opacity-100">
            <DialogTitle className="sr-only">
              {selectedAnnouncement.title}
            </DialogTitle>
            <div className="bg-gradient-to-br from-red-900 to-red-800 px-5 pt-5 pb-4 pr-14">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Bell className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  Announcement
                </span>
                {selectedAnnouncement.priority === 'high' && (
                  <span className="ml-auto bg-red-500 border border-red-400 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Urgent
                  </span>
                )}
              </div>
              <h2 className="text-white font-bold text-lg leading-snug">
                {selectedAnnouncement.title}
              </h2>
              {selectedAnnouncement.published_at && (
                <p className="text-red-200/80 text-xs mt-2">
                  {new Date(
                    selectedAnnouncement.published_at
                  ).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
            <div className="px-5 py-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {selectedAnnouncement.content}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
