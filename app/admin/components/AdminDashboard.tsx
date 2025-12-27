"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
    Activity,
    BarChart3,
    CheckCircle2,
    Clock,
    CreditCard,
    FileText,
    LineChart,
    Radio,
    Settings,
    Shield,
    TrendingUp,
    UserCheck,
    UserCog,
    Users
} from "lucide-react"

interface AdminDashboardProps {
  stats: {
    totalStudents: number
    totalTeachers: number
    totalParents: number
    attendanceRate: number
    systemStatus: 'operational' | 'warning' | 'error'
  }
  recentActivity: Array<{
    id: string
    type: 'enrollment' | 'attendance' | 'grade' | 'user'
    description: string
    timestamp: string
    status?: 'success' | 'warning' | 'error'
  }>
  attendanceTrends: Array<{
    date: string
    rate: number
  }>
  enrollmentByGrade: Array<{
    grade: string
    count: number
  }>
}

export function AdminDashboard({
  stats,
  recentActivity,
  attendanceTrends,
  enrollmentByGrade,
}: AdminDashboardProps) {
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <Users className="h-4 w-4" />
      case 'attendance':
        return <CheckCircle2 className="h-4 w-4" />
      case 'grade':
        return <FileText className="h-4 w-4" />
      case 'user':
        return <UserCog className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-600'
      case 'warning':
        return 'bg-yellow-100 text-yellow-600'
      case 'error':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-blue-100 text-blue-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">{stats.totalStudents.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              All grade levels
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Total Teachers</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTeachers.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Shield className="mr-1 h-4 w-4" />
              Active faculty
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription>Total Parents</CardDescription>
            <CardTitle className="text-3xl">{stats.totalParents.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <UserCog className="mr-1 h-4 w-4" />
              Active guardians
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
            <CardDescription>System Status</CardDescription>
            <CardTitle className="text-xl capitalize flex items-center gap-2">
              <Radio
                className={`h-5 w-5 ${
                  stats.systemStatus === 'operational'
                    ? 'text-green-600'
                    : stats.systemStatus === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              />
              {stats.systemStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="mr-1 h-4 w-4" />
              All systems
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                  <div className={`mt-1 rounded-full p-1.5 ${getStatusColor(activity.status)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                  {activity.status && (
                    <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'secondary' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  )}
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment by Grade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enrollment by Grade Level
            </CardTitle>
            <CardDescription>Student distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollmentByGrade.map((grade) => {
                const maxCount = Math.max(...enrollmentByGrade.map((g) => g.count))
                const percentage = (grade.count / maxCount) * 100
                return (
                  <div key={grade.grade}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{grade.grade}</span>
                      <span className="text-sm text-muted-foreground">{grade.count} students</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
              {enrollmentByGrade.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No enrollment data</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Attendance Trends
          </CardTitle>
          <CardDescription>Last 7 days attendance rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceTrends.map((trend, idx) => {
              const date = new Date(trend.date)
              const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              })
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32">
                    <span className="text-sm font-medium">{formattedDate}</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={trend.rate} className="h-3" />
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-medium ${
                      trend.rate >= 95 ? 'text-green-600' :
                      trend.rate >= 90 ? 'text-blue-600' :
                      trend.rate >= 85 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {trend.rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
            {attendanceTrends.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No attendance data</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Action Cards - Based on Use Cases */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle>Administrator Actions</CardTitle>
          <CardDescription>Your authorized administrative functions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <button className="p-3 bg-white border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-400 hover:shadow-md transition-all">
              <UserCheck className="h-7 w-7 mx-auto mb-1 text-red-600" />
              <p className="text-xs font-medium">Take Attendance</p>
            </button>
            <button className="p-3 bg-white border-2 border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all">
              <Activity className="h-7 w-7 mx-auto mb-1 text-blue-600" />
              <p className="text-xs font-medium">Monitor Attendance</p>
            </button>
            <button className="p-3 bg-white border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-400 hover:shadow-md transition-all">
              <CreditCard className="h-7 w-7 mx-auto mb-1 text-purple-600" />
              <p className="text-xs font-medium">RFID Management</p>
            </button>
            <button className="p-3 bg-white border-2 border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 hover:shadow-md transition-all">
              <Users className="h-7 w-7 mx-auto mb-1 text-green-600" />
              <p className="text-xs font-medium">User Management</p>
            </button>
            <button className="p-3 bg-white border-2 border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 hover:shadow-md transition-all">
              <FileText className="h-7 w-7 mx-auto mb-1 text-orange-600" />
              <p className="text-xs font-medium">Generate Reports</p>
            </button>
            <button className="p-3 bg-white border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all">
              <LineChart className="h-7 w-7 mx-auto mb-1 text-indigo-600" />
              <p className="text-xs font-medium">Analytics</p>
            </button>
            <button className="p-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all">
              <Settings className="h-7 w-7 mx-auto mb-1 text-gray-600" />
              <p className="text-xs font-medium">System Settings</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Students Present</span>
              <span className="font-medium">{Math.round(stats.totalStudents * (stats.attendanceRate / 100))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Teachers Active</span>
              <span className="font-medium">{stats.totalTeachers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Classes Running</span>
              <span className="font-medium">24</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">RFID System</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Services</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">New Applications</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Enrollment Status</span>
              <Badge variant="secondary">12</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Parent Requests</span>
              <Badge variant="secondary">5</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
