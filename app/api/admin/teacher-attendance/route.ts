import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') // Optional: filter by start date
    const endDateParam = searchParams.get('endDate') // Optional: filter by end date
    const teacherId = searchParams.get('teacherId') // Optional: filter by specific teacher
    
    const admin = getSupabaseAdmin()
    
    // Calculate date range (default: last 30 days) - Manila timezone
    const startDateStr = startDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      return d.toISOString().split('T')[0]
    })()
    const endDateStr = endDateParam || new Date().toISOString().split('T')[0]
    
    // Convert Manila local date to UTC range
    const startISO = `${startDateStr}T00:00:00.000Z`
    const endISO = `${endDateStr}T23:59:59.999Z`
    
    // Fetch all teachers
    const { data: teachers, error: teachersError } = await admin
      .from('users')
      .eq('role', 'teacher')
      .select('*')
      .limit(1000)
    
    if (teachersError) {
      console.error('Error fetching teachers:', teachersError)
    }
    
    // Fetch attendance records for teachers
    // Teachers are identified by checking if user_id matches a teacher's UUID
    const { data: allAttendanceRecords, error: attendanceError } = await admin
      .from('attendance_records')
      .select('*')
      .gte('scan_time', startISO)
      .lte('scan_time', endISO)
      .order('scan_time', { ascending: true })
    
    if (attendanceError) {
      console.error('Error fetching attendance records:', attendanceError)
      return NextResponse.json(
        {
          success: false,
          error: attendanceError.message,
          data: null,
        },
        { status: 200 }
      )
    }
    
    // Build teacher map for quick lookup by ID, email, and RFID
    const teacherMap: Record<string, any> = {}
    const teacherRfidMap: Record<string, any> = {} // Map RFID to teacher
    if (teachers) {
      teachers.forEach((teacher: any) => {
        const teacherIdStr = (teacher.employee_number || teacher.id || '').toString().trim()
        const teacherEmail = (teacher.email || '').toString().trim().toLowerCase()
        const teacherName = `${teacher.first_name || ''} ${teacher.middle_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown'
        
        // Map by teacher ID or UUID
        const teacherUuid = (teacher.id || '').toString().trim()
        if (teacherIdStr) {
          teacherMap[teacherIdStr] = {
            ...teacher,
            fullName: teacherName,
          }
        }
        if (teacherUuid) {
          teacherMap[teacherUuid] = teacherMap[teacherIdStr] || {
            ...teacher,
            fullName: teacherName,
          }
        }
        
        // Map by email
        if (teacherEmail) {
          teacherMap[teacherEmail] = {
            ...teacher,
            fullName: teacherName,
          }
        }
        
        // Map by RFID card (normalize: uppercase, remove spaces)
        const rfidCard = (teacher.rfid || '').toString().trim().toUpperCase().replace(/\s+/g, '')
        if (rfidCard) {
          teacherRfidMap[rfidCard] = {
            ...teacher,
            fullName: teacherName,
          }
          // Also add to main map for quick lookup
          teacherMap[rfidCard] = {
            ...teacher,
            fullName: teacherName,
          }
        }
      })
    }
    
    console.log(`📊 Found ${teachers?.length || 0} teachers`)
    console.log(`🔑 Teacher RFID map has ${Object.keys(teacherRfidMap).length} entries:`, Object.keys(teacherRfidMap))
    
    // Filter attendance records to only include teachers
    // Check both user_id match AND RFID card match
    const teacherAttendanceRecords = (allAttendanceRecords || []).filter((record: any) => {
      const recordId = (record.user_id || '').toString().trim()
      const recordRfid = (record.rfid_card || record.rfidCard || record.rfid_tag || record.rfidTag || '').toString().trim().toUpperCase().replace(/\s+/g, '')
      
      // Check if user_id matches a teacher
      if (teacherMap[recordId] !== undefined) {
        return true
      }
      
      // Check if RFID card matches a teacher
      if (recordRfid && teacherRfidMap[recordRfid] !== undefined) {
        return true
      }
      
      return false
    })
    
    console.log(`✅ Found ${teacherAttendanceRecords.length} teacher attendance records out of ${allAttendanceRecords?.length || 0} total records`)
    
    // Group attendance by teacher
    const teacherStats: Record<string, {
      teacher: any
      records: any[]
      totalDays: number
      present: number
      absent: number
      late: number
      percentage: number
      dailyAttendance: Record<string, string> // date -> status code
    }> = {}
    
    // Process each attendance record
    teacherAttendanceRecords.forEach((record: any) => {
      const recordId = (record.user_id || '').toString().trim()
      const recordRfid = (record.rfid_card || record.rfidCard || record.rfid_tag || record.rfidTag || '').toString().trim().toUpperCase().replace(/\s+/g, '')
      
      // Try to find teacher by user_id first, then by RFID
      let teacher = teacherMap[recordId]
      if (!teacher && recordRfid) {
        teacher = teacherRfidMap[recordRfid] || teacherMap[recordRfid]
      }
      
      if (!teacher) {
        console.log(`⚠️ Could not find teacher for record: id=${recordId}, rfid=${recordRfid}`)
        return
      }
      
      const teacherKey = teacher.employee_number || teacher.id || recordId
      
      if (!teacherStats[teacherKey]) {
        teacherStats[teacherKey] = {
          teacher,
          records: [],
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0,
          dailyAttendance: {},
        }
      }
      
      teacherStats[teacherKey].records.push(record)
      
      // Determine status - Use Manila timezone to get correct date
      const scanDateTime = new Date(record.scan_time)
      const manilaDate = new Date(scanDateTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
      const year = manilaDate.getFullYear()
      const month = String(manilaDate.getMonth() + 1).padStart(2, '0')
      const day = String(manilaDate.getDate()).padStart(2, '0')
      const scanDate = `${year}-${month}-${day}` // YYYY-MM-DD in Manila time
      const status = record.status || 'Present'
      const scanType = record.scan_type || 'timein'
      
      // Count attendance
      if (status === 'Present' || scanType === 'timein') {
        teacherStats[teacherKey].present++
        teacherStats[teacherKey].dailyAttendance[scanDate] = 'PR' // Present
      } else if (status === 'Absent') {
        teacherStats[teacherKey].absent++
        teacherStats[teacherKey].dailyAttendance[scanDate] = 'AC' // Absent - Coded
      } else if (status === 'Late') {
        teacherStats[teacherKey].late++
        teacherStats[teacherKey].dailyAttendance[scanDate] = 'LA' // Late
      }
      
      teacherStats[teacherKey].totalDays++
    })
    
    // Calculate percentages and format data
    const teacherList = Object.values(teacherStats).map((stats) => {
      const total = stats.totalDays || 1 // Avoid division by zero
      stats.percentage = Math.round((stats.present / total) * 100)
      
      return {
        teacherId: stats.teacher.employee_number || stats.teacher.id,
        teacherName: stats.teacher.fullName,
        subject: stats.teacher.specialization || stats.teacher.department || 'N/A',
        totalDays: stats.totalDays,
        present: stats.present,
        absent: stats.absent,
        late: stats.late,
        percentage: stats.percentage,
        dailyAttendance: stats.dailyAttendance,
        records: stats.records,
      }
    })
    
    // Calculate general statistics
    const totalTeachers = teacherList.length || 1
    const totalPresent = teacherList.reduce((sum, t) => sum + t.present, 0)
    const totalAbsent = teacherList.reduce((sum, t) => sum + t.absent, 0)
    const totalDays = teacherList.reduce((sum, t) => sum + t.totalDays, 0)
    const overallPresentPercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0
    const overallAbsentPercentage = totalDays > 0 ? Math.round((totalAbsent / totalDays) * 100) : 0
    
    // Filter by specific teacher if requested
    let selectedTeacherData = null
    if (teacherId) {
      selectedTeacherData = teacherList.find((t) => 
        (t.teacherId || '').toString() === teacherId.toString()
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        general: {
          totalTeachers,
          totalPresent,
          totalAbsent,
          totalDays,
          presentPercentage: overallPresentPercentage,
          absentPercentage: overallAbsentPercentage,
        },
        teachers: teacherList,
        selectedTeacher: selectedTeacherData,
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in teacher attendance API:', error)
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

