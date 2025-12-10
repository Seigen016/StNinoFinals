"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Download,
  RefreshCcw
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

interface Student {
  studentId: string
  studentName: string
  gradeLevel: string
  section: string
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  percentage: number
  dailyAttendance: Record<string, string>
  records: any[]
}

interface AttendanceReportsData {
  general: {
    totalStudents: number
    totalPresent: number
    totalAbsent: number
    totalLate: number
    totalDays: number
    presentPercentage: number
    absentPercentage: number
  }
  students: Student[]
  selectedStudent: Student | null
  dateRange: {
    start: string
    end: string
  }
  filters: {
    gradeLevels: string[]
    sections: string[]
  }
}

export default function AttendanceReportsPage() {
  const [data, setData] = useState<AttendanceReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [gradeLevel, setGradeLevel] = useState<string>("all")
  const [section, setSection] = useState<string>("all")
  
  // Calculate default start date (30 days ago)
  useEffect(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (selectedStudentId) params.append('studentId', selectedStudentId)
      if (gradeLevel && gradeLevel !== 'all') params.append('gradeLevel', gradeLevel)
      if (section && section !== 'all') params.append('section', section)
      
      console.log('🔍 Fetching attendance reports with params:', params.toString())
      const response = await fetch(`/api/admin/attendance-reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('📊 API Response:', result)
      
      if (result.success && result.data) {
        setData(result.data)
        setError(null)
        // Auto-select first student if none selected
        if (!selectedStudentId && result.data.students.length > 0) {
          setSelectedStudentId(result.data.students[0].studentId)
        }
      } else {
        setError(result.error || 'Failed to fetch attendance data')
        setData(null)
      }
    } catch (error: any) {
      console.error("❌ Error fetching attendance reports:", error)
      setError(error?.message || 'An error occurred while fetching attendance data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate, selectedStudentId, gradeLevel, section])

  const selectedStudent = useMemo(() => {
    if (!data || !selectedStudentId) return null
    return data.students.find((s) => s.studentId === selectedStudentId) || data.selectedStudent
  }, [data, selectedStudentId])

  // Generate date range for table
  const dateRange = useMemo(() => {
    if (!data) return []
    const dates: string[] = []
    const start = new Date(data.dateRange.start)
    const end = new Date(data.dateRange.end)
    console.log(`start date: ${start}, end date: ${end}`);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0])
    }
    
    return dates
  }, [data])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    })
  }

  const getAttendanceCodeColor = (code: string) => {
    switch (code) {
      case 'PR': return 'bg-green-500 text-white'
      case 'AC': return 'bg-red-500 text-white'
      case 'LA': return 'bg-yellow-500 text-white'
      case 'EX': return 'bg-blue-500 text-white'
      case 'HO': return 'bg-gray-400 text-white'
      case 'EA': return 'bg-orange-500 text-white'
      case 'DA': return 'bg-purple-500 text-white'
      case 'SU': return 'bg-red-700 text-white'
      case 'O': return 'bg-gray-500 text-white'
      case 'VA': return 'bg-blue-400 text-white'
      case 'CR': return 'bg-purple-400 text-white'
      case 'D1': case 'D2': case 'D3': case 'D4': case 'D5': case 'D6':
        return 'bg-indigo-500 text-white'
      default: return 'bg-gray-300 text-gray-700'
    }
  }

  const getAttendanceCodeLabel = (code: string) => {
    const codes: Record<string, string> = {
      'PR': 'Present',
      'AC': 'Absent - Coded',
      'LA': 'Late',
      'EX': 'Excused',
      'HO': 'Holiday',
      'EA': 'Early Absent',
      'DA': 'Day Absent',
      'SU': 'Suspended',
      'O': 'Other',
      'VA': 'Vacation',
      'CR': 'Credit',
      'D1': 'Day 1',
      'D2': 'Day 2',
      'D3': 'Day 3',
      'D4': 'Day 4',
      'D5': 'Day 5',
      'D6': 'Day 6',
    }
    return codes[code] || code
  }

  const exportToCSV = () => {
    if (!data || !data.students.length) return

    // Create CSV header
    const headers = ['#', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', '%', ...dateRange.map(d => formatDate(d))]
    const rows = [headers]

    // Add student data
    data.students.forEach((student, index) => {
      const row = [
        (index + 1).toString(),
        student.studentName,
        student.totalDays.toString(),
        student.present.toString(),
        student.absent.toString(),
        student.late.toString(),
        student.excused.toString(),
        `${student.percentage}%`,
        ...dateRange.map(date => student.dailyAttendance[date] || '-')
      ]
      rows.push(row)
    })

    // Convert to CSV string
    const csvContent = rows.map(row => 
      row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance-report-${startDate}-to-${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Calculate attendance breakdown for selected student
  const attendanceBreakdown = useMemo(() => {
    if (!selectedStudent) return null
    
    const breakdown: Record<string, number> = {
      'PR': 0,
      'AC': 0,
      'LA': 0,
      'EX': 0,
      'HO': 0,
      'EA': 0,
      'DA': 0,
      'SU': 0,
      'O': 0,
      'VA': 0,
      'CR': 0,
      'D1': 0,
      'D2': 0,
      'D3': 0,
      'D4': 0,
      'D5': 0,
      'D6': 0,
    }
    
    Object.values(selectedStudent.dailyAttendance).forEach(code => {
      if (breakdown.hasOwnProperty(code)) {
        breakdown[code]++
      }
    })
    
    return breakdown
  }, [selectedStudent])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCcw className="w-8 h-8 animate-spin mx-auto mb-4 text-red-800" />
          <p className="text-gray-600">Loading attendance reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-red-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-red-800" style={{ fontFamily: 'serif' }}>Attendance Tracker</h1>
                <p className="text-sm text-gray-600">Student attendance monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Label htmlFor="startDate" className="text-sm">Start Date:</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="endDate" className="text-sm">End Date:</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              {data && data.students.length > 0 && (
                <Button onClick={exportToCSV} variant="outline" size="sm" className="bg-green-50 hover:bg-green-100">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-red-600 mb-4">
                <p className="text-lg font-semibold">Error Loading Attendance Data</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
              <Button onClick={fetchData} variant="outline" className="mt-4">
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : !data || data.students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">No attendance data available.</p>
              <p className="text-sm text-gray-500 mt-2">Students will appear here once they start scanning their RFID cards.</p>
              <p className="text-xs text-gray-400 mt-4">
                Date Range: {startDate} to {endDate}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* General Attendance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Donut Chart Section */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-red-800 uppercase">General Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {data.general.absentPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Absent</div>
                    </div>
                    <div className="relative w-32 h-32">
                      <svg className="transform -rotate-90 w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 56}`}
                          strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.general.presentPercentage / 100)}`}
                          className="text-green-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {data.general.presentPercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Present</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {data.general.presentPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Present</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Student Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Select Student</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="studentSelect" className="text-sm mb-2 block">Select Name:</Label>
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger id="studentSelect">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {data.students.map((student) => (
                          <SelectItem key={student.studentId} value={student.studentId}>
                            {student.studentName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStudent && (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-gray-800">Total Days</div>
                          <div className="text-2xl font-bold text-red-800">{selectedStudent.totalDays}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-800">Present</div>
                          <div className="text-2xl font-bold text-green-600">{selectedStudent.present}</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-800">%</div>
                          <div className="text-2xl font-bold text-red-800 bg-red-50 px-3 py-1 rounded">
                            {selectedStudent.percentage}%
                          </div>
                        </div>
                      </div>

                      {attendanceBreakdown && (
                        <div className="pt-4 border-t">
                          <div className="text-sm font-semibold text-gray-700 mb-2">Attendance Breakdown:</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {Object.entries(attendanceBreakdown)
                              .filter(([_, count]) => count > 0)
                              .map(([code, count]) => (
                                <div key={code} className="flex items-center justify-between">
                                  <span className="font-medium">{code}:</span>
                                  <span className="text-gray-600">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-red-800 text-sm">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gradeFilter" className="text-sm mb-2 block">Grade Level:</Label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel}>
                      <SelectTrigger id="gradeFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {data.filters.gradeLevels.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sectionFilter" className="text-sm mb-2 block">Section:</Label>
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger id="sectionFilter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {data.filters.sections.map((sec) => (
                          <SelectItem key={sec} value={sec}>
                            {sec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Percentage Bar Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-red-800">Attendance Percentage by Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.students.slice(0, 10).map((student) => (
                    <div key={student.studentId} className="flex items-center space-x-4">
                      <div className="w-32 text-sm text-gray-700 truncate">
                        {student.studentName}
                      </div>
                      <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full ${
                            student.percentage >= 90
                              ? 'bg-green-500'
                              : student.percentage >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          } transition-all duration-500`}
                          style={{ width: `${student.percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-900">
                            {student.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Attendance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Daily Attendance Records</CardTitle>
                <CardDescription>
                  Showing attendance for {data.students.length} student{data.students.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Total Days</TableHead>
                        <TableHead className="text-center">Present</TableHead>
                        <TableHead className="text-center">%</TableHead>
                        {dateRange.map((date) => (
                          <TableHead key={date} className="text-center min-w-[80px]">
                            {formatDate(date)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.students.map((student, index) => (
                        <TableRow key={student.studentId}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-semibold">{student.studentName}</TableCell>
                          <TableCell className="text-center">{student.totalDays}</TableCell>
                          <TableCell className="text-center">{student.present}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                student.percentage >= 90
                                  ? 'bg-green-500'
                                  : student.percentage >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }
                            >
                              {student.percentage}%
                            </Badge>
                          </TableCell>
                          {dateRange.map((date) => {
                            const code = student.dailyAttendance[date] || '-'
                            return (
                              <TableCell key={date} className="text-center">
                                {code !== '-' ? (
                                  <Badge
                                    className={`${getAttendanceCodeColor(code)} text-xs px-1 py-0`}
                                    title={getAttendanceCodeLabel(code)}
                                  >
                                    {code}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

