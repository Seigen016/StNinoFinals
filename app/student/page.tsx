"use client"

import jsPDF from "jspdf"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
// Import jspdf-autotable as side effect to extend jsPDF
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import { useAlert } from "@/lib/use-alert"
import { useConfirm } from "@/lib/use-confirm"
import "jspdf-autotable"
import {
  AlertCircle,
  Bell,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  RefreshCcw,
  Search,
  User,
} from "lucide-react"

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable?: {
      finalY: number
    }
  }
}

interface Student {
  id: number
  email: string
  name?: string
  first_name?: string
  last_name?: string
  student_id?: string
  grade_level?: string
  section?: string
  gpa?: number
  attendance_rate?: number
  active_courses?: number
  pending_tasks?: number
  [key: string]: any
}

type NullableNumber = number | null

interface DashboardStats {
  gpa: NullableNumber
  attendanceRate: NullableNumber
  activeCourses: NullableNumber
  pendingTasks: NullableNumber
}

interface AssignmentSummary {
  id: string
  title: string
  subject: string
  dueDate: string
  status: string
}

interface CourseProgress {
  id: string
  subject: string
  completion: number
  instructor?: string | null
}

interface ScheduleItem {
  id: string
  subject: string
  time: string
  location: string
  instructor?: string | null
  accent?: string
}

interface EventItem {
  id: string
  title: string
  date: string
  description?: string
  accent?: string
}

interface GradeItem {
  id: string
  subject: string
  grade: string
  lastUpdated: string
}

interface SubjectTeacher {
  id: string
  subject: string
  teacher: string
}

interface DashboardData {
  stats: DashboardStats
  assignments: AssignmentSummary[]
  courseProgress: CourseProgress[]
  schedule: {
    today: ScheduleItem[]
    events: EventItem[]
  }
  grades: GradeItem[]
  enrollment: {
    status: string
    academicYear: string
    semester?: string
    gradeLevel?: string
    strand?: string
  }
  subjects?: SubjectTeacher[]
}

const STORAGE_KEY = "student"
const VIEW_QUERY = "view"
const DEFAULT_VIEW = "dashboard"

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "enrollment", label: "Enrollment", icon: FileText },
  { id: "schedule", label: "Schedule Calendar", icon: Calendar },
  { id: "grades", label: "Grades & Reports", icon: GraduationCap },
  { id: "profile", label: "Profile", icon: User },
] as const

type NavItem = (typeof NAV_ITEMS)[number]["id"]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const accentStyles: Record<string, string> = {
  blue: "bg-blue-50 border-blue-200 text-blue-800",
  green: "bg-green-50 border-green-200 text-green-800",
  purple: "bg-purple-50 border-purple-200 text-purple-800",
  orange: "bg-orange-50 border-orange-200 text-orange-800",
  red: "bg-red-50 border-red-200 text-red-800",
  indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
}

// Calendar of Activities Data
interface CalendarActivity {
  date: string // Format: "YYYY-MM-DD"
  title: string
  category: "academic" | "event" | "holiday" | "test" | "workshop" | "celebration" | "other"
}

