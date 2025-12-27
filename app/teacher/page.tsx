"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabaseClient"
import { useAlert } from "@/lib/use-alert"
import { useConfirm } from "@/lib/use-confirm"
import {
  BookOpen,
  Calendar,
  ChevronDownIcon,
  Clock,
  Download,
  GraduationCap,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Plus,
  Save,
  Settings,
  User
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"


interface Teacher {
  id: number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  subject?: string
  subjects?: string
  [key: string]: any
}

export default function TeacherPortal() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [journalEntry, setJournalEntry] = useState({
    date: "",
    subject: "",
    topic: "",
    activities: "",
    notes: "",
  })
  const [showAddJournal, setShowAddJournal] = useState(false)
  const [schedule, setSchedule] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSection, setSelectedSection] = useState("Section A")
  const [selectedQuarter, setSelectedQuarter] = useState("Q1")
  const [gradesData, setGradesData] = useState<any[]>([])
  const [isSavingGrades, setIsSavingGrades] = useState(false)
  const [teacherStats, setTeacherStats] = useState<any>(null)
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Get day name from date
  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[date.getDay()]
  }

  // Get grading weights based on subject type
  const getGradingWeights = (subject: string) => {
    const subjectLower = subject?.toLowerCase() || ""
    
    // Group 1: Filipino/English/AP/ESP/MT
    if (
      subjectLower.includes("filipino") ||
      subjectLower.includes("english") ||
      subjectLower.includes("araling panlipunan") ||
      subjectLower.includes("ap") ||
      subjectLower.includes("esp") ||
      subjectLower.includes("edukasyon sa pagpapakatao") ||
      subjectLower.includes("mother tongue") ||
      subjectLower.includes("mt")
    ) {
      return {
        writtenWork: 30,
        performanceTasks: 50,
        quarterlyAssessment: 20,
      }
    }
    
    // Group 2: Science/Mathematics
    if (
      subjectLower.includes("science") ||
      subjectLower.includes("mathematics") ||
      subjectLower.includes("math")
    ) {
      return {
        writtenWork: 40,
        performanceTasks: 40,
        quarterlyAssessment: 20,
      }
    }
    
    // Group 3: MAPEH/EPP/TLE/ELECTIVE/WRITING
    if (
      subjectLower.includes("mapeh") ||
      subjectLower.includes("music") ||
      subjectLower.includes("arts") ||
      subjectLower.includes("physical education") ||
      subjectLower.includes("health") ||
      subjectLower.includes("epp") ||
      subjectLower.includes("tle") ||
      subjectLower.includes("technology") ||
      subjectLower.includes("livelihood") ||
      subjectLower.includes("elective") ||
      subjectLower.includes("writing")
    ) {
      return {
        writtenWork: 20,
        performanceTasks: 60,
        quarterlyAssessment: 20,
      }
    }
    
    // Default to Group 1 if subject not recognized
    return {
      writtenWork: 30,
      performanceTasks: 50,
      quarterlyAssessment: 20,
    }
  }

  // Fetch real grades data
  useEffect(() => {
    if (teacher && teacher.id) {
      fetchGradesData()
    }
  }, [teacher, selectedSection, selectedQuarter])

  const fetchGradesData = async () => {
    if (!teacher || !teacher.id) return
    
    setIsLoadingData(true)
    try {
      const teacherSubject = teacher.subject || teacher.subjects || teacher.specialization || "General"
      const response = await fetch(
        `/api/teacher/grades?teacherId=${teacher.id}&section=${selectedSection}&subject=${encodeURIComponent(teacherSubject)}`
      )
      const data = await response.json()
      
      if (data.success && data.data) {
        setGradesData(data.data)
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Calculate final grade for a student
  const calculateFinalGrade = (student: any) => {
    const teacherSubject = teacher?.subject || teacher?.subjects || "Mathematics"
    const weights = getGradingWeights(teacherSubject)

    // Calculate Written Work average
    const writtenWorkScores = student.writtenWork
      .map((score: string) => parseFloat(score) || 0)
      .filter((score: number) => score > 0)
    const writtenWorkAvg =
      writtenWorkScores.length > 0
        ? writtenWorkScores.reduce((a: number, b: number) => a + b, 0) / writtenWorkScores.length
        : 0

    // Calculate Performance Tasks average
    const performanceScores = student.performanceTasks
      .map((score: string) => parseFloat(score) || 0)
      .filter((score: number) => score > 0)
    const performanceAvg =
      performanceScores.length > 0
        ? performanceScores.reduce((a: number, b: number) => a + b, 0) / performanceScores.length
        : 0

    // Quarterly Assessment
    const quarterlyScore = parseFloat(student.quarterlyAssessment) || 0

    // Calculate weighted final grade
    const finalGrade =
      (writtenWorkAvg * weights.writtenWork) / 100 +
      (performanceAvg * weights.performanceTasks) / 100 +
      (quarterlyScore * weights.quarterlyAssessment) / 100

    return finalGrade > 0 ? finalGrade.toFixed(2) : ""
  }

  // Update grade value
  const updateGrade = (studentId: number, category: string, index: number | null, value: string) => {
    setGradesData((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          if (index !== null) {
            // Array field (writtenWork or performanceTasks)
            const newArray = [...student[category]]
            newArray[index] = value
            return { ...student, [category]: newArray }
          } else {
            // Single field (quarterlyAssessment)
            return { ...student, [category]: value }
          }
        }
        return student
      })
    )
  }

  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()

  // Save grades
  const handleSaveGrades = async () => {
    if (!teacher || !teacher.id) {
      showAlert({ message: "Teacher information not found", type: "error" })
      return
    }

    setIsSavingGrades(true)
    try {
      const teacherSubject = teacher.subject || teacher.subjects || teacher.specialization || "General"
      const response = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          subject: teacherSubject,
          section: selectedSection,
          quarter: selectedQuarter,
          grades: gradesData
        })
      })

      const data = await response.json()
      
      if (data.success) {
        showAlert({ message: "Grades saved successfully!", type: "success" })
      } else {
        showAlert({ message: data.error || "Failed to save grades", type: "error" })
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      showAlert({ message: "Error saving grades. Please try again.", type: "error" })
    } finally {
      setIsSavingGrades(false)
    }
  }

  // Export grades to CSV
  const handleExportToCSV = () => {
    if (!teacher || gradesData.length === 0) {
      showAlert({ message: "No grades data to export.", type: "warning" })
      return
    }

    const teacherSubject = teacher.subject || teacher.subjects || "Mathematics"
    const weights = getGradingWeights(teacherSubject)

    // Create CSV header
    const headers = [
      "Student Number",
      "Student Name",
      "WW1", "WW2", "WW3", "WW4", "WW5",
      "PT1", "PT2", "PT3", "PT4", "PT5",
      "Quarterly Assessment",
      "Final Grade",
    ]

    // Create CSV rows
    const rows = gradesData.map((student) => {
      const finalGrade = calculateFinalGrade(student)
      return [
        student.studentNumber || "",
        student.name || "",
        ...student.writtenWork.map((score: string) => score || ""),
        ...student.performanceTasks.map((score: string) => score || ""),
        student.quarterlyAssessment || "",
        finalGrade || "",
      ]
    })

    // Combine header and rows
    const csvContent = [
      // Metadata rows
      [`Subject: ${teacherSubject}`],
      [`Section: ${selectedSection}`],
      [`Quarter: ${selectedQuarter}`],
      [`Grading System: Written Work ${weights.writtenWork}%, Performance Tasks ${weights.performanceTasks}%, Quarterly Assessment ${weights.quarterlyAssessment}%`],
      [], // Empty row
      headers, // Column headers
      ...rows, // Data rows
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `Grades_${teacherSubject.replace(/\s+/g, "_")}_${selectedSection}_${selectedQuarter}_${new Date().toISOString().split("T")[0]}.csv`
    )
    link.style.visibility = "hidden"
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Fetch schedule for selected date
  useEffect(() => {
    if (teacher && teacher.id) {
      fetchSchedule()
    }
  }, [selectedDate, teacher])

  const fetchSchedule = async () => {
    if (!teacher || !teacher.id) return
    
    try {
      const response = await fetch(
        `/api/teacher/schedule?teacherId=${teacher.id}&date=${selectedDate}`
      )
      const data = await response.json()
      
      if (data.success && data.data) {
        setSchedule(data.data)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    }
  }

  // Fetch teacher stats and journal entries
  useEffect(() => {
    if (teacher && teacher.id) {
      fetchTeacherStats()
      fetchJournalEntries()
    }
  }, [teacher])

  const fetchTeacherStats = async () => {
    if (!teacher || !teacher.id) return
    
    try {
      const response = await fetch(`/api/teacher/stats?teacherId=${teacher.id}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setTeacherStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error)
    }
  }

  const fetchJournalEntries = async () => {
    if (!teacher || !teacher.id) return
    
    try {
      const response = await fetch(`/api/teacher/journal?teacherId=${teacher.id}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setJournalEntries(data.data)
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    }
  }

  // Check if teacher is logged in on component mount
  useEffect(() => {
    const storedTeacher = localStorage.getItem("teacher")
    if (storedTeacher) {
      try {
        const teacherData = JSON.parse(storedTeacher)
        setTeacher(teacherData)
      } catch (error) {
        console.error("Error parsing stored teacher data:", error)
        localStorage.removeItem("teacher")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      // Check if response is ok
      if (!response.ok) {
        // Try to parse error message
        const errorData = await response.json().catch(() => ({ error: 'Network error occurred' }))
        setLoginError(errorData.error || `Server error (${response.status}). Please try again.`)
        return
      }

      const data = await response.json()

      if (data.success && data.teacher) {
        setTeacher(data.teacher)
        localStorage.setItem("teacher", JSON.stringify(data.teacher))
        setLoginEmail("")
        setLoginPassword("")
        setLoginError(null)
      } else {
        setLoginError(data.error || "Login failed. Please check your credentials.")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      // Provide more specific error messages
      const errorMessage = error?.message || String(error) || ''
      if (errorMessage && (errorMessage.includes('fetch') || errorMessage.includes('network'))) {
        setLoginError("Network error. Please check your internet connection and try again.")
      } else if (errorMessage && errorMessage.includes('Failed to fetch')) {
        setLoginError("Cannot connect to the server. Please make sure the server is running.")
      } else {
        setLoginError(`An error occurred: ${errorMessage || 'Please try again.'}`)
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to log out?",
      confirmText: "Logout",
      cancelText: "Cancel",
      variant: "destructive"
    })
    
    if (confirmed) {
      await supabase.auth.signOut()
      localStorage.removeItem("teacher")
      setTeacher(null)
      window.location.href = "/"
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-red-800">Loading...</div>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Sto Niño de Praga Academy Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">Teacher Login</CardTitle>
            <CardDescription>Sto Niño de Praga Academy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-red-800">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="teacher@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="border-red-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-red-800">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="border-red-200"
                />
              </div>
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {loginError}
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-red-800 hover:bg-red-700"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
              <div className="text-center">
                <Link href="/">
                  <Button type="button" variant="outline" className="border-red-800 text-red-800">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleGradeUpdate = async (studentId: number, subject: string, newGrade: number) => {
    try {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, subject, grade: newGrade }),
      })

      const data = await response.json()

      if (data.success) {
        showAlert({ message: "Grade updated successfully!", type: "success" })
        // Reload the page to show updated grades
        window.location.reload()
      } else {
        showAlert({ message: data.error || "Failed to update grade. Please try again.", type: "error" })
      }
    } catch (error) {
      console.error("Grade update error:", error)
      showAlert({ message: "Error updating grade. Please try again.", type: "error" })
    }
  }

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teacher || !teacher.id) {
      showAlert({ message: "Teacher information not found", type: "error" })
      return
    }

    try {
      const response = await fetch("/api/teacher/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journalEntry,
          teacherId: teacher.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        showAlert({ message: "Journal entry saved successfully!", type: "success" })
        setShowAddJournal(false)
        setJournalEntry({ date: "", subject: "", topic: "", activities: "", notes: "" })
        // Refresh journal entries
        fetchJournalEntries()
      } else {
        showAlert({ message: data.error || "Failed to save journal entry. Please try again.", type: "error" })
      }
    } catch (error) {
      console.error("Journal submission error:", error)
      showAlert({ message: "Error saving journal entry. Please try again.", type: "error" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
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
                <h1 className="text-xl font-bold text-red-800">Teacher Portal</h1>
                <p className="text-sm text-gray-600">Sto Niño de Praga Academy</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </Link>
              <div className="text-right">
                <p className="font-medium text-red-800">
                  {teacher.name || 
                   (teacher.first_name && teacher.last_name 
                     ? `${teacher.first_name} ${teacher.last_name}` 
                     : teacher.email)}
                </p>
                <p className="text-sm text-gray-600">
                  {teacher.subjects || teacher.subject || "Teacher"}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-800 text-red-800 hover:bg-red-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              My Account
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="grades" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-2" />
              Manage Grades
            </TabsTrigger>
            <TabsTrigger value="journal" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Teaching Journal
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="logout" className="data-[state=active]:bg-red-800 data-[state=active]:text-white">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-red-800">
                <CardHeader className="pb-2">
                  <CardDescription>Total Students</CardDescription>
                  <CardTitle className="text-3xl text-red-800">
                    {teacherStats?.totalStudents || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Across all your classes</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="pb-2">
                  <CardDescription>Classes Today</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">
                    {teacherStats?.classesToday || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Scheduled for today</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="pb-2">
                  <CardDescription>Journal Entries</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {teacherStats?.journalEntries || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Total entries recorded</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-600">
                <CardHeader className="pb-2">
                  <CardDescription>Pending Grades</CardDescription>
                  <CardTitle className="text-3xl text-orange-600">
                    {teacherStats?.pendingGrades || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Awaiting submission</p>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule */}
            {teacherStats?.todaySchedule && teacherStats.todaySchedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Today's Schedule
                  </CardTitle>
                  <CardDescription>Your classes scheduled for today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacherStats.todaySchedule.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-red-800">{item.timeStart}</div>
                            <div className="text-xs text-gray-500">{item.timeEnd}</div>
                          </div>
                          <div>
                            <div className="font-medium">{item.subject}</div>
                            <div className="text-sm text-gray-600">{item.section} • {item.room}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            {teacherStats?.announcements && teacherStats.announcements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Recent Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacherStats.announcements.map((announcement: any) => (
                      <div key={announcement.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-800">{announcement.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                          </div>
                          {announcement.priority && (
                            <Badge variant={announcement.priority === 'high' ? 'destructive' : 'default'}>
                              {announcement.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab('grades')}
                    className="bg-red-800 hover:bg-red-700 h-auto py-4"
                  >
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Manage Grades
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('journal')}
                    variant="outline"
                    className="border-red-800 text-red-800 hover:bg-red-50 h-auto py-4"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Add Journal Entry
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('calendar')}
                    variant="outline"
                    className="border-red-800 text-red-800 hover:bg-red-50 h-auto py-4"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    View Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">My Account Information</CardTitle>
                <CardDescription>View your account details and information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-800 flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Personal Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-600">Full Name</Label>
                          <p className="font-medium text-red-800">
                            {teacher.name || 
                             (teacher.first_name && teacher.last_name 
                               ? `${teacher.first_name} ${teacher.last_name}` 
                               : "Not provided")}
                          </p>
                        </div>
                        {teacher.first_name && (
                          <div>
                            <Label className="text-gray-600">First Name</Label>
                            <p className="font-medium">{teacher.first_name}</p>
                          </div>
                        )}
                        {teacher.last_name && (
                          <div>
                            <Label className="text-gray-600">Last Name</Label>
                            <p className="font-medium">{teacher.last_name}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-gray-600 flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            Email Address
                          </Label>
                          <p className="font-medium">{teacher.email}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-800 flex items-center">
                          <BookOpen className="w-5 h-5 mr-2" />
                          Teaching Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-gray-600">Subject(s)</Label>
                          <p className="font-medium text-red-800">
                            {teacher.subjects || teacher.subject || "Not assigned"}
                          </p>
                        </div>
                        {teacher.teacher_id && (
                          <div>
                            <Label className="text-gray-600">Teacher ID</Label>
                            <p className="font-medium">{teacher.teacher_id}</p>
                          </div>
                        )}
                        {teacher.department && (
                          <div>
                            <Label className="text-gray-600">Department</Label>
                            <p className="font-medium">{teacher.department}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Information */}
                  {(teacher.phone || teacher.address || teacher.contact_number) && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-red-800">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacher.phone && (
                          <div>
                            <Label className="text-gray-600">Phone</Label>
                            <p className="font-medium">{teacher.phone}</p>
                          </div>
                        )}
                        {teacher.contact_number && (
                          <div>
                            <Label className="text-gray-600">Contact Number</Label>
                            <p className="font-medium">{teacher.contact_number}</p>
                          </div>
                        )}
                        {teacher.address && (
                          <div className="md:col-span-2">
                            <Label className="text-gray-600">Address</Label>
                            <p className="font-medium">{teacher.address}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Display all other fields */}
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-800">Additional Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(teacher)
                          .filter(([key]) => 
                            !['id', 'email', 'password', 'name', 'first_name', 'last_name', 
                              'subjects', 'subject', 'teacher_id', 'department', 'phone', 
                              'contact_number', 'address'].includes(key))
                          .map(([key, value]) => (
                            value && (
                              <div key={key}>
                                <Label className="text-gray-600 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </Label>
                                <p className="font-medium">{String(value)}</p>
                              </div>
                            )
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Daily Class Schedule</CardTitle>
                <CardDescription>View your class schedule timeline for the day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Date Selector */}
                  <div className="flex flex-col gap-3 mb-6">
                    <Label htmlFor="schedule-date" className="text-sm font-medium">
                      Select Date
                    </Label>
                    <div className="flex items-center gap-4">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="schedule-date"
                            className="w-64 justify-between font-normal border-red-200 hover:bg-red-50"
                          >
                            {new Date(selectedDate).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                            <ChevronDownIcon className="h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate ? new Date(selectedDate) : new Date()}
                            captionLayout="dropdown"
                            onSelect={(date) => {
                              if (date) {
                                // Format date in local timezone to avoid off-by-one errors
                                const year = date.getFullYear()
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const day = String(date.getDate()).padStart(2, '0')
                                setSelectedDate(`${year}-${month}-${day}`)
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <Badge variant="outline" className="text-sm px-3 py-1">
                        {getDayName(selectedDate)}
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline */}
                  {schedule.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-red-200"></div>
                      
                      {/* Schedule items */}
                      <div className="space-y-6">
                        {schedule.map((item, index) => (
                          <div key={item.id} className="relative flex items-start gap-4">
                            {/* Time indicator */}
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full bg-red-800 flex items-center justify-center text-white font-semibold shadow-lg">
                                <div className="text-center">
                                  <div className="text-xs leading-tight">{item.timeStart}</div>
                                  <div className="text-xs leading-tight">-</div>
                                  <div className="text-xs leading-tight">{item.timeEnd}</div>
                                </div>
                              </div>
                            </div>

                            {/* Schedule card */}
                            <Card className="flex-1 ml-4 border-l-4 border-l-red-800 shadow-md">
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-500 mb-1">Subject</div>
                                    <div className="text-lg font-semibold text-red-800">{item.subject}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500 mb-1">Room Number</div>
                                    <div className="text-lg font-semibold">{item.room}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-500 mb-1">Section</div>
                                    <div className="text-lg font-semibold">{item.section}</div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="w-4 h-4" />
                                  <span>Duration: {item.timeStart} - {item.timeEnd}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No classes scheduled for {getDayName(selectedDate)}</p>
                      <p className="text-sm text-gray-500">Select a different date to view your schedule</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grades Management Tab */}
          <TabsContent value="grades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Student Grades Management</CardTitle>
                <CardDescription>View and update student grades for your classes</CardDescription>
              </CardHeader>
              <CardContent>
                {teacher ? (
                  <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="section-select" className="text-sm font-medium">Section:</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                          <SelectTrigger id="section-select" className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Section A">Section A</SelectItem>
                            <SelectItem value="Section B">Section B</SelectItem>
                            <SelectItem value="Section C">Section C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="quarter-select" className="text-sm font-medium">Quarter:</Label>
                        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                          <SelectTrigger id="quarter-select" className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Q1">Q1</SelectItem>
                            <SelectItem value="Q2">Q2</SelectItem>
                            <SelectItem value="Q3">Q3</SelectItem>
                            <SelectItem value="Q4">Q4</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline" className="text-sm">
                          Subject: {teacher.subject || teacher.subjects || teacher.specialization || "N/A"}
                        </Badge>
                      </div>
                    </div>

                    {isLoadingData ? (
                      <div className="text-center py-12">
                        <div className="text-xl font-bold text-red-800">Loading grades data...</div>
                      </div>
                    ) : gradesData.length === 0 ? (
                      <div className="text-center py-12">
                        <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">No students found for {selectedSection}</p>
                        <p className="text-sm text-gray-500">Select a different section or make sure students are enrolled in your classes.</p>
                      </div>
                    ) : (
                      <>
                        {/* Grading System Info */}
                        {(() => {
                          const teacherSubject = teacher.subject || teacher.subjects || teacher.specialization || "Mathematics"
                      const weights = getGradingWeights(teacherSubject)
                      return (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900 mb-2">Grading System ({teacherSubject}):</div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Written Work: </span>
                              <span className="text-blue-700">{weights.writtenWork}%</span>
                            </div>
                            <div>
                              <span className="font-medium">Performance Tasks: </span>
                              <span className="text-blue-700">{weights.performanceTasks}%</span>
                            </div>
                            <div>
                              <span className="font-medium">Quarterly Assessment: </span>
                              <span className="text-blue-700">{weights.quarterlyAssessment}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Spreadsheet-like Grades Table */}
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-800 text-white">
                            <TableHead className="text-white font-bold sticky left-0 bg-red-800 z-10 min-w-[150px]">
                              Student Name
                            </TableHead>
                            <TableHead className="text-white font-bold sticky left-[150px] bg-red-800 z-10 min-w-[100px]">
                              Student No.
                            </TableHead>
                            <TableHead colSpan={5} className="text-white font-bold text-center border-l-2 border-white">
                              Written Work ({(() => {
                                const teacherSubject = teacher.subject || teacher.subjects || "Mathematics"
                                return getGradingWeights(teacherSubject).writtenWork
                              })()}%)
                            </TableHead>
                            <TableHead colSpan={5} className="text-white font-bold text-center border-l-2 border-white">
                              Performance Tasks ({(() => {
                                const teacherSubject = teacher.subject || teacher.subjects || "Mathematics"
                                return getGradingWeights(teacherSubject).performanceTasks
                              })()}%)
                            </TableHead>
                            <TableHead className="text-white font-bold text-center border-l-2 border-white min-w-[120px]">
                              Quarterly Assessment ({(() => {
                                const teacherSubject = teacher.subject || teacher.subjects || "Mathematics"
                                return getGradingWeights(teacherSubject).quarterlyAssessment
                              })()}%)
                            </TableHead>
                            <TableHead className="text-white font-bold text-center border-l-2 border-white min-w-[100px]">
                              Final Grade
                            </TableHead>
                          </TableRow>
                          <TableRow className="bg-gray-100">
                            <TableHead className="sticky left-0 bg-gray-100 z-10"></TableHead>
                            <TableHead className="sticky left-[150px] bg-gray-100 z-10"></TableHead>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <TableHead key={`ww-${i}`} className="text-center text-xs border-l min-w-[80px]">
                                WW{i + 1}
                              </TableHead>
                            ))}
                            {Array.from({ length: 5 }).map((_, i) => (
                              <TableHead key={`pt-${i}`} className="text-center text-xs border-l min-w-[80px]">
                                PT{i + 1}
                              </TableHead>
                            ))}
                            <TableHead className="text-center text-xs border-l"></TableHead>
                            <TableHead className="text-center text-xs border-l"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gradesData.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium sticky left-0 bg-white z-10 border-r">
                                {student.name}
                              </TableCell>
                              <TableCell className="sticky left-[150px] bg-white z-10 border-r">
                                {student.studentNumber}
                              </TableCell>
                              {/* Written Work cells */}
                              {student.writtenWork.map((score: string, index: number) => (
                                <TableCell key={`ww-${student.id}-${index}`} className="p-0 border-l">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={score}
                                    onChange={(e) =>
                                      updateGrade(student.id, "writtenWork", index, e.target.value)
                                    }
                                    className="border-0 rounded-none text-center focus:ring-2 focus:ring-red-500 h-10"
                                    placeholder="0"
                                  />
                                </TableCell>
                              ))}
                              {/* Performance Tasks cells */}
                              {student.performanceTasks.map((score: string, index: number) => (
                                <TableCell key={`pt-${student.id}-${index}`} className="p-0 border-l">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={score}
                                    onChange={(e) =>
                                      updateGrade(student.id, "performanceTasks", index, e.target.value)
                                    }
                                    className="border-0 rounded-none text-center focus:ring-2 focus:ring-red-500 h-10"
                                    placeholder="0"
                                  />
                                </TableCell>
                              ))}
                              {/* Quarterly Assessment cell */}
                              <TableCell className="p-0 border-l">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={student.quarterlyAssessment}
                                  onChange={(e) =>
                                    updateGrade(student.id, "quarterlyAssessment", null, e.target.value)
                                  }
                                  className="border-0 rounded-none text-center focus:ring-2 focus:ring-red-500 h-10"
                                  placeholder="0"
                                />
                              </TableCell>
                              {/* Final Grade cell */}
                              <TableCell className="text-center font-bold text-red-800 border-l bg-gray-50">
                                {calculateFinalGrade(student) || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Save and Export Buttons */}
                    <div className="flex justify-end gap-3">
                      <Button
                        onClick={handleExportToCSV}
                        variant="outline"
                        className="border-red-800 text-red-800 hover:bg-red-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export to CSV
                      </Button>
                      <Button
                        onClick={handleSaveGrades}
                        disabled={isSavingGrades}
                        className="bg-red-800 hover:bg-red-900"
                      >
                        {isSavingGrades ? (
                          <>
                            <Save className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Grades
                          </>
                        )}
                      </Button>
                    </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Please log in to manage grades.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teaching Journal Tab */}
          <TabsContent value="journal" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-red-800">Teaching Journal</CardTitle>
                  <CardDescription>Record your daily teaching activities and observations</CardDescription>
                </div>
                <Dialog open={showAddJournal} onOpenChange={setShowAddJournal}>
                  <DialogTrigger asChild>
                    <Button className="bg-red-800 hover:bg-red-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Journal Entry</DialogTitle>
                      <DialogDescription>Record your teaching activities for today</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleJournalSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="journal-date">Date</Label>
                          <Popover modal={true}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                id="journal-date"
                                className="justify-between font-normal"
                                type="button"
                              >
                                {journalEntry.date 
                                  ? new Date(journalEntry.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })
                                  : "Select date"}
                                <ChevronDownIcon className="h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0 z-[9999]" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={journalEntry.date ? new Date(journalEntry.date) : undefined}
                                captionLayout="dropdown"
                                onSelect={(date) => {
                                  if (date) {
                                    const year = date.getFullYear()
                                    const month = String(date.getMonth() + 1).padStart(2, '0')
                                    const day = String(date.getDate()).padStart(2, '0')
                                    setJournalEntry({ ...journalEntry, date: `${year}-${month}-${day}` })
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Select onValueChange={(value) => setJournalEntry({ ...journalEntry, subject: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mathematics">Mathematics</SelectItem>
                              <SelectItem value="science">Science</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="filipino">Filipino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="topic">Topic/Lesson</Label>
                        <Input
                          id="topic"
                          value={journalEntry.topic}
                          onChange={(e) => setJournalEntry({ ...journalEntry, topic: e.target.value })}
                          placeholder="Enter the lesson topic"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="activities">Activities Conducted</Label>
                        <Textarea
                          id="activities"
                          value={journalEntry.activities}
                          onChange={(e) => setJournalEntry({ ...journalEntry, activities: e.target.value })}
                          placeholder="Describe the activities and methods used"
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes & Observations</Label>
                        <Textarea
                          id="notes"
                          value={journalEntry.notes}
                          onChange={(e) => setJournalEntry({ ...journalEntry, notes: e.target.value })}
                          placeholder="Student responses, challenges, improvements needed, etc."
                          rows={3}
                        />
                      </div>
                      <Button type="submit" className="w-full bg-red-800 hover:bg-red-700">
                        Save Entry
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journalEntries.length > 0 ? (
                    <div className="space-y-4">
                      {journalEntries.map((entry: any) => (
                        <Card key={entry.id} className="border-l-4 border-l-red-800">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg text-red-800">{entry.topic}</CardTitle>
                                <CardDescription>
                                  {entry.subject} • {new Date(entry.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <Label className="text-sm font-semibold text-gray-700">Activities Conducted:</Label>
                              <p className="text-sm text-gray-600 mt-1">{entry.activities}</p>
                            </div>
                            {entry.notes && (
                              <div>
                                <Label className="text-sm font-semibold text-gray-700">Notes & Observations:</Label>
                                <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No journal entries yet.</p>
                      <p className="text-sm text-gray-500">Click "Add Entry" to create your first journal entry.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-800">Settings</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Settings panel will be available here.</p>
                    <p className="text-sm text-gray-500">Configure your account preferences and notification settings.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logout Tab */}
          <TabsContent value="logout" className="space-y-6">
            <Card className="text-center py-12">
              <CardContent>
                <LogOut className="w-16 h-16 text-red-800 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-800 mb-4">Logout Confirmation</h3>
                <p className="text-gray-600 mb-6">Are you sure you want to log out of the Teacher Portal?</p>
                <div className="space-x-4">
                  <Button onClick={handleLogout} className="bg-red-800 hover:bg-red-700">
                    Yes, Log Out
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("dashboard")}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
