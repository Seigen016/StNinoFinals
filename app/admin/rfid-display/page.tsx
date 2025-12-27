"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"
import { useAlert } from "@/lib/use-alert"
import { LogIn, LogOut, Radio, RefreshCcw, User } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useMemo, useState } from "react"

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
  scanType?: 'timein' | 'timeout' | null
  timeIn?: string | null
  timeOut?: string | null
  // Teacher fields
  isTeacher?: boolean
  subject?: string
  role?: string
}

type FilterType = "all" | "timein" | "timeout"

export default function RfidDisplayPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [latestScan, setLatestScan] = useState<AttendanceRecord | null>(null)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [timeoutModeActive, setTimeoutModeActive] = useState(false)
  const [timeoutCountdown, setTimeoutCountdown] = useState(0)
  const { showAlert } = useAlert()

  const fetchLiveAttendance = useCallback(async (onlyNew = false) => {
    setLoadingAttendance(true)
    try {
      const url = onlyNew && lastScanTime
        ? `/api/admin/attendance-live?since=${encodeURIComponent(lastScanTime)}&limit=1`
        : `/api/admin/attendance-live?limit=1`
      
      const response = await fetch(url)
      
      // Check if response is OK
      if (!response.ok) {
        console.error('API response not OK:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType)
        const text = await response.text()
        console.error('Response text:', text.substring(0, 200))
        return
      }
      
      const result = await response.json()
      console.log('API Response:', result)
      
      if (result.success && result.records && result.records.length > 0) {
        const latest = result.records[0]
        console.log('✅ Latest scan:', latest)
        
        // Update using functional state updates to avoid dependency on latestScan
        setLatestScan((prevLatest) => {
          const isNewScan = !prevLatest || 
                           latest.id !== prevLatest.id || 
                           latest.scanTime !== prevLatest.scanTime
          
          if (isNewScan) {
            console.log('🆕 NEW SCAN DETECTED!')
            console.log('  Previous scan ID:', prevLatest?.id || 'none')
            console.log('  New scan ID:', latest.id)
            console.log('  Previous scan time:', prevLatest?.scanTime || 'none')
            console.log('  New scan time:', latest.scanTime)
          } else {
            console.log('ℹ️ No new scan - same as current')
          }
          
          return latest
        })
        
        // Update records list - add new scan to the top
        setAttendanceRecords((prev) => {
          const exists = prev.some((p) => p.id === latest.id)
          if (exists) {
            return prev.map((p) => p.id === latest.id ? latest : p)
          } else {
            return [latest, ...prev].slice(0, 50)
          }
        })
        
        // Update last scan time for polling
        setLastScanTime(latest.scanTime)
      } else {
        console.log('❌ No records in response:', result)
        if (!result.success) {
          console.log('❌ API returned success: false')
        }
        if (!result.records || result.records.length === 0) {
          console.log('⚠️ No records found in response')
        }
      }
    } catch (error) {
      console.error("Error fetching live attendance:", error)
    } finally {
      setLoadingAttendance(false)
    }
  }, [lastScanTime])

  // Initial load
  useEffect(() => {
    console.log('🔄 Component mounted - fetching initial data...')
    fetchLiveAttendance(false)
  }, [fetchLiveAttendance])

  // Debug: Log when latest scan changes
  useEffect(() => {
    if (latestScan) {
      console.log('📊 Latest scan updated:', latestScan)
    } else {
      console.log('📊 Latest scan cleared')
    }
  }, [latestScan])

  // Auto-clear display after 10 seconds
  useEffect(() => {
    if (latestScan) {
      console.log('⏰ Starting 10-second timer to clear display...')
      const clearTimer = setTimeout(() => {
        console.log('⏰ 10 seconds elapsed - clearing display')
        setLatestScan(null)
      }, 10000) // 10 seconds

      return () => {
        console.log('⏰ Clearing timer (new scan detected or component unmounting)')
        clearTimeout(clearTimer)
      }
    }
  }, [latestScan])

  // Supabase Realtime: Listen for new attendance records
  useEffect(() => {
    console.log('🔴 Setting up Supabase realtime subscription...')
    
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records'
        },
        (payload) => {
          console.log('🔴 REALTIME: New attendance record inserted!', payload)
          // Fetch the latest attendance immediately when new record is detected
          fetchLiveAttendance(false)
        }
      )
      .subscribe((status) => {
        console.log('🔴 Realtime subscription status:', status)
      })

    return () => {
      console.log('🔴 Cleaning up Supabase realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [fetchLiveAttendance])

  // Auto-refresh: Poll for new records every 10 seconds as fallback
  useEffect(() => {
    console.log('🔄 Starting fallback polling (every 10 seconds)')
    const interval = setInterval(() => {
      console.log('🔄 Fallback check for new scans...')
      fetchLiveAttendance(true)
    }, 10000) // 10 seconds as fallback
    return () => {
      console.log('🔄 Stopping fallback polling')
      clearInterval(interval)
    }
  }, [fetchLiveAttendance])

  // Update current time on client side only
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      )
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Enable timeout mode for 5 seconds
  const enableTimeoutMode = async () => {
    try {
      const response = await fetch('/api/admin/attendance-live', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'enable-timeout' }),
      })

      const result = await response.json()
      
      if (result.success) {
        setTimeoutModeActive(true)
        setTimeoutCountdown(5)
        
        // Countdown timer
        const countdownInterval = setInterval(() => {
          setTimeoutCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval)
              setTimeoutModeActive(false)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        console.error('Failed to enable timeout mode:', result.error)
        showAlert({ message: 'Failed to enable timeout mode. Please try again.', type: 'error' })
      }
    } catch (error) {
      console.error('Error enabling timeout mode:', error)
      showAlert({ message: 'Error enabling timeout mode. Please try again.', type: 'error' })
    }
  }

  // Filter records based on selected filter type using database scanType field
  const filteredRecords = useMemo(() => {
    if (filterType === "all") {
      return attendanceRecords
    }
    return attendanceRecords.filter((record) => {
      // Use scanType from database, not calculated from history
      return record.scanType === filterType
    })
  }, [attendanceRecords, filterType])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">RFID Scan Display</h1>
              <p className="text-gray-400">Live attendance monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Time In/Out Toggle */}
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
              <Button
                variant={filterType === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
                className={`${
                  filterType === "all"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                All
              </Button>
              <Button
                variant={filterType === "timein" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("timein")}
                className={`${
                  filterType === "timein"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <LogIn className="w-4 h-4 mr-1" />
                Time In
              </Button>
              <Button
                variant={filterType === "timeout" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilterType("timeout")}
                className={`${
                  filterType === "timeout"
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <LogOut className="w-4 h-4 mr-1" />
                Time Out
              </Button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-lg font-semibold" suppressHydrationWarning>
                {currentTime || "--:--:--"}
              </div>
            </div>
            {/* Time Out Button */}
            <Button
              onClick={enableTimeoutMode}
              disabled={timeoutModeActive}
              className={`${
                timeoutModeActive
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              } font-bold text-lg px-6 py-3 shadow-lg`}
            >
              <LogOut className="w-5 h-5 mr-2" />
              {timeoutModeActive ? `Time Out Mode: ${timeoutCountdown}s` : "Record Time Out (5s)"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLiveAttendance(false)}
              disabled={loadingAttendance}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${loadingAttendance ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Latest Scan Display - Large Prominent Display */}
        {latestScan ? (
          <Card className="mb-6 border-4 border-red-500 bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl animate-pulse">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-8">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {latestScan.studentPhoto ? (
                    <Image
                      src={latestScan.studentPhoto}
                      alt={latestScan.studentName || "Person"}
                      width={200}
                      height={200}
                      className="rounded-full border-4 border-red-500 shadow-2xl object-cover"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] rounded-full border-4 border-red-500 bg-gray-700 flex items-center justify-center shadow-2xl">
                      <User className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Information */}
                <div className="flex-1 text-center">
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Name</div>
                    <div className="text-5xl font-bold text-white mb-4">{latestScan.studentName || "Unknown"}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* For Students: Grade & Section */}
                    {!latestScan.isTeacher && (
                      <>
                        <div>
                          <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Grade Level</div>
                          <div className="text-3xl font-bold text-white">{latestScan.gradeLevel || "N/A"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Section</div>
                          <div className="text-3xl font-bold text-white">{latestScan.section || "N/A"}</div>
                        </div>
                      </>
                    )}
                    
                    {/* For Teachers: Subject */}
                    {latestScan.isTeacher && (
                      <div className="col-span-2">
                        <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Subject</div>
                        <div className="text-3xl font-bold text-white">{latestScan.subject || "N/A"}</div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Date</div>
                      <div className="text-2xl font-bold text-white">{formatDate(latestScan.scanTime)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Time</div>
                      <div className="text-2xl font-bold text-white">{formatTime(latestScan.scanTime)}</div>
                    </div>
                  </div>
                  
                  {/* Scan Type Badge */}
                  <div className="mt-6">
                    <Badge
                      className={
                        latestScan.scanType === "timein"
                          ? "bg-green-600 text-white text-xl px-6 py-2"
                          : latestScan.scanType === "timeout"
                          ? "bg-orange-600 text-white text-xl px-6 py-2"
                          : "bg-gray-600 text-white text-xl px-6 py-2"
                      }
                    >
                      {latestScan.scanType === "timein" ? "TIME IN" : 
                       latestScan.scanType === "timeout" ? "TIME OUT" : 
                       "SCAN RECORDED"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 bg-gray-800 border-gray-700">
            <CardContent className="py-20">
              <div className="text-center text-gray-400">
                <Radio className="w-24 h-24 mx-auto mb-6 opacity-50" />
                <p className="text-2xl">Waiting for RFID scan...</p>
                <p className="text-sm mt-2">Scan an RFID card to see the latest attendance record</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