const calendarActivities: CalendarActivity[] = [
  // June 2025
  { date: "2025-06-16", title: "Brigada Eskwela", category: "event" },
  { date: "2025-06-17", title: "Brigada Eskwela", category: "event" },
  { date: "2025-06-18", title: "Brigada Eskwela", category: "event" },
  { date: "2025-06-19", title: "Brigada Eskwela", category: "event" },
  { date: "2025-06-20", title: "Brigada Eskwela", category: "event" },
  { date: "2025-06-23", title: "SNDPALPH Workshop and Seminar", category: "workshop" },
  { date: "2025-06-24", title: "SNDPALPH Workshop and Seminar", category: "workshop" },
  { date: "2025-06-25", title: "SNDPALPH Workshop and Seminar", category: "workshop" },
  { date: "2025-06-26", title: "Parents Orientation of Student Manual", category: "event" },
  { date: "2025-06-27", title: "TEAM BUILDING", category: "event" },
  { date: "2025-06-30", title: "Grade 11 (SHS) Orientation", category: "event" },
  
  // July 2025
  { date: "2025-07-01", title: "Junior High School and Grade 12 (SHS) Orientation", category: "event" },
  { date: "2025-07-02", title: "Elementary, Junior HS and Grade 11 Orientation", category: "event" },
  { date: "2025-07-03", title: "Kinder to Junior HS and Grade 12 Orientation", category: "event" },
  { date: "2025-07-04", title: "Start of Regular Classes", category: "academic" },
  { date: "2025-07-07", title: "ID Picture Taking", category: "event" },
  { date: "2025-07-08", title: "ID Picture Taking", category: "event" },
  { date: "2025-07-09", title: "ID Picture Taking", category: "event" },
  { date: "2025-07-10", title: "ID Picture Taking", category: "event" },
  { date: "2025-07-11", title: "ID Picture Taking", category: "event" },
  { date: "2025-07-12", title: "Training for Campus Journalism", category: "workshop" },
  { date: "2025-07-14", title: "Dental Check-Up", category: "event" },
  { date: "2025-07-15", title: "Dental Check-Up", category: "event" },
  { date: "2025-07-16", title: "Dental Check-Up", category: "event" },
  { date: "2025-07-17", title: "Dental Check-Up", category: "event" },
  { date: "2025-07-18", title: "Dental Check-Up", category: "event" },
  { date: "2025-07-21", title: "Worksheet No. 1", category: "academic" },
  { date: "2025-07-22", title: "Worksheet No. 1", category: "academic" },
  { date: "2025-07-23", title: "Worksheet No. 1", category: "academic" },
  { date: "2025-07-24", title: "Worksheet No. 1", category: "academic" },
  { date: "2025-07-25", title: "Worksheet No. 1", category: "academic" },
  
  // August 2025
  { date: "2025-08-04", title: "FIRST QUARTER TEST - PART I", category: "test" },
  { date: "2025-08-05", title: "FIRST QUARTER TEST - PART I", category: "test" },
  { date: "2025-08-06", title: "FIRST QUARTER TEST - PART I", category: "test" },
  { date: "2025-08-07", title: "FIRST QUARTER TEST - PART I", category: "test" },
  { date: "2025-08-08", title: "FIRST QUARTER TEST - PART I", category: "test" },
  { date: "2025-08-12", title: "Elimination for Tagisan ng Talino", category: "event" },
  { date: "2025-08-13", title: "Elimination for Tagisan ng Talino", category: "event" },
  { date: "2025-08-16", title: "Orientation for SHS Work Immersion", category: "event" },
  { date: "2025-08-18", title: "Interprivate 2025", category: "event" },
  { date: "2025-08-19", title: "Interprivate 2025", category: "event" },
  { date: "2025-08-20", title: "PEAC SEMINAR", category: "workshop" },
  { date: "2025-08-22", title: "CPAPS Campus Journalism (Elem)", category: "event" },
  { date: "2025-08-23", title: "Final Round for Tagisan ng Talino", category: "event" },
  { date: "2025-08-25", title: "PEAC INSET (JHS)", category: "workshop" },
  { date: "2025-08-26", title: "CPAPS Campus Journalism (JHS/SHS)", category: "event" },
  { date: "2025-08-28", title: "Buwan ng Wika Celebration for Junior and Senior High", category: "celebration" },
  { date: "2025-08-29", title: "Buwan ng Wika Celebration for Kinder and Elementary", category: "celebration" },
  
  // September 2025
  { date: "2025-09-01", title: "FIRST QUARTER TEST - PART II", category: "test" },
  { date: "2025-09-02", title: "FIRST QUARTER TEST - PART II", category: "test" },
  { date: "2025-09-03", title: "FIRST QUARTER TEST - PART II", category: "test" },
  { date: "2025-09-04", title: "FIRST QUARTER TEST - PART II", category: "test" },
  { date: "2025-09-05", title: "FIRST QUARTER TEST - PART II", category: "test" },
  { date: "2025-09-06", title: "City Meet", category: "event" },
  { date: "2025-09-08", title: "City Meet", category: "event" },
  { date: "2025-09-09", title: "City Meet", category: "event" },
  { date: "2025-09-10", title: "DR. GALICIA'S DAY", category: "celebration" },
  { date: "2025-09-11", title: "Initial Interview for SGO Party-list", category: "event" },
  { date: "2025-09-12", title: "Initial Interview for SGO Party-list", category: "event" },
  { date: "2025-09-13", title: "Initial Interview for SGO Party-list", category: "event" },
  { date: "2025-09-15", title: "Campaign Period for SGO", category: "event" },
  { date: "2025-09-16", title: "Campaign Period for SGO", category: "event" },
  { date: "2025-09-17", title: "Campaign Period for SGO", category: "event" },
  { date: "2025-09-20", title: "Career Orientation for Grade 12", category: "event" },
  { date: "2025-09-22", title: "Submission of 2nd Quarter Test - Part I", category: "academic" },
  { date: "2025-09-23", title: "Submission of 2nd Quarter Test - Part I", category: "academic" },
  { date: "2025-09-24", title: "FIRST PARENTS TEACHERS CONFERENCE", category: "event" },
  { date: "2025-09-25", title: "Class Pictorial", category: "event" },
  { date: "2025-09-26", title: "School Festival of Talent (SFOT) - Elementary", category: "celebration" },
  { date: "2025-09-27", title: "School Festival of Talent (SFOT) - High School", category: "celebration" },
  { date: "2025-09-29", title: "SECOND QUARTER TEST - PART I", category: "test" },
  { date: "2025-09-30", title: "SECOND QUARTER TEST - PART I", category: "test" },
  
  // October 2025
  { date: "2025-10-01", title: "SECOND QUARTER TEST - PART I", category: "test" },
  { date: "2025-10-02", title: "SECOND QUARTER TEST - PART I", category: "test" },
  { date: "2025-10-03", title: "SECOND QUARTER TEST - PART I", category: "test" },
  { date: "2025-10-10", title: "SNDPALPH TEACHER'S DAY CELEBRATION", category: "celebration" },
  { date: "2025-10-15", title: "Investiture Practice", category: "event" },
  { date: "2025-10-16", title: "Investiture Practice", category: "event" },
  { date: "2025-10-17", title: "CPAPS DFOK (JHS/SHS)", category: "event" },
  { date: "2025-10-18", title: "Investiture", category: "event" },
  { date: "2025-10-21", title: "Kinder Leadership Training", category: "workshop" },
  { date: "2025-10-22", title: "Star and Kab Scout", category: "event" },
  { date: "2025-10-23", title: "Girl and Boy Scout", category: "event" },
  { date: "2025-10-24", title: "JHS and SHS Leadership Training", category: "workshop" },
  
  // November 2025
  { date: "2025-11-03", title: "Resume of Classes", category: "academic" },
  { date: "2025-11-07", title: "Reading Evaluation", category: "test" },
  { date: "2025-11-10", title: "SECOND QUARTER TEST - PART II", category: "test" },
  { date: "2025-11-11", title: "SECOND QUARTER TEST - PART II", category: "test" },
  { date: "2025-11-12", title: "CPAPS JHS DEOK 2025", category: "event" },
  { date: "2025-11-13", title: "SECOND QUARTER TEST - PART II", category: "test" },
  { date: "2025-11-14", title: "SECOND QUARTER TEST - PART II", category: "test" },
  { date: "2025-11-17", title: "Elimination for Science Quiz Bee", category: "event" },
  { date: "2025-11-25", title: "SNDPA-LPH EDUCATIONAL TOUR", category: "event" },
  { date: "2025-11-28", title: "SECOND PARENTS TEACHERS CONFERENCE", category: "event" },
  { date: "2025-11-29", title: "Final Round for Science Quiz Bee", category: "event" },
  
  // December 2025
  { date: "2025-12-08", title: "THIRD QUARTER TEST - PART I", category: "test" },
  { date: "2025-12-09", title: "THIRD QUARTER TEST - PART I", category: "test" },
  { date: "2025-12-10", title: "THIRD QUARTER TEST - PART I", category: "test" },
  { date: "2025-12-11", title: "THIRD QUARTER TEST - PART I", category: "test" },
  { date: "2025-12-12", title: "THIRD QUARTER TEST - PART I", category: "test" },
  { date: "2025-12-13", title: "PARENTS TEACHERS GRATITUDE NIGHT", category: "event" },
  { date: "2025-12-18", title: "CHRISTMAS CONCERT", category: "celebration" },
  { date: "2025-12-19", title: "PRAGANIANS CHRISTMAS PARTY", category: "celebration" },
  { date: "2025-12-20", title: "FACULTY AND STAFF CHRISTMAS PARTY", category: "celebration" },
  { date: "2025-12-22", title: "START OF CHRISTMAS BREAK", category: "holiday" },
  
  // January 2026
  { date: "2026-01-05", title: "RESUMPTION OF CLASSES", category: "academic" },
  { date: "2026-01-06", title: "Elimination for Spelling Bee", category: "event" },
  { date: "2026-01-10", title: "Final Round for Spelling Bee", category: "event" },
  { date: "2026-01-12", title: "Elimination for Spelling Bee", category: "event" },
  { date: "2026-01-16", title: "CPAPS I-Spell", category: "event" },
  { date: "2026-01-17", title: "Final Round for Spelling Bee", category: "event" },
  { date: "2026-01-19", title: "Graduation Pictorial", category: "event" },
  { date: "2026-01-20", title: "Graduation Pictorial", category: "event" },
  { date: "2026-01-21", title: "Graduation Pictorial", category: "event" },
  { date: "2026-01-22", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-23", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-24", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-25", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-26", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-27", title: "THIRD QUARTER TEST - PART II", category: "test" },
  { date: "2026-01-29", title: "SNDPA-LPH 28th Founding Anniversary (Opening)", category: "celebration" },
  { date: "2026-01-30", title: "INTERCOLOR (Grades 1 to 3)", category: "event" },
  { date: "2026-01-31", title: "INTERCOLOR (Grades 4 to 6)", category: "event" },
  
  // February 2026
  { date: "2026-02-02", title: "INTERCOLOR (JHS and SHS)", category: "event" },
  { date: "2026-02-03", title: "INTERCOLOR (JHS and SHS)", category: "event" },
  { date: "2026-02-04", title: "PRE-SCHOOLYMPICS", category: "event" },
  { date: "2026-02-05", title: "SNDPA-LPH 28th Founding Anniversary (Closing)", category: "celebration" },
  { date: "2026-02-13", title: "DISTRIBUTION OF REPORT CARDS", category: "academic" },
  { date: "2026-02-16", title: "Elimination for Math Wizard", category: "event" },
  { date: "2026-02-20", title: "JUNIOR AND SENIOR PROM", category: "celebration" },
  { date: "2026-02-28", title: "Final Round for Math Wizard", category: "event" },
  
  // March 2026
  { date: "2026-03-09", title: "CUMULATIVE TEST", category: "test" },
  { date: "2026-03-10", title: "CUMULATIVE TEST", category: "test" },
  { date: "2026-03-11", title: "CUMULATIVE TEST", category: "test" },
  { date: "2026-03-12", title: "CUMULATIVE TEST", category: "test" },
  { date: "2026-03-13", title: "CUMULATIVE TEST", category: "test" },
  { date: "2026-03-14", title: "WATER FUN AND FAREWELL PARTY FOR KINDER", category: "celebration" },
  { date: "2026-03-16", title: "CLEARANCE WEEK", category: "academic" },
  { date: "2026-03-17", title: "FAREWELL PARTY", category: "celebration" },
  { date: "2026-03-18", title: "Recognition Practice", category: "event" },
  { date: "2026-03-19", title: "Graduation Practice", category: "event" },
  { date: "2026-03-20", title: "Recognition Practice", category: "event" },
  { date: "2026-03-23", title: "Graduation Practice", category: "event" },
  { date: "2026-03-25", title: "DELIBERATION OF HONOR", category: "academic" },
  { date: "2026-03-26", title: "General Practice for Recognition", category: "event" },
  { date: "2026-03-27", title: "General Practice for Graduation", category: "event" },
  { date: "2026-03-29", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-03-30", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-03-31", title: "HOLY WEEK", category: "holiday" },
  
  // April 2026
  { date: "2026-04-01", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-04-02", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-04-03", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-04-04", title: "HOLY WEEK", category: "holiday" },
  { date: "2026-04-06", title: "Graduation Mass Practice", category: "event" },
  { date: "2026-04-07", title: "GRADUATION MASS", category: "celebration" },
  { date: "2026-04-09", title: "RECOGNITION DAY", category: "celebration" },
  { date: "2026-04-10", title: "GRADUATION DAY", category: "celebration" },
]

// Color mapping for activity categories
const categoryColors: Record<string, string> = {
  academic: "bg-blue-200/50", // Semi-transparent blue
  event: "bg-green-200/50", // Semi-transparent green
  holiday: "bg-purple-200/50", // Semi-transparent purple
  test: "bg-red-200/50", // Semi-transparent red
  workshop: "bg-yellow-200/50", // Semi-transparent yellow
  celebration: "bg-pink-200/50", // Semi-transparent pink
  other: "bg-gray-200/50", // Semi-transparent gray
}

const formatDate = (isoDate: string) => {
  if (!isoDate) return "TBD"
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoDate))
  } catch {
    return isoDate
  }
}

