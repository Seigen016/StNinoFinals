module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[externals]/punycode [external] (punycode, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[project]/lib/supabaseAdmin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSupabaseAdmin",
    ()=>getSupabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$78$2e$0$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@supabase+supabase-js@2.78.0/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
/**
 * Supabase Admin Client for Server-Side Operations
 * 
 * ⚠️ SECURITY WARNING: This client uses the SERVICE ROLE KEY
 * - Bypasses ALL Row Level Security (RLS) policies
 * - Full database access with no restrictions
 * - ONLY use in server-side code (API routes, Server Components)
 * - NEVER import or use in client-side components
 * 
 * Use Cases:
 * - Admin operations requiring elevated privileges
 * - System-level database operations
 * - Background jobs and cron tasks
 */ const supabaseUrl = ("TURBOPACK compile-time value", "https://ulntyefamkxkbynrugop.supabase.co");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
function getSupabaseAdmin() {
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase admin env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only).');
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$supabase$2b$supabase$2d$js$40$2$2e$78$2e$0$2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/admin/attendance-reports/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseAdmin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.8_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        console.log('📊 Attendance Reports API called');
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const studentId = searchParams.get('studentId');
        const gradeLevel = searchParams.get('gradeLevel');
        const section = searchParams.get('section');
        console.log('📅 Date range:', {
            startDate,
            endDate,
            studentId,
            gradeLevel,
            section
        });
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        /**
     * Calculate date range with Manila timezone handling
     * Default: Last 30 days
     * 
     * Dates are sent as YYYY-MM-DD strings (not ISO) to avoid UTC conversion
     * Backend converts scan_time to Manila timezone before grouping by date
     */ const startDateStr = startDate || (()=>{
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().split('T')[0];
        })();
        const endDateStr = endDate || new Date().toISOString().split('T')[0];
        // Query range: from start of startDate to end of endDate (inclusive)
        const startISO = `${startDateStr}T00:00:00.000Z`;
        const endISO = `${endDateStr}T23:59:59.999Z`;
        console.log('🔍 Querying attendance records with student data...');
        // If filtering by student, first get their UUID from student_number
        let userUuid = null;
        if (studentId && studentId !== 'all') {
            const { data: student } = await admin.from('users').select('id').eq('role', 'student').or(`id.eq.${studentId},student_number.eq.${studentId}`).single();
            if (student) {
                userUuid = student.id;
            } else {
                console.warn(`⚠️ No student found with ID/number: ${studentId}`);
            }
        }
        /**
     * Single optimized query with join to get attendance + student data
     * Filters applied at database level for better performance
     */ let query = admin.from('attendance_records').select(`
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
      `).gte('scan_time', startISO).lte('scan_time', endISO).eq('users.role', 'student').order('scan_time', {
            ascending: false
        });
        // Apply filters at database level using UUID
        if (userUuid) {
            query = query.eq('user_id', userUuid);
        }
        if (gradeLevel && gradeLevel !== 'all') {
            query = query.eq('users.grade_level', gradeLevel);
        }
        if (section && section !== 'all') {
            query = query.eq('users.section', section);
        }
        const { data: attendanceWithStudents, error: attendanceError } = await query;
        if (attendanceError) {
            console.error('❌ Error fetching attendance records:', attendanceError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: `Failed to fetch attendance records: ${attendanceError.message}`,
                data: null
            }, {
                status: 200
            });
        }
        // Filter out records without valid student data
        const finalRecords = (attendanceWithStudents || []).filter((record)=>record.users);
        console.log(`✅ Found ${finalRecords.length} attendance records with student data`);
        // Group attendance by student
        const studentStats = {};
        // Process each attendance record
        finalRecords.forEach((record)=>{
            const student = record.users;
            if (!student) return;
            const studentKey = student.student_number || student.id;
            if (!studentStats[studentKey]) {
                studentStats[studentKey] = {
                    student: {
                        ...student,
                        fullName: `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim() || 'Unknown'
                    },
                    records: [],
                    totalDays: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    percentage: 0,
                    dailyAttendance: {}
                };
            }
            studentStats[studentKey].records.push(record);
            // Determine status - Use Manila timezone to get correct date
            const scanDateTime = new Date(record.scan_time);
            const manilaDate = new Date(scanDateTime.toLocaleString('en-US', {
                timeZone: 'Asia/Manila'
            }));
            const year = manilaDate.getFullYear();
            const month = String(manilaDate.getMonth() + 1).padStart(2, '0');
            const day = String(manilaDate.getDate()).padStart(2, '0');
            const scanDate = `${year}-${month}-${day}` // YYYY-MM-DD in Manila time
            ;
            const status = (record.status || 'Present').toLowerCase();
            const scanType = (record.scan_type || 'timein').toLowerCase();
            // Count attendance (only count time-in records to avoid double counting)
            if (scanType === 'timein' || scanType === 'time_in') {
                if (status === 'present') {
                    studentStats[studentKey].present++;
                    studentStats[studentKey].dailyAttendance[scanDate] = 'PR'; // Present
                } else if (status === 'absent') {
                    studentStats[studentKey].absent++;
                    studentStats[studentKey].dailyAttendance[scanDate] = 'AC'; // Absent - Coded
                } else if (status === 'late') {
                    studentStats[studentKey].late++;
                    studentStats[studentKey].dailyAttendance[scanDate] = 'LA'; // Late
                } else if (status === 'excused') {
                    studentStats[studentKey].excused++;
                    studentStats[studentKey].dailyAttendance[scanDate] = 'EX'; // Excused
                }
                studentStats[studentKey].totalDays++;
            }
        });
        // Calculate percentages and format data
        const studentList = Object.values(studentStats).map((stats)=>{
            const total = stats.totalDays || 1 // Avoid division by zero
            ;
            stats.percentage = Math.round(stats.present / total * 100);
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
                records: stats.records
            };
        });
        // Calculate general statistics
        const totalStudents = studentList.length || 1;
        const totalPresent = studentList.reduce((sum, s)=>sum + s.present, 0);
        const totalAbsent = studentList.reduce((sum, s)=>sum + s.absent, 0);
        const totalLate = studentList.reduce((sum, s)=>sum + s.late, 0);
        const totalDays = studentList.reduce((sum, s)=>sum + s.totalDays, 0);
        const overallPresentPercentage = totalDays > 0 ? Math.round(totalPresent / totalDays * 100) : 0;
        const overallAbsentPercentage = totalDays > 0 ? Math.round(totalAbsent / totalDays * 100) : 0;
        // Filter by specific student if requested
        let selectedStudentData = null;
        if (studentId && studentId !== 'all') {
            selectedStudentData = studentList.find((s)=>(s.studentId || '').toString() === studentId.toString());
        }
        // Get unique grade levels and sections from the fetched records
        const uniqueStudents = new Map();
        finalRecords.forEach((record)=>{
            if (record.users) {
                uniqueStudents.set(record.users.id, record.users);
            }
        });
        const studentsArray = Array.from(uniqueStudents.values());
        const gradeLevels = [
            ...new Set(studentsArray.map((s)=>s.grade_level).filter(Boolean))
        ].sort();
        const sections = [
            ...new Set(studentsArray.map((s)=>s.section).filter(Boolean))
        ].sort();
        console.log(`📈 Returning data: ${studentList.length} students, ${totalDays} total days, ${overallPresentPercentage}% present`);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                general: {
                    totalStudents,
                    totalPresent,
                    totalAbsent,
                    totalLate,
                    totalDays,
                    presentPercentage: overallPresentPercentage,
                    absentPercentage: overallAbsentPercentage
                },
                students: studentList,
                selectedStudent: selectedStudentData,
                dateRange: {
                    start: startDateStr,
                    end: endDateStr
                },
                filters: {
                    gradeLevels: gradeLevels,
                    sections: sections
                }
            }
        }, {
            status: 200
        });
    } catch (error) {
        console.error('Error in attendance reports API:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || 'Internal server error',
            data: null
        }, {
            status: 200
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__79f51e38._.js.map