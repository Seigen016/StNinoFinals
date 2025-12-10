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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

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
const supabaseUrl = ("TURBOPACK compile-time value", "https://ulntyefamkxkbynrugop.supabase.co");
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
"[project]/app/api/admin/attendance-reports/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.8_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseAdmin.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        console.log('📊 Attendance Reports API called');
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') // Optional: filter by start date
        ;
        const endDate = searchParams.get('endDate') // Optional: filter by end date
        ;
        const studentId = searchParams.get('studentId') // Optional: filter by specific student
        ;
        const gradeLevel = searchParams.get('gradeLevel') // Optional: filter by grade
        ;
        const section = searchParams.get('section') // Optional: filter by section
        ;
        console.log('📅 Date range:', {
            startDate,
            endDate,
            studentId,
            gradeLevel,
            section
        });
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        // Calculate date range (default: last 30 days)
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            start.setDate(start.getDate() - 30); // Default to 30 days ago
        }
        const startISO = start.toISOString();
        const endISO = end.toISOString();
        console.log('🔍 Querying students...');
        // Fetch all students
        const { data: students, error: studentsError } = await admin.from('students').select('*').limit(1000);
        if (studentsError) {
            console.error('❌ Error fetching students:', studentsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: `Failed to fetch students: ${studentsError.message}`,
                data: null
            }, {
                status: 200
            });
        }
        console.log(`✅ Found ${students?.length || 0} students`);
        // Filter students by grade/section if specified
        let filteredStudents = students || [];
        if (gradeLevel && gradeLevel !== 'all') {
            filteredStudents = filteredStudents.filter((s)=>(s.grade_level || '').toString().toLowerCase() === gradeLevel.toLowerCase());
        }
        if (section && section !== 'all') {
            filteredStudents = filteredStudents.filter((s)=>(s.section || '').toString().toLowerCase() === section.toLowerCase());
        }
        console.log('🔍 Querying attendance records from', startISO, 'to', endISO);
        // Fetch attendance records
        const { data: allAttendanceRecords, error: attendanceError } = await admin.from('attendance_records').select('*').gte('scan_time', startISO).lte('scan_time', endISO).order('scan_time', {
            ascending: true
        });
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
        console.log(`✅ Found ${allAttendanceRecords?.length || 0} attendance records`);
        // Build student map for quick lookup
        const studentMap = {};
        if (students) {
            students.forEach((student)=>{
                const studentIdStr = (student.student_id || student.student_number || student.id || '').toString().trim();
                if (studentIdStr) {
                    studentMap[studentIdStr] = {
                        ...student,
                        fullName: `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''}`.trim() || student.name || 'Unknown'
                    };
                }
            });
        }
        // Filter attendance records to only include students (not teachers)
        const studentAttendanceRecords = (allAttendanceRecords || []).filter((record)=>{
            const recordId = (record.student_id || '').toString().trim();
            const student = studentMap[recordId];
            return student !== undefined;
        });
        // Filter by specific student if requested
        let finalRecords = studentAttendanceRecords;
        if (studentId && studentId !== 'all') {
            finalRecords = studentAttendanceRecords.filter((record)=>{
                const recordId = (record.student_id || '').toString().trim();
                return recordId === studentId.toString().trim();
            });
        }
        // Group attendance by student
        const studentStats = {};
        // Process each attendance record
        finalRecords.forEach((record)=>{
            const recordId = (record.student_id || '').toString().trim();
            const student = studentMap[recordId];
            if (!student) return;
            const studentKey = student.student_id || student.student_number || recordId;
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
                    dailyAttendance: {}
                };
            }
            studentStats[studentKey].records.push(record);
            // Determine status
            const scanDate = new Date(record.scan_time).toISOString().split('T')[0] // YYYY-MM-DD
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
        // Get unique grade levels and sections for filters
        const gradeLevels = [
            ...new Set((students || []).map((s)=>s.grade_level || s.gradeLevel).filter(Boolean))
        ];
        const sections = [
            ...new Set((students || []).map((s)=>s.section).filter(Boolean))
        ];
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
                    start: startISO,
                    end: endISO
                },
                filters: {
                    gradeLevels: gradeLevels.sort(),
                    sections: sections.sort()
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

//# sourceMappingURL=%5Broot-of-the-server%5D__919e5f63._.js.map