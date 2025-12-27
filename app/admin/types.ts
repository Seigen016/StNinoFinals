export interface Admin {
  id: string
  email: string
  name?: string
  first_name?: string
  last_name?: string
  role?: string
  [key: string]: any
}

export interface Student {
  id: string
  first_name: string
  last_name: string
  middle_name?: string | null
  student_number: string | null
  grade_level: string | null
  section: string | null
  email?: string | null
  phone_number?: string | null
  status?: string | null
  created_at?: string | null
  rfid?: string | null
  role?: string | null
  name?: string
}

export interface Teacher {
  id: string
  first_name: string
  last_name: string
  middle_name?: string | null
  employee_number: string | null
  email?: string | null
  phone_number?: string | null
  department?: string | null
  specialization?: string | null
  date_hired?: string | null
  status?: string | null
  created_at?: string | null
  rfid?: string | null
  role?: string | null
  name?: string
}

export interface AttendanceData {
  summary: {
    totalStudents: number
    presentStudents: number
    totalTeachers: number
    presentTeachers: number
    lastSync: string
  }
  rfid: {
    status: string
    activeCards: number
    offlineReaders: number
    pendingActivations: number
  }
  recentAlerts: {
    id: string
    type: "info" | "warning" | "error"
    message: string
    timestamp: string
  }[]
}

export interface AdminSettings {
  schoolName: string
  academicYear: string
  automaticBackup: boolean
  rfidIntegration: boolean
  emailNotifications: boolean
  studentPortal: boolean
  teacherPortal: boolean
}

export interface Stats {
  totalStudents: number
  totalTeachers: number
  totalParents: number
  attendanceRate: number
}

export interface StudentFilters {
  search: string
  grade: string
  status: string
}

export interface TeacherFilters {
  search: string
  department: string
  status: string
}

export interface NewStudentCredentials {
  student_number: string
  username: string
  password: string
  first_name: string
  last_name: string
}
