import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('📊 Attendance Reports API called')
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') // Optional: filter by start date
    const endDate = searchParams.get('endDate') // Optional: filter by end date
    const studentId = searchParams.get('studentId') // Optional: filter by specific student
    const gradeLevel = searchParams.get('gradeLevel') // Optional: filter by grade
    const section = searchParams.get('section') // Optional: filter by section
    
    console.log('📅 Date range:', { startDate, endDate, studentId, gradeLevel, section })
    
    const admin = getSupabaseAdmin()
    
    // Calculate date range (default: last 30 days) - Manila timezone
    // For Manila (UTC+8), we need to query from start of day to end of day in UTC
    const startDateStr = startDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()
    const endDateStr = endDate || new Date().toISOString().split('T')[0]
    
    // Convert Manila local date to UTC range
    // Start: YYYY-MM-DD 00:00:00 Manila = YYYY-MM-DD-1 16:00:00 UTC
    // End: YYYY-MM-DD 23:59:59 Manila = YYYY-MM-DD 15:59:59 UTC
    const startISO = `${startDateStr}T00:00:00.000Z`
    const endISO = `${endDateStr}T23:59:59.999Z`
    
    console.log('🔍 Querying students...')
    // Fetch all students
    const { data: students, error: studentsError } = await admin
      .from('students')
      .select('*')
      .limit(1000)
    
    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch students: ${studentsError.message}`,
          data: null,
        },
        { status: 200 }
      )
    }
    
    console.log(`✅ Found ${students?.length || 0} students`)
    
    // Filter students by grade/section if specified
    let filteredStudents = students || []
    if (gradeLevel && gradeLevel !== 'all') {
      filteredStudents = filteredStudents.filter((s: any) => 
        (s.grade_level || '').toString().toLowerCase() === gradeLevel.toLowerCase()
      )
    }
    if (section && section !== 'all') {
      filteredStudents = filteredStudents.filter((s: any) => 
        (s.section || '').toString().toLowerCase() === section.toLowerCase()
      )
    }
    
    console.log('🔍 Querying attendance records from', startISO, 'to', endISO)
    // Fetch attendance records
    const { data: allAttendanceRecords, error: attendanceError } = await admin
      .from('attendance_records')
      .select('*')
      .gte('scan_time', startISO)
      .lte('scan_time', endISO)
      .order('scan_time', { ascending: false })
    
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
    console.log(allAttendanceRecords.map((r) => r.scan_time));
    console.log(`✅ Found ${allAttendanceRecords?.length || 0} attendance records`)
    
    // Build student map for quick lookup
    const studentMap: Record<string, any> = {}
    if (students) {
      students.forEach((student: any) => {
        const studentIdStr = (student.student_id || student.student_number || student.id || '').toString().trim()
        if (studentIdStr) {
          studentMap[studentIdStr] = {
            ...student,
            fullName: `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''}`.trim() || student.name || 'Unknown',
          }
        }
      })
    }
    
    // Filter attendance records to only include students (not teachers)
    const studentAttendanceRecords = (allAttendanceRecords || []).filter((record: any) => {
      const recordId = (record.student_id || '').toString().trim()
      const student = studentMap[recordId]
      return student !== undefined
    })
    
    // Filter by specific student if requested
    let finalRecords = studentAttendanceRecords
    if (studentId && studentId !== 'all') {
      finalRecords = studentAttendanceRecords.filter((record: any) => {
        const recordId = (record.student_id || '').toString().trim()
        return recordId === studentId.toString().trim()
      })
    }
    
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
      const recordId = (record.student_id || '').toString().trim()
      const student = studentMap[recordId]
      
      if (!student) return
      
      const studentKey = student.student_id || student.student_number || recordId
      
      if (!studentStats[studentKey]) {
        studentStats[studentKey] = {
          student,
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
        studentId: stats.student.student_id || stats.student.student_number || stats.student.id,
        studentName: stats.student.fullName,
        gradeLevel: stats.student.grade_level || stats.student.gradeLevel || 'N/A',
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
    
    // Get unique grade levels and sections for filters
    const gradeLevels = [...new Set((students || []).map((s: any) => s.grade_level || s.gradeLevel).filter(Boolean))]
    const sections = [...new Set((students || []).map((s: any) => s.section).filter(Boolean))]
    
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
          gradeLevels: gradeLevels.sort(),
          sections: sections.sort(),
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

