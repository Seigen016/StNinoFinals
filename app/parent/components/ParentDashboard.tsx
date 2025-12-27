"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, BookOpen, Calendar, CheckCircle2, Clock, MessageSquare, TrendingUp, User } from "lucide-react"
import { useState } from "react"

interface Child {
  id: string | number
  name: string
  student_id?: string
  grade_level?: string
  section?: string
}

interface ChildStats {
  gpa: number
  attendanceRate: number
  behaviorScore: number
  pendingTasks: number
}

interface ChildGrade {
  subject: string
  grade: string
  lastUpdated: string
}

interface ChildAttendance {
  date: string
  status: 'present' | 'absent' | 'late'
  time?: string
}

interface ChildAnnouncement {
  id: string
  title: string
  date: string
  from: string
  priority: 'high' | 'medium' | 'low'
}

interface ParentDashboardProps {
  children: Child[]
  childStats: { [childId: string]: ChildStats }
  childGrades: { [childId: string]: ChildGrade[] }
  childAttendance: { [childId: string]: ChildAttendance[] }
  announcements: { [childId: string]: ChildAnnouncement[] }
}

export function ParentDashboard({
  children,
  childStats,
  childGrades,
  childAttendance,
  announcements,
}: ParentDashboardProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    children.length > 0 ? String(children[0].id) : ""
  )

  const selectedChild = children.find((c) => String(c.id) === selectedChildId)
  const stats = selectedChildId ? childStats[selectedChildId] : null
  const grades = selectedChildId ? childGrades[selectedChildId] || [] : []
  const attendance = selectedChildId ? childAttendance[selectedChildId] || [] : []
  const childAnnouncements = selectedChildId ? announcements[selectedChildId] || [] : []

  const getGradeColor = (grade: string) => {
    const numGrade = parseFloat(grade)
    if (numGrade >= 95) return 'text-green-600'
    if (numGrade >= 90) return 'text-blue-600'
    if (numGrade >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'absent':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
        <p className="text-muted-foreground">Add your children to view their academic progress</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Access - Parent Use Cases */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle>Parent Portal</CardTitle>
          <CardDescription>Monitor your child's academic journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all">
              <BookOpen className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-xs font-medium">Check Grades</p>
            </button>
            <button className="p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-xs font-medium">View Progress</p>
            </button>
            <button className="p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all">
              <Calendar className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-xs font-medium">Enrollment Status</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Child Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Child</CardTitle>
          <CardDescription>View academic progress and attendance</CardDescription>
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
                <CardTitle className="text-3xl">{stats.gpa.toFixed(2)}</CardTitle>
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
                <CardTitle className="text-3xl">{stats.attendanceRate.toFixed(1)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={stats.attendanceRate} className="h-2" />
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardDescription>Behavior Score</CardDescription>
                <CardTitle className="text-3xl">{stats.behaviorScore}/100</CardTitle>
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
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{grade.subject}</h4>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(grade.lastUpdated)}
                        </p>
                      </div>
                      <span className={`text-2xl font-bold ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                    </div>
                  ))}
                  {grades.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No grades available</p>
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
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        {getAttendanceIcon(record.status)}
                        <div>
                          <p className="font-medium text-sm capitalize">{record.status}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
                        </div>
                      </div>
                      {record.time && (
                        <span className="text-sm text-muted-foreground">{record.time}</span>
                      )}
                    </div>
                  ))}
                  {attendance.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No attendance records</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Announcements & Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                School Announcements
              </CardTitle>
              <CardDescription>Important updates from teachers and school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {childAnnouncements.slice(0, 5).map((announcement) => (
                  <div key={announcement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`mt-1 rounded-full p-1 ${
                      announcement.priority === 'high' ? 'bg-red-100' :
                      announcement.priority === 'medium' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <AlertCircle className={`h-4 w-4 ${
                        announcement.priority === 'high' ? 'text-red-600' :
                        announcement.priority === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">From: {announcement.from}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(announcement.date)}</p>
                    </div>
                  </div>
                ))}
                {childAnnouncements.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No announcements</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
