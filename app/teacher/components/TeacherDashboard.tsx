"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, CheckCircle, Clock, FileText, TrendingUp, Users } from "lucide-react"

interface TeacherDashboardProps {
  stats: {
    totalStudents: number
    classesToday: number
    pendingGrades: number
    journalEntries: number
  }
  todaySchedule: Array<{
    id: string
    subject: string
    section: string
    time: string
    room: string
  }>
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
}

export function TeacherDashboard({ stats, todaySchedule, recentActivity }: TeacherDashboardProps) {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const isClassNow = (time: string) => {
    // Simple check - in production, parse time range and compare
    return false
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{stats.totalStudents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              Across all classes
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription>Classes Today</CardDescription>
            <CardTitle className="text-3xl">{stats.classesToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="mr-1 h-4 w-4" />
              Scheduled sessions
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription>Pending Grades</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingGrades}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="mr-1 h-4 w-4" />
              Need submission
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription>Journal Entries</CardDescription>
            <CardTitle className="text-3xl">{stats.journalEntries}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <BookOpen className="mr-1 h-4 w-4" />
              This month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((schedule) => (
                  <div
                    key={schedule.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isClassNow(schedule.time) ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{schedule.subject}</h4>
                        {isClassNow(schedule.time) && (
                          <Badge variant="default" className="text-xs">Now</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{schedule.section}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="h-4 w-4 mr-1" />
                        {schedule.time}
                      </div>
                      <p className="text-xs text-muted-foreground">{schedule.room}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No classes scheduled today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                    <div className={`mt-1 rounded-full p-1.5 ${
                      activity.type === 'grade' ? 'bg-green-100' :
                      activity.type === 'journal' ? 'bg-blue-100' :
                      activity.type === 'attendance' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.type === 'grade' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {activity.type === 'journal' && <FileText className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'attendance' && <Users className="h-4 w-4 text-purple-600" />}
                      {!['grade', 'journal', 'attendance'].includes(activity.type) && (
                        <BookOpen className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section - Teacher Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Teacher Actions</CardTitle>
          <CardDescription>Your authorized tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button className="p-4 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">Teaching Journal</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm font-medium">Manage Grades</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-sm font-medium">Take Attendance</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-sm font-medium">Monitor Attendance</p>
            </button>
            <button className="p-4 bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-medium">Check Grades</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
