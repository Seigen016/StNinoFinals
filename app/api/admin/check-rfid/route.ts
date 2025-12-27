import { supabase } from '@/lib/supabaseClient'
import { NextResponse } from 'next/server'

// Enable CORS for ESP32 requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// GET - Check if RFID is assigned to a student
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rfidCard = searchParams.get('rfid')
    
    if (!rfidCard) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'RFID card parameter is required',
          assigned: false
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    // Normalize RFID card
    const rfidNormalized = rfidCard.toString().trim().toUpperCase().replace(/\s+/g, '')
    const rfidNoLeadingZeros = rfidNormalized.replace(/^0+/, '')
    
    console.log(`Checking RFID: ${rfidNormalized}`)
    
    // Try to find student by RFID
    // First, get all students from users table and filter in memory to avoid column errors
    const { data: allStudents, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .limit(1000) // Get reasonable number of students

    if (fetchError) {
      console.error('Error fetching students:', fetchError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${fetchError.message}`,
          assigned: false,
          searchedRfid: rfidNormalized
        },
        { 
          status: 200, // Return 200 instead of 500 to prevent Internal Server Error
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      )
    }

    // Filter students in memory by RFID (check rfid column)
    const students = (allStudents || []).filter((student: any) => {
      const rfid = (student.rfid || '').toString().trim().toUpperCase()
      
      return rfid === rfidNormalized || rfid === rfidNoLeadingZeros ||
             rfid.includes(rfidNormalized)
    })

    const studentError = null // No error since we filtered in memory

    if (!students || students.length === 0) {
      // No student found with this RFID
      return NextResponse.json({
        success: true,
        assigned: false,
        message: `RFID ${rfidNormalized} is not assigned to any student`,
        searchedRfid: rfidNormalized
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    // Student found!
    const student = students[0]
    return NextResponse.json({
      success: true,
      assigned: true,
      student: {
        studentId: student.student_number || student.id || null,
        name: `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim() || 'Unknown',
        email: student.email || null,
        gradeLevel: student.grade_level || null,
        section: student.section || null,
        rfidCard: student.rfid || null,
      },
      searchedRfid: rfidNormalized,
      matchType: 'exact'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error: any) {
    console.error('Check RFID API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Internal server error',
        assigned: false,
      },
      { 
        status: 200, // Return 200 instead of 500 to prevent Internal Server Error
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  }
}

