'use client';

import { AnnouncementCards } from '@/components/AnnouncementCards';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface Child {
  id: string | number;
  name: string;
  student_id?: string;
  grade_level?: string;
  section?: string;
}

interface ChildStats {
  gpa: number;
  attendanceRate: number;
  behaviorScore: number;
  pendingTasks: number;
}

interface ChildGrade {
  subject: string;
  grade: string;
  lastUpdated: string;
}

interface ChildAttendance {
  date: string;
  status: 'present' | 'absent' | 'late';
  time?: string;
}

interface ChildAnnouncement {
  id: string;
  title: string;
  date: string;
  from: string;
  priority: 'high' | 'medium' | 'low';
}

interface ParentDashboardProps {
  children: Child[];
  childStats: { [childId: string]: ChildStats };
  childGrades: { [childId: string]: ChildGrade[] };
  childAttendance: { [childId: string]: ChildAttendance[] };
  announcements: { [childId: string]: ChildAnnouncement[] };
}

export function ParentDashboard({
  children,
  childStats,
  childGrades,
  childAttendance,
  announcements,
}: ParentDashboardProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    children.length > 0 ? String(children[0].id) : ''
  );

  const selectedChild = children.find((c) => String(c.id) === selectedChildId);
  const stats = selectedChildId ? childStats[selectedChildId] : null;
  const grades = selectedChildId ? childGrades[selectedChildId] || [] : [];
  const attendance = selectedChildId
    ? childAttendance[selectedChildId] || []
    : [];
  const childAnnouncements = selectedChildId
    ? announcements[selectedChildId] || []
    : [];

  const getGradeColor = (grade: string) => {
    const numGrade = parseFloat(grade);
    if (numGrade >= 95) return 'text-green-600';
    if (numGrade >= 90) return 'text-blue-600';
    if (numGrade >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'absent':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
        <p className="text-muted-foreground">
          Add your children to view their academic progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
          <CardDescription>
            View academic progress and attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={String(child.id)}>
                  {child.name} - {child.grade_level} {child.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedChild && stats && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardDescription>Current GPA</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.gpa.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  Academic Performance
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardDescription>Attendance Rate</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.attendanceRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.attendanceRate} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardDescription>Behavior Score</CardDescription>
                <CardTitle className="text-3xl">
                  {stats.behaviorScore}/100
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.behaviorScore} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardDescription>Pending Tasks</CardDescription>
                <CardTitle className="text-3xl">{stats.pendingTasks}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  Assignments Due
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Grades
                </CardTitle>
                <CardDescription>Latest academic results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {grades.slice(0, 6).map((grade, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{grade.subject}</h4>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(grade.lastUpdated)}
                        </p>
                      </div>
                      <span
                        className={`text-2xl font-bold ${getGradeColor(grade.grade)}`}
                      >
                        {grade.grade}
                      </span>
                    </div>
                  ))}
                  {grades.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No grades available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attendance Record */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Attendance
                </CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attendance.slice(0, 7).map((record, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        {getAttendanceIcon(record.status)}
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {record.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(record.date)}
                          </p>
                        </div>
                      </div>
                      {record.time && (
                        <span className="text-sm text-muted-foreground">
                          {record.time}
                        </span>
                      )}
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No attendance records
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <AnnouncementCards announcements={childAnnouncements} />
        </>
      )}
    </div>
  );
}
