"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { AdminHeader } from "../components/AdminHeader"
import { useAuth } from "../hooks/useAuth"

export default function AttendancePage() {
  const { admin, loading } = useAuth()

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
          <p className="mt-4 text-red-800 font-medium">Loading Attendance...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader admin={admin} />
      
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-800">Attendance Management</CardTitle>
            <CardDescription>Track and manage student and teacher attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Attendance management coming soon</p>
              <p className="text-sm mt-2">View detailed attendance reports and live tracking</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
