import { useEffect, useState } from "react"
import type { AdminSettings, AttendanceData, Stats, Student, Teacher } from "../types"

const DEFAULT_SETTINGS: AdminSettings = {
  schoolName: "Sto Niño de Praga Academy",
  academicYear: "2024-2025",
  automaticBackup: true,
  rfidIntegration: true,
  emailNotifications: true,
  studentPortal: true,
  teacherPortal: true,
}

export function useAdminData(admin: any) {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
  })
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null)
  const [settingsForm, setSettingsForm] = useState<AdminSettings>(DEFAULT_SETTINGS)
  
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  const fetchStats = async () => {
    setLoadingStats(true)
    try {
      const response = await fetch("/api/admin/stats")
      const result = await response.json()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchStudents = async () => {
    setLoadingStudents(true)
    try {
      const response = await fetch("/api/admin/students")
      const result = await response.json()
      if (result.success && result.students) {
        setStudents(result.students)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchTeachers = async () => {
    setLoadingTeachers(true)
    try {
      const response = await fetch("/api/admin/teachers")
      const result = await response.json()
      if (result.success && result.teachers) {
        setTeachers(result.teachers)
      }
    } catch (error) {
      console.error("Error fetching teachers:", error)
    } finally {
      setLoadingTeachers(false)
    }
  }

  const fetchAttendance = async () => {
    setAttendanceLoading(true)
    setAttendanceError(null)
    try {
      const response = await fetch("/api/admin/attendance")
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please check the API endpoint.")
      }
      
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load attendance data.")
      }
      setAttendanceData(result.data)
    } catch (error: any) {
      console.error("Error fetching attendance:", error)
      if (error?.message?.includes("JSON") || error?.message?.includes("DOCTYPE")) {
        setAttendanceError("Unable to connect to attendance service. Please check if the server is running.")
      } else {
        setAttendanceError(error?.message || "Unable to load attendance data.")
      }
    } finally {
      setAttendanceLoading(false)
    }
  }

  const fetchSettings = async () => {
    setSettingsLoading(true)
    try {
      const response = await fetch("/api/admin/settings")
      
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        throw new Error(`Invalid response format: ${text.substring(0, 100)}`)
      }
      
      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to load settings.")
      }
      setSettingsForm(result.settings)
    } catch (error: any) {
      console.error("Error fetching settings:", error)
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    if (admin) {
      Promise.all([
        fetchStats().catch(err => console.error("Error in fetchStats:", err)),
        fetchStudents().catch(err => console.error("Error in fetchStudents:", err)),
        fetchTeachers().catch(err => console.error("Error in fetchTeachers:", err)),
        fetchAttendance().catch(err => console.error("Error in fetchAttendance:", err)),
        fetchSettings().catch(err => console.error("Error in fetchSettings:", err)),
      ])
    }
  }, [admin])

  return {
    stats,
    students,
    teachers,
    attendanceData,
    settingsForm,
    loadingStats,
    loadingStudents,
    loadingTeachers,
    attendanceLoading,
    attendanceError,
    settingsLoading,
    setStudents,
    setTeachers,
    setSettingsForm,
    fetchStats,
    fetchStudents,
    fetchTeachers,
    fetchAttendance,
  }
}
