import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/attendance-reports
 * 
 * Fetches student attendance data for a specified date range.
 * Returns data in Manila timezone (UTC+8) for accurate date display.
 * 
 * Query Parameters:
 * - startDate: Start date (YYYY-MM-DD, optional, defaults to 30 days ago)
 * - endDate: End date (YYYY-MM-DD, optional, defaults to today)
 * - studentId: Filter by specific student (optional)
 * - gradeLevel: Filter by grade level (optional)
 * - section: Filter by section (optional)
 * 
 * IMPORTANT: All dates in Manila timezone to avoid date shifting issues
 */
export async function GET(request: Request) {
  try {
    console.log('📊 Attendance Reports API called')
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const studentId = searchParams.get('studentId')
    const gradeLevel = searchParams.get('gradeLevel')
    const section = searchParams.get('section')
    
    console.log('📅 Date range:', { startDate, endDate, studentId, gradeLevel, section })
    
    const admin = getSupabaseAdmin()
    
    /**
     * Calculate date range with Manila timezone handling
     * Default: Last 30 days
     * 
     * Dates are sent as YYYY-MM-DD strings (not ISO) to avoid UTC conversion
     * Backend converts scan_time to Manila timezone before grouping by date
     */
    const startDateStr = startDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()
    const endDateStr = endDate || new Date().toISOString().split('T')[0]
    
    // Query range: from start of startDate to end of endDate (inclusive)
    const startISO = `${startDateStr}T00:00:00.000Z`
    const endISO = `${endDateStr}T23:59:59.999Z`
    
    console.log('🔍 Querying attendance records with student data...')
    
    // If filtering by student, first get their UUID from student_number
    let userUuid: string | null = null
    if (studentId && studentId !== 'all') {
      const { data: student } = await admin
        .from('users')
        .select('id')
        .eq('role', 'student')
        .or(`id.eq.${studentId},student_number.eq.${studentId}`)
        .single()
      
      if (student) {
        userUuid = student.id
      } else {
        console.warn(`⚠️ No student found with ID/number: ${studentId}`)
      }
    }
    
    /**
     * Single optimized query with join to get attendance + student data
     * Filters applied at database level for better performance
     */
    let query = admin
      .from('attendance_records')
      .select(`
        *,
        users!attendance_records_user_id_fkey (
          id,
          first_name,
          middle_name,
          last_name,
          student_number,
          grade_level,
          section,
          role
        )
      `)
      .gte('scan_time', startISO)
      .lte('scan_time', endISO)
      .eq('users.role', 'student')
      .order('scan_time', { ascending: false })
    
    // Apply filters at database level using UUID
    if (userUuid) {
      query = query.eq('user_id', userUuid)
    }
    if (gradeLevel && gradeLevel !== 'all') {
      query = query.eq('users.grade_level', gradeLevel)
    }
    if (section && section !== 'all') {
      query = query.eq('users.section', section)
    }
    
    const { data: attendanceWithStudents, error: attendanceError } = await query
    
    if (attendanceError) {
      console.error('❌ Error fetching attendance records:', attendanceError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch attendance records: ${attendanceError.message}`,
          data: null,
        },
        { status: 200 }
      )
    }
    
    // Filter out records without valid student data
    const finalRecords = (attendanceWithStudents || []).filter((record: any) => record.users)
    
    console.log(`✅ Found ${finalRecords.length} attendance records with student data`)
    
    // Group attendance by student
    const studentStats: Record<string, {
      student: any
      records: any[]
      totalDays: number
      present: number
      absent: number
      late: number
      excused: number
      percentage: number
      dailyAttendance: Record<string, string> // date -> status code
    }> = {}
    
    // Process each attendance record
    finalRecords.forEach((record: any) => {
      const student = record.users
      
      if (!student) return
      
      const studentKey = student.student_number || student.id
      
      if (!studentStats[studentKey]) {
        studentStats[studentKey] = {
          student: {
            ...student,
            fullName: `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
          },
          records: [],
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          percentage: 0,
          dailyAttendance: {},
        }
      }
      
      studentStats[studentKey].records.push(record)
      
      // Determine status - Use Manila timezone to get correct date
      const scanDateTime = new Date(record.scan_time)
      const manilaDate = new Date(scanDateTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
      const year = manilaDate.getFullYear()
      const month = String(manilaDate.getMonth() + 1).padStart(2, '0')
      const day = String(manilaDate.getDate()).padStart(2, '0')
      const scanDate = `${year}-${month}-${day}` // YYYY-MM-DD in Manila time
      const status = (record.status || 'Present').toLowerCase()
      const scanType = (record.scan_type || 'timein').toLowerCase()
      
      // Count attendance (only count time-in records to avoid double counting)
      if (scanType === 'timein' || scanType === 'time_in') {
        if (status === 'present') {
          studentStats[studentKey].present++
          studentStats[studentKey].dailyAttendance[scanDate] = 'PR' // Present
        } else if (status === 'absent') {
          studentStats[studentKey].absent++
          studentStats[studentKey].dailyAttendance[scanDate] = 'AC' // Absent - Coded
        } else if (status === 'late') {
          studentStats[studentKey].late++
          studentStats[studentKey].dailyAttendance[scanDate] = 'LA' // Late
        } else if (status === 'excused') {
          studentStats[studentKey].excused++
          studentStats[studentKey].dailyAttendance[scanDate] = 'EX' // Excused
        }
        studentStats[studentKey].totalDays++
      }
    })
    
    // Calculate percentages and format data
    const studentList = Object.values(studentStats).map((stats) => {
      const total = stats.totalDays || 1 // Avoid division by zero
      stats.percentage = Math.round((stats.present / total) * 100)
      
      return {
        studentId: stats.student.student_number || stats.student.id,
        studentName: stats.student.fullName,
        gradeLevel: stats.student.grade_level || 'N/A',
        section: stats.student.section || 'N/A',
        totalDays: stats.totalDays,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        excused: stats.excused,
        percentage: stats.percentage,
        dailyAttendance: stats.dailyAttendance,
        records: stats.records,
      }
    })
    
    // Calculate general statistics
    const totalStudents = studentList.length || 1
    const totalPresent = studentList.reduce((sum, s) => sum + s.present, 0)
    const totalAbsent = studentList.reduce((sum, s) => sum + s.absent, 0)
    const totalLate = studentList.reduce((sum, s) => sum + s.late, 0)
    const totalDays = studentList.reduce((sum, s) => sum + s.totalDays, 0)
    const overallPresentPercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0
    const overallAbsentPercentage = totalDays > 0 ? Math.round((totalAbsent / totalDays) * 100) : 0
    
    // Filter by specific student if requested
    let selectedStudentData = null
    if (studentId && studentId !== 'all') {
      selectedStudentData = studentList.find((s) => 
        (s.studentId || '').toString() === studentId.toString()
      )
    }
    
    // Get unique grade levels and sections from the fetched records
    const uniqueStudents = new Map()
    finalRecords.forEach((record: any) => {
      if (record.users) {
        uniqueStudents.set(record.users.id, record.users)
      }
    })
    const studentsArray = Array.from(uniqueStudents.values())
    const gradeLevels = [...new Set(studentsArray.map((s: any) => s.grade_level).filter(Boolean))].sort()
    const sections = [...new Set(studentsArray.map((s: any) => s.section).filter(Boolean))].sort()
    
    console.log(`📈 Returning data: ${studentList.length} students, ${totalDays} total days, ${overallPresentPercentage}% present`)
    
    return NextResponse.json({
      success: true,
      data: {
        general: {
          totalStudents,
          totalPresent,
          totalAbsent,
          totalLate,
          totalDays,
          presentPercentage: overallPresentPercentage,
          absentPercentage: overallAbsentPercentage,
        },
        students: studentList,
        selectedStudent: selectedStudentData,
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
        filters: {
          gradeLevels: gradeLevels,
          sections: sections,
        },
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in attendance reports API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
        data: null,
      },
      { status: 200 }
    )
  }
}

