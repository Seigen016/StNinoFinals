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
"[project]/app/api/admin/teacher-attendance/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') // Optional: filter by start date
        ;
        const endDateParam = searchParams.get('endDate') // Optional: filter by end date
        ;
        const teacherId = searchParams.get('teacherId') // Optional: filter by specific teacher
        ;
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        // Calculate date range (default: last 30 days) - Manila timezone
        const startDateStr = startDate || (()=>{
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString().split('T')[0];
        })();
        const endDateStr = endDateParam || new Date().toISOString().split('T')[0];
        // Convert Manila local date to UTC range
        const startISO = `${startDateStr}T00:00:00.000Z`;
        const endISO = `${endDateStr}T23:59:59.999Z`;
        // Fetch all teachers
        const { data: teachers, error: teachersError } = await admin.from('users').eq('role', 'teacher').select('*').limit(1000);
        if (teachersError) {
            console.error('Error fetching teachers:', teachersError);
        }
        // Fetch attendance records for teachers
        // Teachers are identified by checking if user_id matches a teacher's UUID
        const { data: allAttendanceRecords, error: attendanceError } = await admin.from('attendance_records').select('*').gte('scan_time', startISO).lte('scan_time', endISO).order('scan_time', {
            ascending: true
        });
        if (attendanceError) {
            console.error('Error fetching attendance records:', attendanceError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: attendanceError.message,
                data: null
            }, {
                status: 200
            });
        }
        // Build teacher map for quick lookup by ID, email, and RFID
        const teacherMap = {};
        const teacherRfidMap = {} // Map RFID to teacher
        ;
        if (teachers) {
            teachers.forEach((teacher)=>{
                const teacherIdStr = (teacher.employee_number || teacher.id || '').toString().trim();
                const teacherEmail = (teacher.email || '').toString().trim().toLowerCase();
                const teacherName = `${teacher.first_name || ''} ${teacher.middle_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown';
                // Map by teacher ID or UUID
                const teacherUuid = (teacher.id || '').toString().trim();
                if (teacherIdStr) {
                    teacherMap[teacherIdStr] = {
                        ...teacher,
                        fullName: teacherName
                    };
                }
                if (teacherUuid) {
                    teacherMap[teacherUuid] = teacherMap[teacherIdStr] || {
                        ...teacher,
                        fullName: teacherName
                    };
                }
                // Map by email
                if (teacherEmail) {
                    teacherMap[teacherEmail] = {
                        ...teacher,
                        fullName: teacherName
                    };
                }
                // Map by RFID card (normalize: uppercase, remove spaces)
                const rfidCard = (teacher.rfid || '').toString().trim().toUpperCase().replace(/\s+/g, '');
                if (rfidCard) {
                    teacherRfidMap[rfidCard] = {
                        ...teacher,
                        fullName: teacherName
                    };
                    // Also add to main map for quick lookup
                    teacherMap[rfidCard] = {
                        ...teacher,
                        fullName: teacherName
                    };
                }
            });
        }
        console.log(`📊 Found ${teachers?.length || 0} teachers`);
        console.log(`🔑 Teacher RFID map has ${Object.keys(teacherRfidMap).length} entries:`, Object.keys(teacherRfidMap));
        // Filter attendance records to only include teachers
        // Check both user_id match AND RFID card match
        const teacherAttendanceRecords = (allAttendanceRecords || []).filter((record)=>{
            const recordId = (record.user_id || '').toString().trim();
            const recordRfid = (record.rfid_card || record.rfidCard || record.rfid_tag || record.rfidTag || '').toString().trim().toUpperCase().replace(/\s+/g, '');
            // Check if user_id matches a teacher
            if (teacherMap[recordId] !== undefined) {
                return true;
            }
            // Check if RFID card matches a teacher
            if (recordRfid && teacherRfidMap[recordRfid] !== undefined) {
                return true;
            }
            return false;
        });
        console.log(`✅ Found ${teacherAttendanceRecords.length} teacher attendance records out of ${allAttendanceRecords?.length || 0} total records`);
        // Group attendance by teacher
        const teacherStats = {};
        // Process each attendance record
        teacherAttendanceRecords.forEach((record)=>{
            const recordId = (record.user_id || '').toString().trim();
            const recordRfid = (record.rfid_card || record.rfidCard || record.rfid_tag || record.rfidTag || '').toString().trim().toUpperCase().replace(/\s+/g, '');
            // Try to find teacher by user_id first, then by RFID
            let teacher = teacherMap[recordId];
            if (!teacher && recordRfid) {
                teacher = teacherRfidMap[recordRfid] || teacherMap[recordRfid];
            }
            if (!teacher) {
                console.log(`⚠️ Could not find teacher for record: id=${recordId}, rfid=${recordRfid}`);
                return;
            }
            const teacherKey = teacher.employee_number || teacher.id || recordId;
            if (!teacherStats[teacherKey]) {
                teacherStats[teacherKey] = {
                    teacher,
                    records: [],
                    totalDays: 0,
                    present: 0,
                    absent: 0,
                    late: 0,
                    percentage: 0,
                    dailyAttendance: {}
                };
            }
            teacherStats[teacherKey].records.push(record);
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
            const status = record.status || 'Present';
            const scanType = record.scan_type || 'timein';
            // Count attendance
            if (status === 'Present' || scanType === 'timein') {
                teacherStats[teacherKey].present++;
                teacherStats[teacherKey].dailyAttendance[scanDate] = 'PR'; // Present
            } else if (status === 'Absent') {
                teacherStats[teacherKey].absent++;
                teacherStats[teacherKey].dailyAttendance[scanDate] = 'AC'; // Absent - Coded
            } else if (status === 'Late') {
                teacherStats[teacherKey].late++;
                teacherStats[teacherKey].dailyAttendance[scanDate] = 'LA'; // Late
            }
            teacherStats[teacherKey].totalDays++;
        });
        // Calculate percentages and format data
        const teacherList = Object.values(teacherStats).map((stats)=>{
            const total = stats.totalDays || 1 // Avoid division by zero
            ;
            stats.percentage = Math.round(stats.present / total * 100);
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
                records: stats.records
            };
        });
        // Calculate general statistics
        const totalTeachers = teacherList.length || 1;
        const totalPresent = teacherList.reduce((sum, t)=>sum + t.present, 0);
        const totalAbsent = teacherList.reduce((sum, t)=>sum + t.absent, 0);
        const totalDays = teacherList.reduce((sum, t)=>sum + t.totalDays, 0);
        const overallPresentPercentage = totalDays > 0 ? Math.round(totalPresent / totalDays * 100) : 0;
        const overallAbsentPercentage = totalDays > 0 ? Math.round(totalAbsent / totalDays * 100) : 0;
        // Filter by specific teacher if requested
        let selectedTeacherData = null;
        if (teacherId) {
            selectedTeacherData = teacherList.find((t)=>(t.teacherId || '').toString() === teacherId.toString());
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                general: {
                    totalTeachers,
                    totalPresent,
                    totalAbsent,
                    totalDays,
                    presentPercentage: overallPresentPercentage,
                    absentPercentage: overallAbsentPercentage
                },
                teachers: teacherList,
                selectedTeacher: selectedTeacherData,
                dateRange: {
                    start: startDateStr,
                    end: endDateStr
                }
            }
        }, {
            status: 200
        });
    } catch (error) {
        console.error('Error in teacher attendance API:', error);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__fb978d88._.js.map