const normalizePercentage = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return null
  return value > 1 ? Math.min(value, 100) : Math.min(Math.max(value * 100, 0), 100)
}

export default function StudentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showAlert } = useAlert()
  const { showConfirm } = useConfirm()

  const [student, setStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [activeNav, setActiveNav] = useState<NavItem>(DEFAULT_VIEW)
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false)
  const [firstLoginForm, setFirstLoginForm] = useState({
    newPassword: "",
    confirmPassword: "",
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    phone: "",
    birthDate: "",
    gender: "",
  })
  const [firstLoginError, setFirstLoginError] = useState<string | null>(null)
  const [isSavingFirstLogin, setIsSavingFirstLogin] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  const emailErrorMessage = useMemo(() => {
    if (!loginEmail) return null
    return EMAIL_REGEX.test(loginEmail.trim()) ? null : "Enter a valid email address."
  }, [loginEmail])

  const passwordErrorMessage = useMemo(() => {
    if (!loginPassword) return null
    return loginPassword.length >= 6 ? null : "Password must be at least 6 characters."
  }, [loginPassword])

  const computedStats = useMemo<DashboardStats>(
    () => ({
      gpa: dashboardData?.stats?.gpa ?? student?.gpa ?? null,
      attendanceRate:
        dashboardData?.stats?.attendanceRate ?? normalizePercentage(student?.attendance_rate ?? null),
      activeCourses: dashboardData?.stats?.activeCourses ?? student?.active_courses ?? null,
      pendingTasks: dashboardData?.stats?.pendingTasks ?? student?.pending_tasks ?? null,
    }),
    [dashboardData, student],
  )

  const persistStudentSession = useCallback((payload: Student, persist: boolean) => {
    if (typeof window === "undefined") return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    if (persist) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearStudentSession = useCallback(() => {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const restoreStudentFromStorage = useCallback(() => {
    if (typeof window === "undefined") return
    const fromSession = sessionStorage.getItem(STORAGE_KEY)
    const fromLocal = localStorage.getItem(STORAGE_KEY)
    const rawStudent = fromSession ?? fromLocal

    if (rawStudent) {
      try {
        const parsed = JSON.parse(rawStudent)
        setStudent(parsed)
        setRememberMe(Boolean(fromLocal))
      } catch (error) {
        console.error("Error parsing stored student data:", error)
        clearStudentSession()
      }
    }
    setIsLoading(false)
  }, [clearStudentSession])

  useEffect(() => {
    restoreStudentFromStorage()
  }, [restoreStudentFromStorage])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && !event.newValue) {
        setStudent(null)
        setDashboardData(null)
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const updateViewQuery = useCallback(
    (view: NavItem) => {
      if (typeof window === "undefined") return
      const params = new URLSearchParams(window.location.search)
      params.set(VIEW_QUERY, view)
      const queryString = params.toString()
      router.replace(`${window.location.pathname}?${queryString}`, { scroll: false })
    },
    [router],
  )

  useEffect(() => {
    const paramView = searchParams?.get(VIEW_QUERY) as NavItem | null
    if (paramView && paramView !== activeNav) {
      setActiveNav(paramView)
    } else if (!paramView) {
      updateViewQuery(activeNav)
    }
  }, [searchParams, activeNav, updateViewQuery])

  const fetchDashboardData = useCallback(async (currentStudent: Student) => {
    setDashboardLoading(true)
    setDashboardError(null)
    try {
      const response = await fetch("/api/student/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: currentStudent.id, email: currentStudent.email }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.success) {
        setDashboardData(payload?.data ?? null)
        throw new Error(payload?.error || `Unable to load dashboard data (${response.status}).`)
      }

      setDashboardData(payload.data)
    } catch (error: any) {
      console.error("Dashboard data error:", error)
      setDashboardError(error?.message || "Unable to load dashboard data.")
      setDashboardData((prev) => prev ?? null)
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  useEffect(() => {
    if (student) {
      fetchDashboardData(student)
    } else {
      setDashboardData(null)
    }
  }, [student, fetchDashboardData])

  const handleRefreshDashboard = useCallback(() => {
    if (student) {
      fetchDashboardData(student)
    }
  }, [student, fetchDashboardData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    setPasswordTouched(true)

    if (emailErrorMessage || passwordErrorMessage) {
      setLoginError("Please fix the highlighted fields before continuing.")
      return
    }

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const response = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error occurred" }))
        setLoginError(errorData.error || `Server error (${response.status}). Please try again.`)
        return
      }

      const data = await response.json()

      if (data.success && data.student) {
        setStudent(data.student)
        persistStudentSession(data.student, rememberMe)
        setLoginEmail("")
        setLoginPassword("")
        setEmailTouched(false)
        setPasswordTouched(false)
        setLoginError(null)
        
        // Check if first login
        if (data.firstLogin) {
          setShowFirstLoginModal(true)
          // Pre-fill form with existing data if available
          setFirstLoginForm({
            newPassword: "",
            confirmPassword: "",
            firstName: data.student.first_name || "",
            middleName: data.student.middle_name || "",
            lastName: data.student.last_name || "",
            address: data.student.address || "",
            phone: data.student.phone || "",
            birthDate: data.student.birth_date || "",
            gender: data.student.gender || "",
          })
        }
      } else {
        setLoginError(data.error || "Login failed. Please check your credentials.")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      const errorMessage = error?.message || String(error) || ""
      if (errorMessage?.toLowerCase().includes("network")) {
        setLoginError("Network error. Please check your internet connection and try again.")
      } else if (errorMessage?.includes("Failed to fetch")) {
        setLoginError("Cannot connect to the server. Please make sure the server is running.")
      } else {
        setLoginError(`An error occurred: ${errorMessage || "Please try again."}`)
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleFirstLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFirstLoginError(null)

    // Validation
    if (!firstLoginForm.newPassword || firstLoginForm.newPassword.length < 6) {
      setFirstLoginError("Password must be at least 6 characters long.")
      return
    }

    if (firstLoginForm.newPassword !== firstLoginForm.confirmPassword) {
      setFirstLoginError("Passwords do not match.")
      return
    }

    if (!firstLoginForm.firstName || !firstLoginForm.lastName) {
      setFirstLoginError("First name and last name are required.")
      return
    }

    setIsSavingFirstLogin(true)

    try {
      const response = await fetch("/api/student/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student?.id,
          password: firstLoginForm.newPassword,
          first_name: firstLoginForm.firstName,
          middle_name: firstLoginForm.middleName,
          last_name: firstLoginForm.lastName,
          address: firstLoginForm.address,
          phone: firstLoginForm.phone,
          birth_date: firstLoginForm.birthDate,
          gender: firstLoginForm.gender,
          firstLogin: false, // Mark as completed
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update student in state
        const updatedStudent = { ...student, ...data.student, first_login: false }
        setStudent(updatedStudent)
        persistStudentSession(updatedStudent, rememberMe)
        setShowFirstLoginModal(false)
        setFirstLoginForm({
          newPassword: "",
          confirmPassword: "",
          firstName: "",
          middleName: "",
          lastName: "",
          address: "",
          phone: "",
          birthDate: "",
          gender: "",
        })
        showAlert({ message: "Profile updated successfully! Welcome to the student portal.", type: "success" })
      } else {
        setFirstLoginError(data.error || "Failed to update profile. Please try again.")
      }
    } catch (error: any) {
      console.error("First login error:", error)
      setFirstLoginError("An error occurred. Please try again.")
    } finally {
      setIsSavingFirstLogin(false)
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
      clearStudentSession()
      setStudent(null)
      setDashboardData(null)
      router.replace("/")
    }
  }

  const loginDisabled =
    isLoggingIn || !loginEmail || !loginPassword || Boolean(emailErrorMessage || passwordErrorMessage)

  const displayName = useMemo(() => {
    if (!student) return "Student"
    if (student.name) return student.name
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`
    }
    return student.email
  }, [student])

  const studentInitials = useMemo(() => {
    if (!student) return "S"
    if (student.name) {
      return student.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (student.first_name && student.last_name) {
      return `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
    }
    return student.email?.[0]?.toUpperCase() ?? "S"
  }, [student])

  const assignments = dashboardData?.assignments ?? []
  const courseProgress = dashboardData?.courseProgress ?? []
  const scheduleToday = dashboardData?.schedule?.today ?? []
  const upcomingEvents = dashboardData?.schedule?.events ?? []
  const gradeItems = dashboardData?.grades ?? []
  const enrollmentInfo = dashboardData?.enrollment
  const subjects = dashboardData?.subjects ?? []

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Get activities for a specific date
  const getActivitiesForDate = (date: Date): CalendarActivity[] => {
    const dateStr = date.toISOString().split("T")[0]
    return calendarActivities.filter((activity) => activity.date === dateStr)
  }

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day))
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const navigateMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const generateGradesPDF = useCallback(async () => {
    if (!student) {
      showAlert({ message: "Please log in to download your certificate.", type: "warning" })
      return
    }

    if (gradeItems.length === 0) {
      showAlert({ message: "No grades available to download.", type: "warning" })
      return
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Load logo image - try multiple methods
      const loadLogo = async (): Promise<string> => {
        // Method 1: Try fetching as blob and converting
        try {
          const response = await fetch("/logo.png", { cache: "force-cache" })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const blob = await response.blob()
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const dataURL = reader.result as string
              if (dataURL && dataURL.startsWith("data:image")) {
                resolve(dataURL)
              } else {
                reject(new Error("Invalid data URL from blob"))
              }
            }
            reader.onerror = () => reject(new Error("FileReader error"))
            reader.readAsDataURL(blob)
          })
        } catch (fetchError) {
          console.warn("Fetch method failed, trying Image method:", fetchError)
          
          // Method 2: Fallback to Image element method
          // Use HTMLImageElement or window.Image to avoid conflict with Next.js Image component
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Logo load timeout"))
            }, 10000)

            const logoImg = new window.Image() as HTMLImageElement
            logoImg.crossOrigin = "anonymous"
            
            logoImg.onload = () => {
              clearTimeout(timeout)
              try {
                const canvas = document.createElement("canvas")
                canvas.width = logoImg.naturalWidth || logoImg.width || 200
                canvas.height = logoImg.naturalHeight || logoImg.height || 200
                const ctx = canvas.getContext("2d")
                if (ctx) {
                  ctx.drawImage(logoImg, 0, 0)
                  const dataURL = canvas.toDataURL("image/png")
                  if (dataURL && dataURL !== "data:," && dataURL.startsWith("data:image")) {
                    resolve(dataURL)
                  } else {
                    reject(new Error("Failed to convert logo to data URL"))
                  }
                } else {
                  reject(new Error("Could not get canvas context"))
                }
              } catch (error) {
                reject(error)
              }
            }
            
            logoImg.onerror = (error) => {
              clearTimeout(timeout)
              console.error("Logo load error:", error, "Source:", logoImg.src)
              reject(new Error(`Failed to load logo from ${logoImg.src}`))
            }
            
            // Try absolute URL if relative doesn't work
            const baseUrl = window.location.origin
            logoImg.src = `${baseUrl}/logo.png`
          })
        }
      }

      // Load and add logo to PDF
      try {
        const logoDataUrl = await loadLogo()
        console.log("Logo loaded successfully, data URL length:", logoDataUrl?.length)
        
        if (logoDataUrl && logoDataUrl.startsWith("data:image")) {
          // Create an image element to get dimensions
          // Use window.Image to avoid conflict with Next.js Image component
          const img = new window.Image() as HTMLImageElement
          img.src = logoDataUrl
          
          // Wait for image to load to get proper dimensions
          await new Promise<void>((resolve, reject) => {
            if (img.complete && img.naturalWidth > 0) {
              // Image already loaded
              resolve()
            } else {
              img.onload = () => resolve()
              img.onerror = () => reject(new Error("Failed to load image from data URL"))
              // Timeout after 3 seconds
              setTimeout(() => reject(new Error("Image load timeout")), 3000)
            }
          })
          
          // Calculate aspect ratio to maintain proportions
          const aspectRatio = img.naturalWidth / img.naturalHeight
          const logoWidth = 30 // 30mm width (increased from 20mm)
          const logoHeight = logoWidth / aspectRatio
          
          // Add logo in upper left corner (10mm from left, 10mm from top)
          doc.addImage(logoDataUrl, "PNG", 10, 10, logoWidth, logoHeight)
          console.log(`Logo added to PDF at (10, 10) with size ${logoWidth}x${logoHeight}mm`)
        } else {
          throw new Error("Invalid logo data URL format")
        }
      } catch (logoError) {
        console.error("Logo failed to load or add to PDF:", logoError)
        // Continue without logo - don't block PDF generation
        // The PDF will be generated without the logo
      }

      // School information - centered
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("STO. NIÑO DE PRAGA ACADEMY", 105, 18, { align: "center" })
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("OF LA PAZ HOMES II, INC.", 105, 24, { align: "center" })
      doc.text("La Paz Homes II/Karlaville Parkhomes, Trece", 105, 28, { align: "center" })

      // Certificate title
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("CERTIFICATE OF GRADES", 105, 45, { align: "center" })

      // Student information
      const studentName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() || student.name || "N/A"
      const gradeLevel = student.grade_level || enrollmentInfo?.gradeLevel || "N/A"
      const academicYear = enrollmentInfo?.academicYear || "2024-2025"
      const semester = enrollmentInfo?.semester || "SECOND SEMESTER"

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(`This is to certify that ${studentName.toUpperCase()} of Grade ${gradeLevel}`, 105, 60, { align: "center" })
      doc.text(`for the ${semester} of ACADEMIC YEAR ${academicYear}.`, 105, 66, { align: "center" })

      // Grades table
      const tableData = gradeItems.map((grade) => {
        const gradeValue = grade.grade || "0"
        const numericGrade = parseFloat(gradeValue)
        return [
          grade.subject || "N/A",
          gradeValue,
          !isNaN(numericGrade) && numericGrade >= 75 ? "PASSED" : "FAILED",
        ]
      })

      // Calculate general average
      const numericGrades = gradeItems
        .map((g) => {
          const gradeValue = g.grade || "0"
          return parseFloat(gradeValue)
        })
        .filter((g) => !isNaN(g))
      
      const generalAverage = numericGrades.length > 0
        ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(0)
        : "N/A"
      const actionTaken = generalAverage !== "N/A" && parseFloat(generalAverage) >= 75 ? "PROMOTED" : "RETAINED"

      // Add general average row
      tableData.push(["General Average for the semester", generalAverage, actionTaken])

      // Create table using autoTable
      // @ts-ignore - autoTable extends jsPDF
      if (typeof (doc as any).autoTable === 'function') {
        // @ts-ignore - autoTable extends jsPDF
        (doc as any).autoTable({
          startY: 80,
          head: [["SUBJECT", "SEM FINAL GRADE", "ACTION TAKEN"]],
          body: tableData,
          theme: "grid",
          headStyles: {
            fillColor: [220, 220, 220],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            fontSize: 10,
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
          },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40, halign: "center" },
            2: { cellWidth: 50, halign: "center" },
          },
          margin: { left: 10, right: 10 },
        })
      } else {
        // Fallback: create table manually if autoTable is not available
        console.warn("autoTable not available, using manual table")
        let yPos = 80
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text("SUBJECT", 10, yPos)
        doc.text("SEM FINAL GRADE", 110, yPos)
        doc.text("ACTION TAKEN", 150, yPos)
        
        yPos += 10
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        tableData.forEach((row) => {
          if (yPos > 250) {
            doc.addPage()
            yPos = 20
          }
          const subject = String(row[0]).substring(0, 50) // Truncate long subjects
          doc.text(subject, 10, yPos)
          doc.text(String(row[1]), 110, yPos, { align: "center" })
          doc.text(String(row[2]), 150, yPos, { align: "center" })
          yPos += 8
        })
      }

      // Certification text
      let finalY = 200 // Default position if autoTable didn't work
      if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
        finalY = doc.lastAutoTable.finalY + 15
      }
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "italic")
      doc.text("This certification is issued upon the request of the aforementioned student", 105, finalY, { align: "center" })
      doc.text("for EDUCATIONAL ASSISTANCE and for the stated purpose only.", 105, finalY + 6, { align: "center" })

      // Date and location
      const currentDate = new Date()
      const dateStr = currentDate.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      doc.setFont("helvetica", "normal")
      doc.text(`Issued this ${dateStr} at SNDPA-LPH, Trece Martires City, Cavite.`, 105, finalY + 15, { align: "center" })

      // Signatures section
      const signatureY = finalY + 35
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      
      // Left signature
      doc.text("MRS. CORAZON R. ULEP", 50, signatureY)
      doc.text("School Registrar", 50, signatureY + 5)

      // Right signature - fixed to match the image
      doc.text("COL GILMAR N GALICIA PA(Res) ME", 150, signatureY)
      doc.text("Principal / Administrator", 150, signatureY + 5)

      // Footer note
      const footerY = 270
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text("Should there be a need to verify this document? Please call (046) 443-33-67 Office of the Registrar", 105, footerY, { align: "center" })
      doc.text("NOT VALID WITHOUT SCHOOL SEAL", 105, footerY + 5, { align: "center" })

      // Save PDF
      const fileName = `Certificate_of_Grades_${studentName.replace(/\s+/g, "_")}_${academicYear}.pdf`
      doc.save(fileName)
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        student: !!student,
        gradeItemsCount: gradeItems.length,
      })
      showAlert({ message: `Failed to generate PDF: ${error?.message || "Unknown error"}. Please check the console for details.`, type: "error" })
    }
  }, [student, gradeItems, enrollmentInfo])

  const generateCertificationPDF = useCallback(async () => {
    if (!student) {
      showAlert({ message: "Please log in to download your certification.", type: "warning" })
      return
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Load logo image
      const loadLogo = async (): Promise<string> => {
        try {
          const response = await fetch("/logo.png", { cache: "force-cache" })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          const blob = await response.blob()
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              const dataURL = reader.result as string
              if (dataURL && dataURL.startsWith("data:image")) {
                resolve(dataURL)
              } else {
                reject(new Error("Invalid data URL from blob"))
              }
            }
            reader.onerror = () => reject(new Error("FileReader error"))
            reader.readAsDataURL(blob)
          })
        } catch (fetchError) {
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Logo load timeout"))
            }, 10000)

            const logoImg = new window.Image() as HTMLImageElement
            logoImg.crossOrigin = "anonymous"
            logoImg.onload = () => {
              clearTimeout(timeout)
              try {
                const canvas = document.createElement("canvas")
                canvas.width = logoImg.naturalWidth || logoImg.width || 200
                canvas.height = logoImg.naturalHeight || logoImg.height || 200
                const ctx = canvas.getContext("2d")
                if (ctx) {
                  ctx.drawImage(logoImg, 0, 0)
                  const dataURL = canvas.toDataURL("image/png")
                  if (dataURL && dataURL.startsWith("data:image")) {
                    resolve(dataURL)
                  } else {
                    reject(new Error("Failed to convert logo to data URL"))
                  }
                } else {
                  reject(new Error("Could not get canvas context"))
                }
              } catch (error) {
                reject(error)
              }
            }
            logoImg.onerror = () => {
              clearTimeout(timeout)
              reject(new Error(`Failed to load logo from ${logoImg.src}`))
            }
            const baseUrl = window.location.origin
            logoImg.src = `${baseUrl}/logo.png`
            if (logoImg.complete && logoImg.naturalWidth > 0) {
              logoImg.onload(new Event('load') as any)
            }
          })
        }
      }

      // Load and add logo
      let logoHeight = 0
      try {
        const logoDataUrl = await loadLogo()
        const img = new window.Image() as HTMLImageElement
        img.src = logoDataUrl
        await new Promise<void>((resolve, reject) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
          } else {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error("Failed to load image from data URL"))
            setTimeout(() => reject(new Error("Image load timeout")), 3000)
          }
        })
        const aspectRatio = img.naturalWidth / img.naturalHeight
        const logoWidth = 30
        logoHeight = logoWidth / aspectRatio
        doc.addImage(logoDataUrl, "PNG", 10, 10, logoWidth, logoHeight)
      } catch (logoError) {
        console.warn("Logo failed to load, continuing without logo:", logoError)
      }

      // Motto to the right of logo, date on the same line aligned right
      const currentDate = new Date()
      const dateStr = currentDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      
      // Motto positioned to the right of logo (around x=50)
      doc.setFontSize(11)
      doc.setFont("helvetica", "italic")
      doc.text("The Home of Multi-Talented Children and Dedicated Teachers", 50, 20)
      
      // Date on the same line, aligned to the right
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(dateStr, 190, 20, { align: "right" })

      // CERTIFICATION title
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text("CERTIFICATION", 105, 45, { align: "center" })

      // Student information
      const studentName = `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() || student.name || "N/A"
      const gradeLevel = student.grade_level || enrollmentInfo?.gradeLevel || "N/A"
      const strand = enrollmentInfo?.strand || ""
      const academicYear = enrollmentInfo?.academicYear || "2025-2026"

      // Body paragraph 1 - Use splitTextToSize to handle wrapping
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      let yPos = 55
      const paragraph1 = `This is to certify that ${studentName.toUpperCase()} officially enrolled in this institution as Grade ${gradeLevel}${strand ? ` under ${strand}` : ""} for Academic Year ${academicYear}.`
      
      // Split text to fit within margins (left margin 20mm, right margin 20mm = 170mm width)
      const splitText1 = doc.splitTextToSize(paragraph1, 170)
      doc.text(splitText1, 20, yPos)
      yPos += splitText1.length * 7 // Adjust based on line height

      // Body paragraph 2 - Purpose
      yPos = yPos + 10
      const purposeText = "This certification is issued upon the request of the aforementioned student for Entrance Examination Slated for Cavite State University - Main Campus. This certification is issued for the stated purpose only."
      const splitPurpose = doc.splitTextToSize(purposeText, 170)
      doc.text(splitPurpose, 20, yPos)
      yPos += splitPurpose.length * 7

      // Issuance details
      yPos = yPos + 10
      const day = currentDate.getDate()
      const month = currentDate.toLocaleDateString("en-US", { month: "long" })
      const year = currentDate.getFullYear()
      const dayOrdinal = (day: number) => {
        if (day > 3 && day < 21) return `${day}th`
        switch (day % 10) {
          case 1: return `${day}st`
          case 2: return `${day}nd`
          case 3: return `${day}rd`
          default: return `${day}th`
        }
      }
      const issueText = `Issued this ${dayOrdinal(day)} day of ${month} ${year} at SNDPA-LPH, Trece Martires City, Cavite.`
      const splitIssue = doc.splitTextToSize(issueText, 170)
      doc.text(splitIssue, 20, yPos)

      // Signatory - far right
      const signatureY = yPos + 20
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("COL GILMAR N GALICIA PA (Res) MBA,MPM", 190, signatureY, { align: "right" })
      doc.setFont("helvetica", "normal")
      doc.text("Principal / Administrator", 190, signatureY + 5, { align: "right" })

      // Note
      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.text("Note: Should there be a need to verify this document?", 20, 150)
      doc.text("Please call (046) 443-33-67 Office of the Principal", 20, 155)

      // Footer disclaimer
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("NOT VALID", 20, 270)
      doc.text("WITHOUT", 20, 275)
      doc.text("SCHOOL SEAL", 20, 280)

      // Save PDF
      const fileName = `Certification_${studentName.replace(/\s+/g, "_")}_${academicYear}.pdf`
      doc.save(fileName)
    } catch (error: any) {
      console.error("Error generating certification PDF:", error)
      showAlert({ message: `Failed to generate certification: ${error?.message || "Unknown error"}. Please check the console for details.`, type: "error" })
    }
  }, [student, enrollmentInfo])

  const statCards = [
    {
      label: "Current GPA",
      value: computedStats.gpa !== null ? computedStats.gpa.toFixed(2) : "—",
      helper: computedStats.gpa !== null ? "Registrar confirmed" : "Awaiting registrar data",
    },
    {
      label: "Attendance Rate",
      value: computedStats.attendanceRate !== null ? `${computedStats.attendanceRate.toFixed(0)}%` : "—",
      helper:
        computedStats.attendanceRate !== null ? "Last 30 days" : "Attendance data will appear once available",
    },
    {
      label: "Active Courses",
      value: computedStats.activeCourses !== null ? String(computedStats.activeCourses) : "—",
      helper: computedStats.activeCourses !== null ? "Enrolled this term" : "Courses will load shortly",
    },
    {
      label: "Pending Tasks",
      value: computedStats.pendingTasks !== null ? String(computedStats.pendingTasks) : "—",
      helper: computedStats.pendingTasks !== null ? "Due this week" : "Tasks will sync from LMS",
    },
  ]

  const handleNavChange = (view: NavItem) => {
    setActiveNav(view)
    updateViewQuery(view)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">Loading...</div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-gray-200">
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
            <CardTitle className="text-2xl font-bold text-gray-800">Student Login</CardTitle>
            <CardDescription>Sto Niño de Praga Academy</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-800">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailTouched && Boolean(emailErrorMessage)}
                  aria-describedby="login-email-error"
                  autoComplete="email"
                  required
                  className="border-gray-200"
                />
                {emailTouched && emailErrorMessage && (
                  <p id="login-email-error" className="text-sm text-red-600">
                    {emailErrorMessage}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-800">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onBlur={() => setPasswordTouched(true)}
                    aria-invalid={passwordTouched && Boolean(passwordErrorMessage)}
                    aria-describedby="login-password-error"
                    autoComplete="current-password"
                    required
                    className="border-gray-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-800 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordTouched && passwordErrorMessage && (
                  <p id="login-password-error" className="text-sm text-red-600">
                    {passwordErrorMessage}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-700 focus:ring-red-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>
                <Link href="/" className="text-sm text-red-700 hover:underline">
                  Need help?
                </Link>
              </div>
              {loginError && (
                <div
                  className="flex items-start space-x-2 text-red-700 text-sm bg-red-50 p-3 rounded"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p aria-live="assertive">{loginError}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={loginDisabled}
                className="w-full bg-red-800 hover:bg-red-700 disabled:opacity-60"
              >
                {isLoggingIn ? "Logging in..." : "Login"}
              </Button>
              <div className="text-center">
                <Link href="/">
                  <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
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

  // First Login Modal
  if (showFirstLoginModal && student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Dialog open={showFirstLoginModal} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-800 text-2xl">Welcome! Complete Your Profile</DialogTitle>
              <DialogDescription>
                Please change your password and complete your profile information to continue.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFirstLoginSubmit} className="space-y-4 mt-4">
              {/* Password Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Change Password *</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="newPassword">New Password *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={firstLoginForm.newPassword}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, newPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={firstLoginForm.confirmPassword}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstLoginForm.firstName}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      value={firstLoginForm.middleName}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={firstLoginForm.lastName}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={firstLoginForm.gender}
                      onValueChange={(value) => setFirstLoginForm({ ...firstLoginForm, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="birthDate">Birth Date</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={firstLoginForm.birthDate}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={firstLoginForm.phone}
                      onChange={(e) => setFirstLoginForm({ ...firstLoginForm, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={firstLoginForm.address}
                    onChange={(e) => setFirstLoginForm({ ...firstLoginForm, address: e.target.value })}
                    placeholder="Street, City, Province"
                  />
                </div>
              </div>

              {firstLoginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
                  {firstLoginError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSavingFirstLogin}
                  className="bg-red-800 hover:bg-red-700"
                >
                  {isSavingFirstLogin ? "Saving..." : "Save & Continue"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b" role="banner">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Sto Niño de Praga Academy Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Student Portal</h1>
              <p className="text-xs text-gray-500">Sto Niño de Praga Academy</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" role="search">
              <label htmlFor="student-portal-search" className="sr-only">
                Search
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" aria-hidden />
              <input
                id="student-portal-search"
                type="text"
                placeholder="Search"
                aria-label="Search portal content"
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {studentInitials}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">{displayName}</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex" role="presentation">
        <aside className="w-64 bg-white min-h-screen border-r border-gray-200" aria-label="Sidebar navigation">
          <nav className="mt-6" role="navigation" aria-label="Student sections">
            <div className="px-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeNav === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavChange(item.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-left text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isActive ? "bg-red-50 text-red-700 border-r-2 border-red-600" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="w-4 h-4 mr-3" aria-hidden />
                    {item.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-8 px-4">
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-50" size="sm">
                  <Home className="w-4 h-4 mr-3" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6" role="main">
          {activeNav === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back, {displayName}!</h2>
                  <p className="text-gray-600">Here&apos;s your academic overview for today.</p>
                </div>
                <div className="flex items-center gap-2">
                  {dashboardError && (
                    <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                      Sync issue
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshDashboard}
                    disabled={dashboardLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className={`w-4 h-4 ${dashboardLoading ? "animate-spin" : ""}`} />
                    Refresh data
                  </Button>
                </div>
              </div>

              {dashboardError && (
                <div className="flex items-start space-x-3 bg-red-50 border border-red-100 text-sm text-red-800 p-4 rounded-md">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold">We couldn&apos;t refresh your dashboard.</p>
                    <p>{dashboardError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                  <Card key={stat.label} className="bg-white border border-gray-200">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {stat.label}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <ChevronRight className="w-3 h-3 mr-1" />
                        {stat.helper}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Recent Assignments</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Your latest assignments and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assignments.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden />
                        <p className="text-gray-600">
                          {dashboardLoading ? "Loading assignments..." : "No assignments available."}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Assignments will load automatically once published.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between border border-gray-100 rounded-lg p-3"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{assignment.title}</p>
                              <p className="text-sm text-gray-500">
                                {assignment.subject} · Due {formatDate(assignment.dueDate)}
                              </p>
                            </div>
                            <Badge
                              className={`${
                                assignment.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : assignment.status === "overdue"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {assignment.status.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">Course Progress</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Your progress in current subjects
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {courseProgress.length === 0 ? (
                      <div className="text-center py-12">
                        <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden />
                        <p className="text-gray-600">
                          {dashboardLoading ? "Syncing progress..." : "No course progress data available."}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">Course progress will be loaded from the database.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {courseProgress.map((course) => (
                          <div key={course.id}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <p className="font-medium text-gray-900">{course.subject}</p>
                              <span className="text-gray-600">{course.completion}%</span>
                            </div>
                            {course.instructor && (
                              <p className="text-xs text-gray-500 mb-2">Instructor: {course.instructor}</p>
                            )}
                            <Progress value={course.completion} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeNav === "enrollment" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Enrollment</h2>
                <Button
                  onClick={generateCertificationPDF}
                  className="bg-red-800 hover:bg-red-700 text-white"
                  disabled={!student}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certification (PDF)
                </Button>
              </div>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Enrollment Status</CardTitle>
                  <CardDescription>Your current enrollment status and information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                      <div>
                        <h4 className="font-medium text-green-800">Enrollment Status</h4>
                        <p className="text-sm text-green-600">
                          {enrollmentInfo?.status ||
                            (student.grade_level
                              ? `Currently enrolled - Grade ${student.grade_level}`
                              : "Enrollment status will be loaded from the database")}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800">Academic Year</h4>
                        <p className="text-sm text-gray-600">
                          {enrollmentInfo?.academicYear || "Academic year information will be loaded from the database."}
                        </p>
                      </div>
                      {enrollmentInfo?.semester && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-800">Semester</h4>
                          <p className="text-sm text-gray-600">{enrollmentInfo.semester}</p>
                        </div>
                      )}
                      {enrollmentInfo?.strand && (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="font-medium text-gray-800">Strand</h4>
                          <p className="text-sm text-gray-600">{enrollmentInfo.strand}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subjects and Teachers */}
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Subjects and Teachers</CardTitle>
                  <CardDescription>Your enrolled subjects and assigned teachers</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden />
                      <p className="text-gray-600">
                        {dashboardLoading ? "Loading subjects..." : "No subjects assigned yet."}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Subject and teacher information will be loaded from the database.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{subject.subject}</h5>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Teacher:</span> {subject.teacher}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === "schedule" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Calendar of Activities</h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>SY 2025-2026 Calendar of Activities</CardTitle>
                      <CardDescription>School activities and important dates</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth("prev")}
                        className="border-gray-300"
                      >
                        ←
                      </Button>
                      <span className="font-semibold text-gray-800 min-w-[200px] text-center">
                        {monthNames[currentMonth]} {currentYear}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth("next")}
                        className="border-gray-300"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="p-3 text-center font-semibold text-gray-700 text-base">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} className="aspect-square" />
                      }
                      const activities = getActivitiesForDate(day)
                      const isToday =
                        day.getDate() === new Date().getDate() &&
                        day.getMonth() === new Date().getMonth() &&
                        day.getFullYear() === new Date().getFullYear()
                      const primaryCategory = activities[0]?.category || null
                      const bgColor = primaryCategory ? categoryColors[primaryCategory] : ""

                      return (
                        <div
                          key={day.toISOString()}
                          className={`aspect-square border border-gray-200 rounded p-2 relative flex flex-col items-center justify-center ${
                            isToday ? "ring-2 ring-red-600" : ""
                          } ${bgColor}`}
                        >
                          <div className={`text-lg font-semibold text-center ${isToday ? "text-red-600" : "text-gray-900"}`}>
                            {day.getDate()}
                          </div>
                          {activities.length > 0 && (
                            <div className="mt-1 space-y-1 w-full">
                              {activities.slice(0, 2).map((activity, idx) => (
                                <div
                                  key={idx}
                                  className={`text-xs px-1 py-1 rounded text-center truncate ${categoryColors[activity.category]}`}
                                  title={activity.title}
                                >
                                  {activity.title.length > 20 ? activity.title.substring(0, 20) + "..." : activity.title}
                                </div>
                              ))}
                              {activities.length > 2 && (
                                <div className="text-xs text-gray-600 font-semibold text-center">
                                  +{activities.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3">Legend:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-blue-200/50 border border-blue-300"></div>
                        <span className="text-sm text-gray-700">Academic</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-green-200/50 border border-green-300"></div>
                        <span className="text-sm text-gray-700">Event</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-red-200/50 border border-red-300"></div>
                        <span className="text-sm text-gray-700">Test</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-yellow-200/50 border border-yellow-300"></div>
                        <span className="text-sm text-gray-700">Workshop</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-pink-200/50 border border-pink-300"></div>
                        <span className="text-sm text-gray-700">Celebration</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded bg-purple-200/50 border border-purple-300"></div>
                        <span className="text-sm text-gray-700">Holiday</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === "grades" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Grades & Reports</h2>
                <Button
                  onClick={generateGradesPDF}
                  className="bg-red-800 hover:bg-red-700 text-white"
                  disabled={!student}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate (PDF)
                </Button>
              </div>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Current Grades</CardTitle>
                  <CardDescription>Your grades for the current semester</CardDescription>
                </CardHeader>
                <CardContent>
                  {gradeItems.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" aria-hidden />
                      <p className="text-gray-600">
                        {dashboardLoading ? "Fetching grades..." : "No grades available."}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">Grades will be loaded from the database.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {gradeItems.map((grade) => (
                        <div
                          key={grade.id}
                          className="flex items-center justify-between border border-gray-100 rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{grade.subject}</p>
                            <p className="text-sm text-gray-500">Updated {formatDate(grade.lastUpdated)}</p>
                          </div>
                          <div className="text-xl font-semibold text-gray-900">{grade.grade}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeNav === "profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Profile</h2>
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your student profile and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <p className="text-gray-900">{displayName}</p>
                    </div>
                    {student.first_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <p className="text-gray-900">{student.first_name}</p>
                      </div>
                    )}
                    {student.last_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <p className="text-gray-900">{student.last_name}</p>
                      </div>
                    )}
                    {student.student_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <p className="text-gray-900">{student.student_id}</p>
                      </div>
                    )}
                    {student.grade_level && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                        <p className="text-gray-900">{student.grade_level}</p>
                      </div>
                    )}
                    {student.section && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <p className="text-gray-900">{student.section}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 items-center">
                        <Mail className="w-4 h-4 mr-1" aria-hidden />
                        Email
                      </label>
                      <p className="text-gray-900 break-words">{student.email}</p>
                    </div>
                    {(student.phone || student.contact_number) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <p className="text-gray-900">{student.phone || student.contact_number}</p>
                      </div>
                    )}
                    {student.address && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-gray-900">{student.address}</p>
                      </div>
                    )}
                    {Object.entries(student)
                      .filter(([key]) =>
                        [
                          "id",
                          "email",
                          "Password",
                          "password",
                          "name",
                          "first_name",
                          "last_name",
                          "student_id",
                          "grade_level",
                          "section",
                          "phone",
                          "contact_number",
                          "address",
                          "gpa",
                          "attendance_rate",
                          "active_courses",
                          "pending_tasks",
                        ].every((reserved) => reserved !== key),
                      )
                      .map(([key, value]) => (
                        value && (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                              {key.replace(/_/g, " ")}
                            </label>
                            <p className="text-gray-900">{String(value)}</p>
                          </div>
                        )
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
