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
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Calendar, Clock, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRefresh } from '@/lib/refresh-context';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Teacher {
  id: number;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  subject?: string;
  subjects?: string;
  [key: string]: any;
}

interface TeacherChartData {
  gradeStatus: { name: string; value: number; fill: string }[];
  studentsPerClass: { class: string; students: number }[];
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherStats, setTeacherStats] = useState<any>(null);
  const [chartData, setChartData] = useState<TeacherChartData | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const { refreshKey } = useRefresh();

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

  // Fetch teacher stats
  useEffect(() => {
    if (teacher && teacher.id) {
      fetchTeacherStats();
    }
  }, [teacher, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeacherStats = async () => {
    if (!teacher || !teacher.id) return;

    try {
      const response = await fetch(
        `/api/teacher/stats?teacherId=${teacher.id}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setTeacherStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
    }

    try {
      const res = await fetch(
        `/api/teacher/chart-data?teacherId=${teacher.id}`
      );
      const d = await res.json();
      if (d.success) setChartData(d.data);
    } catch (error) {
      console.error('Error fetching teacher chart data:', error);
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
      <AnnouncementCards
        announcements={teacherStats?.announcements ?? []}
        onSelect={setSelectedAnnouncement}
      />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome, {teacher.first_name || 'Teacher'}!
        </h2>
        <div className="mt-1.5"><ActivePeriodBadge /></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-red-800">
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl text-red-800">
              {teacherStats?.totalStudents ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Across all your classes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardDescription>Total Classes</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {teacherStats?.totalClasses ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Active assigned classes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600">
          <CardHeader className="pb-2">
            <CardDescription>Pending Grades</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {teacherStats?.pendingGrades ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Awaiting admin approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      {teacherStats?.todaySchedule && teacherStats.todaySchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes scheduled for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teacherStats.todaySchedule.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold text-red-800">
                        {item.timeStart}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.timeEnd}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">{item.subject}</div>
                      <div className="text-sm text-gray-600">
                        {item.section} • {item.room}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Submissions Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Grade Submission Status
            </CardTitle>
            <CardDescription>Status of your submitted grades</CardDescription>
          </CardHeader>
          <CardContent>
            {!chartData ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={chartData.gradeStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.gradeStatus.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {chartData.gradeStatus.map((entry) => (
                    <div
                      key={entry.name}
                      className="flex items-center gap-1 text-xs"
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-gray-600">{entry.name}</span>
                      <span className="font-semibold text-gray-900">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Students per Class */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">Students per Class</CardTitle>
            <CardDescription>
              Active enrollments in your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!chartData ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-800 border-t-transparent" />
              </div>
            ) : chartData.studentsPerClass.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                No active classes found
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData.studentsPerClass}
                  margin={{ top: 4, right: 8, left: -16, bottom: 48 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  {/* interval={0} keeps every class label; angle them so they
                      don't overlap once a teacher has more than a few classes. */}
                  <XAxis
                    dataKey="class"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                    tickFormatter={(v: string) =>
                      v.length > 16 ? `${v.slice(0, 15)}…` : v
                    }
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="students"
                    name="Students"
                    fill="#991b1b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => router.push('/teacher/grades')}
              className="bg-red-800 hover:bg-red-700 h-auto py-4"
            >
              <GraduationCap className="w-5 h-5 mr-2" />
              Manage Grades
            </Button>
            <Button
              onClick={() => router.push('/teacher/calendar')}
              variant="outline"
              className="border-red-800 text-red-800 hover:bg-red-50 h-auto py-4"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedAnnouncement && (
        <Dialog open={!!selectedAnnouncement} onOpenChange={() => setSelectedAnnouncement(null)}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[85vh] flex flex-col [&>button]:text-white [&>button]:hover:bg-white/20 [&>button]:rounded-md [&>button]:opacity-80 [&>button]:hover:opacity-100">
            <DialogTitle className="sr-only">{selectedAnnouncement.title}</DialogTitle>
            <div className="bg-gradient-to-br from-red-900 to-red-800 px-5 pt-5 pb-4 pr-14 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Bell className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Announcement</span>
                {selectedAnnouncement.priority === 'high' && (
                  <span className="ml-auto bg-red-500 border border-red-400 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                    Urgent
                  </span>
                )}
              </div>
              <h2 className="text-white font-bold text-lg leading-snug">{selectedAnnouncement.title}</h2>
              {selectedAnnouncement.published_at && (
                <p className="text-red-200/80 text-xs mt-2">
                  {new Date(selectedAnnouncement.published_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            <div className="px-5 py-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{selectedAnnouncement.content}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
