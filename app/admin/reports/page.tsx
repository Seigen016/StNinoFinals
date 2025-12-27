"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { AdminHeader } from "../components/AdminHeader"
import { useAuth } from "../hooks/useAuth"

export default function ReportsPage() {
  const { admin, loading } = useAuth()

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-800 border-t-transparent"></div>
          <p className="mt-4 text-red-800 font-medium">Loading Reports...</p>
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
            <CardTitle className="text-red-800">Reports & Analytics</CardTitle>
            <CardDescription>Generate and view various reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p>Reports section coming soon</p>
              <p className="text-sm mt-2">This page will contain comprehensive analytics and reporting features</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
