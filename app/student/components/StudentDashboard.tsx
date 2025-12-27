"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, BookOpen, Calendar, CheckCircle2, Clock, TrendingUp } from "lucide-react"

interface StudentDashboardProps {
  stats: {
    gpa: number | null
    attendanceRate: number | null
    activeCourses: number | null
    pendingTasks: number | null
  }
  assignments: Array<{
    id: string
    title: string
    subject: string
    dueDate: string
    status: string
  }>
  courseProgress: Array<{
    id: string
    subject: string
    completion: number
  }>
  grades: Array<{
    id: string
    subject: string
    grade: string
    lastUpdated: string
  }>
}

export function StudentDashboard({ stats, assignments, courseProgress, grades }: StudentDashboardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDaysUntil = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getGradeColor = (grade: string) => {
    const numGrade = parseFloat(grade)
    if (numGrade >= 95) return 'text-green-600'
    if (numGrade >= 90) return 'text-blue-600'
    if (numGrade >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Quick Access Actions */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Common student actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="p-3 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-red-600" />
              <p className="text-xs font-medium">Take Attendance</p>
            </button>
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all">
              <BookOpen className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <p className="text-xs font-medium">Check Grades</p>
            </button>
            <button className="p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all">
              <TrendingUp className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <p className="text-xs font-medium">View Progress</p>
            </button>
            <button className="p-3 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all">
              <Calendar className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-xs font-medium">Enrollment Status</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Current GPA</CardDescription>
            <CardTitle className="text-3xl">
              {stats.gpa?.toFixed(2) ?? "N/A"}
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
              {stats.attendanceRate?.toFixed(1) ?? "0"}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.attendanceRate ?? 0} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription>Active Courses</CardDescription>
            <CardTitle className="text-3xl">{stats.activeCourses ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="mr-1 h-4 w-4" />
              This Semester
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription>Pending Tasks</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingTasks ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <AlertCircle className="mr-1 h-4 w-4" />
              Need Attention
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.slice(0, 5).map((assignment) => {
                const daysUntil = getDaysUntil(assignment.dueDate)
                return (
                  <div key={assignment.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right ml-4">
                      <Badge variant={daysUntil <= 3 ? "destructive" : daysUntil <= 7 ? "default" : "secondary"}>
                        {daysUntil <= 0 ? "Due today" : `${daysUntil} days`}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(assignment.dueDate)}</p>
                    </div>
                  </div>
                )
              })}
              {assignments.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending assignments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Progress
            </CardTitle>
            <CardDescription>Your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseProgress.slice(0, 5).map((course) => (
                <div key={course.id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{course.subject}</span>
                    <span className="text-sm text-muted-foreground">{course.completion}%</span>
                  </div>
                  <Progress value={course.completion} className="h-2" />
                </div>
              ))}
              {courseProgress.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No course data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Recent Grades
          </CardTitle>
          <CardDescription>Your latest academic results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {grades.slice(0, 6).map((grade) => (
              <div key={grade.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm line-clamp-2">{grade.subject}</h4>
                  <span className={`text-2xl font-bold ml-2 ${getGradeColor(grade.grade)}`}>
                    {grade.grade}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated {formatDate(grade.lastUpdated)}
                </p>
              </div>
            ))}
          </div>
          {grades.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No grades available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
