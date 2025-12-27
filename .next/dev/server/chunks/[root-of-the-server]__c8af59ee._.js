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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
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
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
}),
"[project]/app/api/teacher/grades/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseAdmin.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const { searchParams } = new URL(request.url);
        const teacherId = searchParams.get('teacherId');
        const section = searchParams.get('section');
        const quarter = searchParams.get('quarter');
        const subject = searchParams.get('subject');
        if (!teacherId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Teacher ID is required'
            }, {
                status: 400
            });
        }
        // Get teacher's classes
        let classesQuery = admin.from('classes').select('id, class_name, section, grade_level').eq('teacher_id', teacherId).eq('is_active', true);
        if (section) {
            classesQuery = classesQuery.eq('section', section);
        }
        const { data: classes, error: classesError } = await classesQuery;
        if (classesError) {
            console.error('Error fetching classes:', classesError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Failed to fetch classes'
            }, {
                status: 500
            });
        }
        if (!classes || classes.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: []
            });
        }
        // Get students in these classes
        const classIds = classes.map((c)=>c.id);
        const { data: enrollments, error: enrollmentsError } = await admin.from('class_enrollments').select('student_id, class_id').in('class_id', classIds).eq('status', 'active');
        if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Failed to fetch enrollments'
            }, {
                status: 500
            });
        }
        if (!enrollments || enrollments.length === 0) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: []
            });
        }
        const studentIds = [
            ...new Set(enrollments.map((e)=>e.student_id))
        ];
        const { data: students, error: studentsError } = await admin.from('users').select('id, first_name, last_name, student_number').in('id', studentIds).eq('role', 'student');
        if (studentsError) {
            console.error('Error fetching students:', studentsError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Failed to fetch students'
            }, {
                status: 500
            });
        }
        // Get existing grades for these students
        let gradesQuery = admin.from('grades').select('*').in('student_id', studentIds);
        if (subject) {
            gradesQuery = gradesQuery.eq('subject', subject);
        }
        const { data: existingGrades, error: gradesError } = await gradesQuery;
        if (gradesError) {
            console.error('Error fetching grades:', gradesError);
        // Continue without grades rather than failing
        }
        // Format data for grades management
        const gradesData = students?.map((student)=>{
            const studentGrades = existingGrades?.filter((g)=>g.student_id === student.id) || [];
            return {
                id: student.id,
                name: `${student.first_name} ${student.last_name}`,
                studentNumber: student.student_number,
                writtenWork: Array(5).fill(''),
                performanceTasks: Array(5).fill(''),
                quarterlyAssessment: '',
                existingGrades: studentGrades // Include for reference
            };
        }) || [];
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: gradesData
        });
    } catch (error) {
        console.error('Teacher grades API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const admin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        const body = await request.json();
        const { teacherId, subject, section, quarter, grades } = body;
        if (!teacherId || !subject || !grades) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Missing required fields'
            }, {
                status: 400
            });
        }
        // Save grades to database
        const gradeRecords = [];
        for (const studentGrade of grades){
            // Calculate final grade based on the weighted components
            const writtenWorkScores = studentGrade.writtenWork.map((score)=>parseFloat(score) || 0).filter((score)=>score > 0);
            const writtenWorkAvg = writtenWorkScores.length > 0 ? writtenWorkScores.reduce((a, b)=>a + b, 0) / writtenWorkScores.length : 0;
            const performanceScores = studentGrade.performanceTasks.map((score)=>parseFloat(score) || 0).filter((score)=>score > 0);
            const performanceAvg = performanceScores.length > 0 ? performanceScores.reduce((a, b)=>a + b, 0) / performanceScores.length : 0;
            const quarterlyScore = parseFloat(studentGrade.quarterlyAssessment) || 0;
            // Use the same weights as the UI
            const weights = getGradingWeights(subject);
            const finalGrade = writtenWorkAvg * weights.writtenWork / 100 + performanceAvg * weights.performanceTasks / 100 + quarterlyScore * weights.quarterlyAssessment / 100;
            if (finalGrade > 0) {
                gradeRecords.push({
                    student_id: studentGrade.id,
                    subject: subject,
                    grade: finalGrade
                });
            }
        }
        if (gradeRecords.length > 0) {
            const { error: insertError } = await admin.from('grades').upsert(gradeRecords, {
                onConflict: 'student_id,subject'
            });
            if (insertError) {
                console.error('Error saving grades:', insertError);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: false,
                    error: 'Failed to save grades'
                }, {
                    status: 500
                });
            }
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            message: 'Grades saved successfully'
        });
    } catch (error) {
        console.error('Save grades API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
// Helper function to get grading weights
function getGradingWeights(subject) {
    const subjectLower = subject?.toLowerCase() || '';
    if (subjectLower.includes('filipino') || subjectLower.includes('english') || subjectLower.includes('araling panlipunan') || subjectLower.includes('ap') || subjectLower.includes('esp') || subjectLower.includes('edukasyon sa pagpapakatao') || subjectLower.includes('mother tongue') || subjectLower.includes('mt')) {
        return {
            writtenWork: 30,
            performanceTasks: 50,
            quarterlyAssessment: 20
        };
    }
    if (subjectLower.includes('science') || subjectLower.includes('mathematics') || subjectLower.includes('math')) {
        return {
            writtenWork: 40,
            performanceTasks: 40,
            quarterlyAssessment: 20
        };
    }
    if (subjectLower.includes('mapeh') || subjectLower.includes('music') || subjectLower.includes('arts') || subjectLower.includes('physical education') || subjectLower.includes('health') || subjectLower.includes('epp') || subjectLower.includes('tle') || subjectLower.includes('technology') || subjectLower.includes('livelihood') || subjectLower.includes('elective') || subjectLower.includes('writing')) {
        return {
            writtenWork: 20,
            performanceTasks: 60,
            quarterlyAssessment: 20
        };
    }
    return {
        writtenWork: 30,
        performanceTasks: 50,
        quarterlyAssessment: 20
    };
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c8af59ee._.js.map