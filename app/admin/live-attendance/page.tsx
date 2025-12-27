"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabaseClient"
import {
  ArrowLeft,
  Clock,
  Radio,
  User,
  Users,
  X
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  gradeLevel: string
  section: string
  scanTime: string
  status: string
  rfidCard: string
  studentPhoto?: string
}

export default function LiveAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loadingAttendance, setLoadingAttendance] = useState(true)
  const [latestRecord, setLatestRecord] = useState<AttendanceRecord | null>(null)
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchedIdRef = useRef<string | null>(null)

  // Fetch today's attendance records
  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/admin/attendance-live?limit=50')
      const result = await response.json()
      
      if (result.success && result.records) {
        setAttendanceRecords(result.records)
        
        // Check if there's a new record
        if (result.records.length > 0) {
          const newest = result.records[0]
          if (lastFetchedIdRef.current !== newest.id) {
            lastFetchedIdRef.current = newest.id
            showLatestRecord(newest)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error)
    } finally {
      setLoadingAttendance(false)
    }
  }

  // Show the latest record for 10 seconds
  const showLatestRecord = (record: AttendanceRecord) => {
    // Clear any existing timer
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
    }
    
    setLatestRecord(record)
    
    // Clear after 10 seconds
    clearTimerRef.current = setTimeout(() => {
      setLatestRecord(null)
    }, 10000)
  }

  // Click a record to show it in the main display
  const handleRecordClick = (record: AttendanceRecord) => {
    showLatestRecord(record)
  }

  // Initial fetch and Supabase realtime subscription
  useEffect(() => {
    fetchTodayAttendance()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('live-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          // Fetch new data when a record is inserted
          fetchTodayAttendance()
        }
      )
      .subscribe()

    // Fallback polling every 5 seconds
    const interval = setInterval(fetchTodayAttendance, 5000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
    }
  }, [])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleClose = () => {
    if (window.opener) {
      window.close()
    } else {
      window.location.href = "/admin"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-red-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.png"
                alt="Sto Niño de Praga Academy Logo"
                width={60}
                height={60}
                className="rounded-full"
              />
              <div>
                <h1 className="text-xl font-bold text-red-800 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-600" />
                  Live Attendance Monitoring
                </h1>
                <p className="text-sm text-gray-600">Sto Niño de Praga Academy</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button
                  variant="outline"
                  className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Admin
                </Button>
              </Link>
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <div className="container mx-auto px-4 py-8 h-[calc(100vh-140px)]">
        <div className="grid grid-cols-4 gap-4 h-full">
          {/* Left Side - Today's Attendance List (1/4 = 25%) */}
          <div className="col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-600" />
                  Today&apos;s Scans
                </CardTitle>
                <CardDescription className="text-xs">
                  {attendanceRecords.length} records today
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                {/* Status indicator */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-green-800">Live Monitoring</span>
                  </div>
                </div>

                {/* Attendance Records List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  {loadingAttendance ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-800 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-600">Loading...</p>
                      </div>
                    </div>
                  ) : attendanceRecords.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Radio className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">No scans today</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attendanceRecords.map((record, index) => (
                        <Popover key={record.id}>
                          <PopoverTrigger asChild>
                            <div
                              onClick={() => handleRecordClick(record)}
                              className={`p-3 rounded-lg transition-all border cursor-pointer ${
                                latestRecord?.id === record.id
                                  ? "bg-green-100 border-green-400 shadow-lg ring-2 ring-green-400"
                                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-red-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">
                                    {record.studentName}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {record.gradeLevel} - {record.section}
                                  </p>
                                </div>
                                {index === 0 && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs px-1 py-0">Latest</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {record.status}
                                </Badge>
                                <span className="text-xs font-medium text-gray-900">
                                  {formatTime(record.scanTime)}
                                </span>
                              </div>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent side="right" className="w-64 p-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                  <User className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm">{record.studentName}</p>
                                  <p className="text-xs text-gray-500">ID: {record.studentId}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                <div>
                                  <p className="text-xs text-gray-500">Grade</p>
                                  <p className="text-sm font-medium">{record.gradeLevel}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Section</p>
                                  <p className="text-sm font-medium">{record.section}</p>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500">Scan Time</p>
                                <p className="text-sm font-medium">{formatTime(record.scanTime)}</p>
                                <p className="text-xs text-gray-400">{formatDate(record.scanTime)}</p>
                              </div>
                              <div className="pt-2 border-t">
                                <p className="text-xs text-gray-500">RFID Card</p>
                                <p className="text-xs font-mono">{record.rfidCard}</p>
                              </div>
                              <Button 
                                size="sm" 
                                className="w-full mt-2 bg-red-800 hover:bg-red-900"
                                onClick={() => handleRecordClick(record)}
                              >
                                View Full Details
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Student Details (3/4 = 75%) */}
          <div className="col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-red-800">User Information</CardTitle>
                <CardDescription>
                  Displays for 10 seconds when a new RFID scan is detected. Click any record to view details.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                {latestRecord ? (
                  <div className="w-full max-w-2xl">
                    <div className="text-center space-y-6">
                      {/* Student Photo */}
                      <div className="flex justify-center">
                        <div className="relative">
                          {latestRecord.studentPhoto ? (
                            <Image
                              src={latestRecord.studentPhoto}
                              alt={latestRecord.studentName}
                              width={200}
                              height={200}
                              className="rounded-full border-4 border-red-800 shadow-lg"
                            />
                          ) : (
                            <div className="w-48 h-48 rounded-full border-4 border-red-800 bg-red-100 flex items-center justify-center shadow-lg">
                              <User className="w-24 h-24 text-red-600" />
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white rounded-full w-8 h-8 flex items-center justify-center animate-pulse">
                            <Radio className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Student Name */}
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {latestRecord.studentName}
                        </h2>
                        <p className="text-lg text-gray-600">Student ID: {latestRecord.studentId}</p>
                      </div>

                      {/* Student Details */}
                      <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-gray-600">Grade Level</span>
                          </div>
                          <p className="text-xl font-semibold text-gray-900">{latestRecord.gradeLevel}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-gray-600">Section</span>
                          </div>
                          <p className="text-xl font-semibold text-gray-900">{latestRecord.section}</p>
                        </div>
                      </div>

                      {/* Scan Time */}
                      <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <Clock className="w-6 h-6 text-red-600" />
                          <span className="text-lg font-semibold text-red-800">Scan Time</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-2xl font-bold text-gray-900">
                            {formatTime(latestRecord.scanTime)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(latestRecord.scanTime)}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            RFID Card: {latestRecord.rfidCard}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                            {latestRecord.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Radio className="w-24 h-24 text-gray-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-500 text-lg">Waiting for RFID scan...</p>
                    <p className="text-gray-400 text-sm mt-2">Student information will appear here when scanned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Real-time updates via Supabase • Today&apos;s attendance on the left • Click any record to view • Info displays for 10 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
