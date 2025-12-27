"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Radio,
  Settings,
  Shield,
  UserCheck,
  UserCog,
  Users
} from "lucide-react"
import Link from "next/link"
import { AdminHeader } from "./components/AdminHeader"
import { useAdminData } from "./hooks/useAdminData"
import { useAuth } from "./hooks/useAuth"

export default function AdminPage() {
  const { admin, loading } = useAuth()
  const { stats, loadingStats } = useAdminData(admin)

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
          <p className="mt-4 text-red-800 font-medium">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader admin={admin} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
          <p className="text-gray-600">Welcome back! Here's an overview of your school.</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-50 to-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Total Students</CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-900">
                {loadingStats ? "..." : stats.totalStudents.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">All grade levels</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Teachers</CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {loadingStats ? "..." : stats.totalTeachers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active faculty</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Parents</CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <UserCog className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {loadingStats ? "..." : stats.totalParents}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active guardians</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Attendance Rate</CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {loadingStats ? "..." : `${stats.attendanceRate}%`}
              </div>
              <p className="text-xs text-gray-600 mt-1">Today's attendance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">System Status</CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">Active</div>
              <p className="text-xs text-gray-600 mt-1">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* Management Sections */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/students"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <Users className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Student Management</h3>
            <p className="text-sm text-gray-600">Manage student records and profiles</p>
          </Link>

          <Link
            href="/admin/teachers"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <Shield className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Teacher Management</h3>
            <p className="text-sm text-gray-600">Manage teacher accounts and info</p>
          </Link>

          <Link
            href="/admin/parents"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <UserCog className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Parent Management</h3>
            <p className="text-sm text-gray-600">Manage parent/guardian accounts</p>
          </Link>

          <Link
            href="/admin/attendance"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <CalendarCheck className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Attendance</h3>
            <p className="text-sm text-gray-600">Track and manage attendance records</p>
          </Link>

          <Link
            href="/admin/live-attendance"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <Radio className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Live Attendance</h3>
            <p className="text-sm text-gray-600">Real-time attendance tracking</p>
          </Link>

          <Link
            href="/admin/attendance-reports"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <ClipboardList className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Student Attendance</h3>
            <p className="text-sm text-gray-600">Track student attendance records</p>
          </Link>

          <Link
            href="/admin/teacher-attendance"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <UserCheck className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Teacher Attendance</h3>
            <p className="text-sm text-gray-600">Track teacher attendance records</p>
          </Link>

          <Link
            href="/admin/reports"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <FileText className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Reports & Analytics</h3>
            <p className="text-sm text-gray-600">Generate and view reports</p>
          </Link>

          <Link
            href="/admin/rfid-display"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <CalendarDays className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">RFID Display</h3>
            <p className="text-sm text-gray-600">Monitor RFID scans in real-time</p>
          </Link>

          <Link
            href="/admin/settings"
            className="group block p-6 bg-white border-2 border-red-200 rounded-lg hover:border-red-400 hover:shadow-lg transition-all"
          >
            <Settings className="w-8 h-8 text-red-600 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-xl mb-2 text-gray-900">Settings</h3>
            <p className="text-sm text-gray-600">Configure system preferences</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
