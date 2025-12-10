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
"[project]/lib/notifications.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Simple TextBee notifier using fetch
// Requires the following environment variables:
// - TEXTBEE_API_KEY: API key for TextBee
// - TEXTBEE_API_URL: Base URL for TextBee API (e.g., https://api.textbee.com/v1)
// - TEXTBEE_SENDER_ID: Sender identifier or phone number assigned to your service
__turbopack_context__.s([
    "sendSms",
    ()=>sendSms
]);
async function sendSms(phone, message) {
    if (!phone) {
        console.warn('sendSms called without phone number');
        return false;
    }
    const apiKey = process.env.TEXTBEE_API_KEY;
    const apiUrl = process.env.TEXTBEE_API_URL || 'https://api.textbee.com/v1';
    const sender = process.env.TEXTBEE_SENDER_ID || process.env.TEXTBEE_SENDER || process.env.SMS_SENDER || null;
    if (!apiKey) {
        console.warn('TEXTBEE_API_KEY is not configured; skipping SMS send');
        return false;
    }
    try {
        const url = `${apiUrl.replace(/\/+$/, '')}/messages`;
        const payload = {
            to: phone,
            message: message
        };
        if (sender) payload.from = sender;
        // Use global fetch (available in Node 18+)
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const text = await res.text();
            console.error('TextBee API error:', res.status, text);
            return false;
        }
        try {
            const data = await res.json();
            console.log('TextBee sent msg, id:', data?.id || 'unknown');
        } catch (err) {
        // non-JSON response, still okay
        }
        return true;
    } catch (err) {
        console.error('Failed to send SMS using TextBee:', err?.message || err);
        return false;
    }
}
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
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/admin/attendance-live/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "OPTIONS",
    ()=>OPTIONS,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/notifications.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseAdmin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.8_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/next/server.js [app-route] (ecmascript)");
;
;
;
// Timeout mode tracker: stores expiration timestamp for timeout mode
// Format: Map<timestamp, expirationTime>
const timeoutModeExpiry = new Map();
// Clean up expired timeout modes (called on each request instead of setInterval)
// This avoids issues with setInterval in Next.js serverless functions
function cleanupExpiredTimeouts() {
    const now = Date.now();
    for (const [timestamp, expiry] of timeoutModeExpiry.entries()){
        if (now > expiry) {
            timeoutModeExpiry.delete(timestamp);
        }
    }
}
// Check if timeout mode is currently active
function isTimeoutModeActive() {
    cleanupExpiredTimeouts(); // Clean up before checking
    const now = Date.now();
    for (const expiry of timeoutModeExpiry.values()){
        if (now < expiry) {
            return true;
        }
    }
    return false;
}
async function OPTIONS(request) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
async function GET(request) {
    // Set default headers for all responses
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    // Wrap everything in try-catch to ensure we always return JSON
    try {
        // Debug: Log request info for localhost debugging
        const url = new URL(request.url);
        console.log("=== GET REQUEST DEBUG ===");
        console.log("Request URL:", url.toString());
        console.log("Origin:", request.headers.get('origin') || 'N/A');
        console.log("Host:", request.headers.get('host') || 'N/A');
        console.log("Environment:", ("TURBOPACK compile-time value", "development"));
        console.log("=========================");
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const since = searchParams.get('since') // Optional: get records since this timestamp
        ;
        // Use admin client to avoid RLS UUID/TEXT comparison errors
        let supabaseClient;
        try {
            supabaseClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        } catch (clientError) {
            console.error('Failed to get Supabase admin client:', clientError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                records: [],
                warning: 'Database client initialization failed',
                error: ("TURBOPACK compile-time truthy", 1) ? clientError?.message : "TURBOPACK unreachable"
            }, {
                status: 200,
                headers: defaultHeaders
            });
        }
        if (!supabaseClient) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                records: [],
                warning: 'Database client not available'
            }, {
                status: 200,
                headers: defaultHeaders
            });
        }
        // Fetch recent attendance records
        // Don't use join to avoid foreign key issues - fetch students separately
        let data = [];
        let error = null;
        try {
            console.log('Attempting to fetch attendance records...');
            console.log('Limit:', limit);
            console.log('Since:', since);
            // Try multiple methods to fetch records, handling PGRST200 errors gracefully
            let querySuccess = false;
            // Method 1: Try RPC function (bypasses PostgREST completely)
            try {
                console.log('Method 1: Trying RPC function...');
                const { data: rpcData, error: rpcError } = await supabaseClient.rpc('get_attendance_records', {
                    record_limit: limit,
                    since_time: since || null
                });
                if (!rpcError && rpcData) {
                    data = rpcData;
                    error = null;
                    querySuccess = true;
                    console.log('✓ RPC query successful, records:', (data || []).length);
                } else {
                    console.log('✗ RPC failed:', rpcError?.message || 'RPC function not found');
                }
            } catch (rpcException) {
                console.log('✗ RPC exception:', rpcException.message);
            }
            // Method 2: If RPC failed, try direct query with explicit columns (no joins)
            if (!querySuccess) {
                try {
                    console.log('Method 2: Trying direct query with explicit columns...');
                    let directQuery = supabaseClient.from('attendance_records').select('id, scan_time, scan_type, student_id, rfid_card, rfid_tag, status, time_in, time_out, created_at, device_id').order('scan_time', {
                        ascending: false
                    }).limit(limit);
                    if (since) {
                        directQuery = directQuery.gt('scan_time', since);
                    }
                    const directResult = await directQuery;
                    if (!directResult.error && directResult.data) {
                        data = directResult.data || [];
                        error = null;
                        querySuccess = true;
                        console.log('✓ Direct query (minimal) successful, records:', (data || []).length);
                    } else {
                        // Check if it's a PGRST200 error - if so, just return empty
                        if (directResult.error?.code === 'PGRST200' || directResult.error?.message?.includes('relationship') || directResult.error?.message?.includes('Could not find a relationship')) {
                            console.log('⚠ PostgREST relationship error - returning empty records (this is OK)');
                            data = [];
                            error = null;
                            querySuccess = true; // Treat as success with empty data
                        } else {
                            throw directResult.error;
                        }
                    }
                } catch (directError) {
                    // If it's a relationship error, return empty records
                    if (directError.code === 'PGRST200' || directError.message?.includes('relationship') || directError.message?.includes('Could not find a relationship')) {
                        console.log('⚠ PostgREST relationship error in catch - returning empty records');
                        data = [];
                        error = null;
                        querySuccess = true;
                    } else {
                        console.error('✗ Direct query failed:', directError);
                        // Return empty records anyway
                        data = [];
                        error = null;
                        querySuccess = true;
                    }
                }
            }
            // If we still don't have success, return empty records
            if (!querySuccess) {
                console.log('⚠ All query methods failed - returning empty records');
                data = [];
                error = null;
            }
        } catch (queryError) {
            console.error('Query execution exception:', queryError);
            console.error('Exception name:', queryError.name);
            console.error('Exception message:', queryError.message);
            console.error('Exception stack:', queryError.stack);
            error = queryError;
        }
        if (error) {
            console.error('Database error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', error.details);
            console.error('Error hint:', error.hint);
            // Return empty records instead of failing completely
            // This allows the frontend to still work even if there's a database issue
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                records: [],
                warning: 'Unable to fetch attendance records from database',
                error: ("TURBOPACK compile-time truthy", 1) ? error.message : "TURBOPACK unreachable",
                details: ("TURBOPACK compile-time truthy", 1) ? {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                } : "TURBOPACK unreachable"
            }, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        // Fetch student and teacher information for all records
        const studentIds = [
            ...new Set((data || []).map((r)=>r.student_id).filter(Boolean))
        ];
        const studentMap = {};
        const teacherMap = {};
        if (studentIds.length > 0) {
            try {
                // Fetch all students
                const { data: allStudents, error: studentsError } = await supabaseClient.from('students').select('*').limit(1000);
                if (!studentsError && allStudents) {
                    allStudents.forEach((student)=>{
                        const studentIdStr = (student.student_id || '').toString().trim();
                        const studentNumberStr = (student.student_number || '').toString().trim();
                        const studentIdUuid = (student.id || '').toString().trim();
                        if (studentIdStr) studentMap[studentIdStr] = student;
                        if (studentNumberStr) studentMap[studentNumberStr] = student;
                        if (studentIdUuid) studentMap[studentIdUuid] = student;
                    });
                }
                // Also fetch teachers
                const { data: allTeachers, error: teachersError } = await supabaseClient.from('teachers').select('*').limit(1000);
                if (!teachersError && allTeachers) {
                    allTeachers.forEach((teacher)=>{
                        const teacherIdStr = (teacher.teacher_id || teacher.id || '').toString().trim();
                        const teacherEmail = (teacher.email || '').toString().trim().toLowerCase();
                        if (teacherIdStr) teacherMap[teacherIdStr] = teacher;
                        if (teacherEmail) teacherMap[teacherEmail] = teacher;
                    });
                }
            } catch (fetchError) {
                console.error('Error fetching students/teachers:', fetchError);
            // Continue without info
            }
        }
        // If we have no data, return empty array
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('📭 No attendance records found in database');
            console.log('💡 This could mean:');
            console.log('   1. No scans have been recorded yet');
            console.log('   2. Database table is empty');
            console.log('   3. ESP32 scans are not being saved (check POST endpoint logs)');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                records: [],
                message: 'No attendance records found. Scans will appear here once recorded.'
            }, {
                status: 200,
                headers: defaultHeaders
            });
        }
        console.log(`✅ Found ${(data || []).length} attendance records`);
        if ((data || []).length > 0) {
            console.log('📅 Sample record times:', data.slice(0, 3).map((r)=>({
                    scan_time: r.scan_time,
                    created_at: r.created_at,
                    id: r.id
                })));
        }
        // Format the response
        const formattedRecords = (data || []).map((record)=>{
            // Determine scan type from database fields
            let scanType = null;
            if (record.time_in && record.scan_time === record.time_in) {
                scanType = 'timein';
            } else if (record.time_out && record.scan_time === record.time_out) {
                scanType = 'timeout';
            } else if (record.scan_type) {
                scanType = record.scan_type.toLowerCase() === 'time_in' || record.scan_type.toLowerCase() === 'timein' ? 'timein' : record.scan_type.toLowerCase() === 'time_out' || record.scan_type.toLowerCase() === 'timeout' ? 'timeout' : null;
            } else if (record.type) {
                scanType = record.type.toLowerCase() === 'time_in' || record.type.toLowerCase() === 'timein' ? 'timein' : record.type.toLowerCase() === 'time_out' || record.type.toLowerCase() === 'timeout' ? 'timeout' : null;
            }
            // Get student or teacher info from maps
            const student = studentMap[record.student_id] || null;
            const teacher = teacherMap[record.student_id] || null;
            // Determine if this is a teacher or student
            const isTeacher = !!teacher || student && (student.role === 'teacher' || student.user_type === 'teacher' || student.teacher_id || !student.student_id && !student.student_number);
            const person = teacher || student;
            return {
                id: record.id,
                studentId: record.student_id,
                studentName: person ? `${person.first_name || person.firstName || ''} ${person.last_name || person.lastName || ''}`.trim() || person.name || 'Unknown' : 'Unknown',
                gradeLevel: isTeacher ? null : person?.grade_level || person?.gradeLevel || 'N/A',
                section: isTeacher ? null : person?.section || 'N/A',
                scanTime: record.scan_time || record.created_at,
                status: record.status || 'Present',
                rfidCard: record.rfid_card || 'N/A',
                studentPhoto: person?.photo_url || person?.profile_picture || person?.picture || null,
                scanType: scanType,
                timeIn: record.time_in || null,
                timeOut: record.time_out || null,
                isTeacher: isTeacher || false,
                subject: isTeacher ? person?.subject || person?.subjects || person?.subject_taught || 'N/A' : null,
                role: person?.role || null
            };
        });
        console.log(`📤 Returning ${(formattedRecords || []).length} formatted records to frontend`);
        if ((formattedRecords || []).length > 0) {
            console.log('📅 First record scan time:', formattedRecords[0]?.scanTime);
            console.log('📅 Last record scan time:', formattedRecords[formattedRecords.length - 1]?.scanTime);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            records: formattedRecords,
            count: formattedRecords.length
        }, {
            status: 200,
            headers: defaultHeaders
        });
    } catch (error) {
        console.error('Attendance records API error:', error);
        console.error('Error stack:', error?.stack);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        // Always return JSON, never let Next.js return HTML error page
        try {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                records: [],
                warning: 'Unable to fetch attendance records',
                error: error?.message || 'Internal server error',
                details: ("TURBOPACK compile-time truthy", 1) ? {
                    stack: error?.stack,
                    name: error?.name,
                    message: error?.message
                } : "TURBOPACK unreachable"
            }, {
                status: 200,
                headers: defaultHeaders
            });
        } catch (jsonError) {
            // Even if JSON creation fails, return a simple text response as JSON
            console.error('Failed to create JSON response:', jsonError);
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](JSON.stringify({
                success: true,
                records: [],
                warning: 'Service temporarily unavailable'
            }), {
                status: 200,
                headers: defaultHeaders
            });
        }
    }
}
async function POST(request) {
    // Set default headers for all responses
    const postHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    // Wrap everything in try-catch to ensure we always return JSON (for Vercel)
    try {
        // Debug: Log environment variables
        console.log("=== POST: ENVIRONMENT VARIABLES DEBUG ===");
        console.log("URL:", ("TURBOPACK compile-time truthy", 1) ? "SET" : "TURBOPACK unreachable");
        console.log("URL Value:", ("TURBOPACK compile-time value", "https://ulntyefamkxkbynrugop.supabase.co"));
        console.log("ANON:", ("TURBOPACK compile-time truthy", 1) ? "SET" : "TURBOPACK unreachable");
        console.log("ANON Key (first 20 chars):", ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbnR5ZWZhbWt4a2J5bnJ1Z29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MjgwNDEsImV4cCI6MjA3NjIwNDA0MX0.TnL8jfBVJD8Z0N5rFl_KFhAku8zxiy2fFvztBDYHaWk")?.substring(0, 20) || "MISSING");
        console.log("SERVICE:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING");
        console.log("SERVICE Key (first 20 chars):", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || "MISSING");
        console.log("==========================================");
        let scanData = null;
        try {
            scanData = await request.json();
        } catch (jsonError) {
            console.error('Error parsing request JSON:', jsonError);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Invalid JSON in request body',
                message: 'Please ensure the request contains valid JSON'
            }, {
                status: 200,
                headers: postHeaders
            });
        }
        if (!scanData) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Request body is required',
                message: 'Please include RFID card data in the request'
            }, {
                status: 200,
                headers: postHeaders
            });
        }
        // Validate required fields
        if (!scanData.studentId && !scanData.rfidCard) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Student ID or RFID Card is required',
                records: []
            }, {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }
        // Use admin client for inserts to bypass RLS policies
        // This avoids UUID/TEXT comparison errors in RLS policies
        const supabaseClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseAdmin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSupabaseAdmin"])();
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            if ("TURBOPACK compile-time truthy", 1) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: true,
                    message: 'Scan recorded (dev mode - not saved to database)'
                });
            }
            //TURBOPACK unreachable
            ;
        }
        // Get current date (start of day) for checking existing records
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.toISOString();
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        const todayEndISO = todayEnd.toISOString();
        // Find student by RFID card or student ID
        let studentId = scanData.studentId;
        if (!studentId && scanData.rfidCard) {
            // Normalize RFID card - remove spaces, convert to uppercase, remove leading zeros
            let rfidNormalized = scanData.rfidCard.toString().trim().toUpperCase().replace(/\s+/g, '');
            // Also create version without leading zeros for matching
            const rfidNoLeadingZeros = rfidNormalized.replace(/^0+/, '');
            console.log(`Searching for student with RFID: ${rfidNormalized} (also trying: ${rfidNoLeadingZeros})`);
            // Fetch all students and filter in memory to avoid column errors
            const { data: allStudents, error: fetchError } = await supabaseClient.from('students').select('*').limit(1000);
            if (fetchError) {
                console.error('Error fetching students:', fetchError);
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: false,
                    error: `Database error: ${fetchError.message}`,
                    searchedRfid: rfidNormalized,
                    records: []
                }, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }
            // FIRST check teachers table (prioritize teachers over students if same RFID)
            // This ensures teacher scans are recorded as teachers, not students
            console.log(`Checking teachers first for RFID: ${rfidNormalized}`);
            const { data: allTeachers, error: teachersError } = await supabaseClient.from('teachers').select('*').limit(1000);
            let matchedTeacher = null;
            if (!teachersError && allTeachers) {
                // Filter teachers in memory by RFID (check all possible column names)
                const teachers = (allTeachers || []).filter((teacher)=>{
                    const rfid1 = (teacher.rfid_card || '').toString().trim().toUpperCase();
                    const rfid2 = (teacher.rfidCard || '').toString().trim().toUpperCase();
                    const rfid3 = (teacher.rfid_tag || '').toString().trim().toUpperCase();
                    const rfid4 = (teacher.rfidTag || '').toString().trim().toUpperCase();
                    return rfid1 === rfidNormalized || rfid1 === rfidNoLeadingZeros || rfid2 === rfidNormalized || rfid2 === rfidNoLeadingZeros || rfid3 === rfidNormalized || rfid3 === rfidNoLeadingZeros || rfid4 === rfidNormalized || rfid4 === rfidNoLeadingZeros || rfid1.includes(rfidNormalized) || rfid2.includes(rfidNormalized) || rfid3.includes(rfidNormalized) || rfid4.includes(rfidNormalized);
                });
                if (teachers && teachers.length > 0) {
                    matchedTeacher = teachers[0];
                    console.log(`✅ Found teacher FIRST: ${matchedTeacher.first_name || matchedTeacher.firstName || 'Unknown'} ${matchedTeacher.last_name || matchedTeacher.lastName || ''}`);
                    // Use teacher_id or id (TEXT) for attendance_records.student_id
                    studentId = matchedTeacher.teacher_id || matchedTeacher.id?.toString() || matchedTeacher.email;
                }
            }
            // If no teacher found, check students table
            if (!matchedTeacher) {
                console.log(`No teacher found, checking students for RFID: ${rfidNormalized}`);
                // Filter students in memory by RFID (check all possible column names)
                // Priority: rfid_card (what ESP32 expects) > rfidCard > rfid_tag > rfidTag
                const students = (allStudents || []).filter((student)=>{
                    const rfid1 = (student.rfid_card || '').toString().trim().toUpperCase() // Primary - ESP32 expects this
                    ;
                    const rfid2 = (student.rfidCard || '').toString().trim().toUpperCase();
                    const rfid3 = (student.rfid_tag || '').toString().trim().toUpperCase();
                    const rfid4 = (student.rfidTag || '').toString().trim().toUpperCase();
                    // Check exact matches first, then partial
                    return rfid1 === rfidNormalized || rfid1 === rfidNoLeadingZeros || rfid2 === rfidNormalized || rfid2 === rfidNoLeadingZeros || rfid3 === rfidNormalized || rfid3 === rfidNoLeadingZeros || rfid4 === rfidNormalized || rfid4 === rfidNoLeadingZeros || rfid1.includes(rfidNormalized) || rfid2.includes(rfidNormalized) || rfid3.includes(rfidNormalized) || rfid4.includes(rfidNormalized);
                });
                if (!students || students.length === 0) {
                    // Neither student nor teacher found
                    console.log(`❌ No student or teacher found with RFID: ${rfidNormalized}`);
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: false,
                        error: `No student or teacher found for RFID: ${rfidNormalized}. Please assign this RFID card in the admin panel.`,
                        searchedRfid: rfidNormalized,
                        message: `RFID ${rfidNormalized} not assigned to any student or teacher`
                    }, {
                        status: 404,
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        }
                    });
                } else {
                    // Found a student
                    const matchedStudent = students[0];
                    console.log(`Found student: ${matchedStudent.first_name || matchedStudent.firstName || 'Unknown'} ${matchedStudent.last_name || matchedStudent.lastName || ''}`);
                    // Use student_number or student_id (TEXT) - NOT the UUID id
                    // attendance_records.student_id is TEXT type, so we store TEXT values
                    studentId = matchedStudent.student_number || matchedStudent.student_id || matchedStudent.studentId || matchedStudent.id?.toString();
                }
            }
        }
        // Check if student has already scanned in today
        // student_id is now TEXT type, so we can query directly
        // But we need to cast to text to avoid UUID comparison errors
        let todayRecords = [];
        let checkError = null;
        // Fetch all records for today, then filter in memory to avoid type mismatch
        const { data: allTodayRecords, error: fetchError } = await supabaseClient.from('attendance_records').select('id, scan_type, scan_time, time_in, time_out, student_id').gte('scan_time', todayStart).lte('scan_time', todayEndISO).order('scan_time', {
            ascending: true
        });
        if (fetchError) {
            checkError = fetchError;
            console.error('Error fetching today records:', fetchError);
        } else if (allTodayRecords) {
            // Filter in memory by student_id (text match) to avoid UUID/TEXT comparison issues
            todayRecords = allTodayRecords.filter((r)=>{
                const rId = (r.student_id || '').toString().trim();
                const sId = (studentId || '').toString().trim();
                return rId === sId || rId === studentId || sId === r.student_id;
            });
        }
        if (checkError) {
            console.error('Error checking existing records:', checkError);
        }
        // Check if student has already timed in and/or timed out today
        const hasTimeIn = todayRecords.some((r)=>r.scan_type === 'timein' || r.scan_type === 'time_in' || r.time_in);
        const hasTimeOut = todayRecords.some((r)=>r.scan_type === 'timeout' || r.scan_type === 'time_out' || r.time_out);
        // If student has already timed in AND timed out today, reject the scan
        if (hasTimeIn && hasTimeOut) {
            console.log('⚠️ Student has already timed in and out today');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                message: 'You have completed your attendance for today.',
                error: 'Already completed attendance for today',
                hasTimeIn: true,
                hasTimeOut: true
            }, {
                status: 200,
                headers: postHeaders
            });
        }
        // Determine scan type
        const currentTime = new Date().toISOString();
        let scanType = 'timein';
        let timeIn = null;
        let timeOut = null;
        // Check if timeout mode is active (button was clicked in display page)
        const timeoutModeActive = isTimeoutModeActive();
        if (hasTimeIn && !hasTimeOut) {
            // Student has timed in but not timed out - force timeout
            scanType = 'timeout';
            timeOut = currentTime;
            // Find the most recent time in record for this student today
            const timeInRecord = todayRecords.filter((r)=>r.scan_type === 'timein' || r.scan_type === 'time_in').sort((a, b)=>new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime())[0];
            if (timeInRecord) {
                timeIn = timeInRecord.time_in || timeInRecord.scan_time;
            }
            console.log('⏰ Student already timed in today - forcing timeout');
        } else if (timeoutModeActive && !hasTimeIn) {
            // Timeout mode active but no time in yet - ignore timeout mode and record as time in
            scanType = 'timein';
            timeIn = currentTime;
            console.log('⚠️ Timeout mode active but no time in yet - recording as time in');
        } else if (timeoutModeActive && hasTimeIn) {
            // Timeout mode active and has time in - record as timeout
            scanType = 'timeout';
            timeOut = currentTime;
            const timeInRecord = todayRecords.filter((r)=>r.scan_type === 'timein' || r.scan_type === 'time_in').sort((a, b)=>new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime())[0];
            if (timeInRecord) {
                timeIn = timeInRecord.time_in || timeInRecord.scan_time;
            }
            console.log('⏰ Timeout mode active with existing time in - recording as timeout');
        } else {
            // Default: record as time in
            scanType = 'timein';
            timeIn = currentTime;
            console.log('✅ Recording as time in (default)');
        }
        // Insert the attendance record
        // Build insert object with all required fields
        const attendanceRecord = {
            student_id: studentId
        };
        // Add RFID fields - set both rfid_card and rfid_tag to avoid NOT NULL constraint errors
        const rfidValue = scanData.rfidCard || '';
        if (rfidValue) {
            attendanceRecord.rfid_card = rfidValue;
            attendanceRecord.rfid_tag = rfidValue; // Some schemas use rfid_tag instead
        } else {
            // If no RFID provided, set empty string to avoid NOT NULL constraint
            attendanceRecord.rfid_card = '';
            attendanceRecord.rfid_tag = '';
        }
        // Set device_id - if column is UUID type, we can't use text, so set to null
        // If column is TEXT type, we can use a device identifier
        // For now, don't set it to avoid UUID type errors
        // attendanceRecord.device_id = scanData.deviceId || null
        attendanceRecord.scan_time = currentTime;
        attendanceRecord.scan_type = scanType;
        attendanceRecord.time_in = timeIn;
        attendanceRecord.time_out = timeOut;
        attendanceRecord.status = scanType === 'timein' ? 'Present' : 'Present';
        attendanceRecord.created_at = currentTime;
        // Optional type field for compatibility
        attendanceRecord.type = scanType;
        // Insert the attendance record (without join to avoid foreign key issues)
        console.log('💾 Inserting attendance record:', {
            student_id: attendanceRecord.student_id,
            rfid_card: attendanceRecord.rfid_card,
            scan_type: attendanceRecord.scan_type,
            scan_time: attendanceRecord.scan_time
        });
        const { data: newRecord, error: insertError } = await supabaseClient.from('attendance_records').insert([
            attendanceRecord
        ]).select('*').single();
        if (insertError) {
            console.error('❌ Insert failed:', insertError);
            console.error('Database error:', insertError);
            // In development, return success even if table doesn't exist
            if ("TURBOPACK compile-time truthy", 1) {
                console.log('Scan data (dev mode):', {
                    studentId,
                    scanType,
                    timeIn,
                    timeOut
                });
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    success: true,
                    message: 'Scan recorded (dev mode - not saved to database)',
                    scanType,
                    timeIn,
                    timeOut
                }, {
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type'
                    }
                });
            }
            //TURBOPACK unreachable
            ;
        }
        // Fetch student or teacher information separately to avoid join issues
        // Fetch all students and filter in memory to avoid UUID/TEXT comparison errors
        let personInfo = null;
        let isTeacher = false;
        if (studentId) {
            // First, try to find in students table
            const { data: allStudents } = await supabaseClient.from('students').select('*').limit(1000);
            if (allStudents) {
                // Find matching student by comparing as strings
                const studentIdStr = (studentId || '').toString().trim();
                personInfo = allStudents.find((student)=>{
                    const sId = (student.student_id || '').toString().trim();
                    const sNum = (student.student_number || '').toString().trim();
                    const sUuid = (student.id || '').toString().trim();
                    return sId === studentIdStr || sNum === studentIdStr || sUuid === studentIdStr;
                }) || null;
            }
            // If not found in students, try teachers table
            if (!personInfo) {
                const { data: allTeachers } = await supabaseClient.from('teachers').select('*').limit(1000);
                if (allTeachers) {
                    const personIdStr = (studentId || '').toString().trim();
                    personInfo = allTeachers.find((teacher)=>{
                        const tId = (teacher.teacher_id || '').toString().trim();
                        const tUuid = (teacher.id || '').toString().trim();
                        const tEmail = (teacher.email || '').toString().trim().toLowerCase();
                        return tId === personIdStr || tUuid === personIdStr || tEmail === personIdStr;
                    }) || null;
                    if (personInfo) {
                        isTeacher = true;
                    }
                }
            }
        }
        // Format the response
        const formattedRecord = {
            id: newRecord.id,
            studentId: newRecord.student_id || studentId,
            studentName: personInfo ? `${personInfo.first_name || personInfo.firstName || ''} ${personInfo.last_name || personInfo.lastName || ''}`.trim() || personInfo.name || 'Unknown' : 'Unknown',
            gradeLevel: isTeacher ? null : personInfo?.grade_level || personInfo?.gradeLevel || 'N/A',
            section: isTeacher ? null : personInfo?.section || 'N/A',
            scanTime: newRecord.scan_time || newRecord.created_at,
            status: newRecord.status || 'Present',
            rfidCard: newRecord.rfid_card || scanData.rfidCard || 'N/A',
            studentPhoto: personInfo?.photo_url || personInfo?.profile_picture || personInfo?.picture || null,
            scanType: scanType,
            timeIn: newRecord.time_in || null,
            timeOut: newRecord.time_out || null,
            isTeacher: isTeacher,
            subject: isTeacher ? personInfo?.subject || personInfo?.subjects || personInfo?.subject_taught || 'N/A' : null
        };
        console.log('✅ Scan saved successfully!', {
            id: newRecord.id,
            student: formattedRecord.studentName,
            scanType: scanType,
            scanTime: formattedRecord.scanTime
        });
        // === SMS Notification: send to student's parent/guardian ===
        try {
            // Only notify for student scans (not teachers) and only on time-in
            if (!isTeacher && scanType === 'timein') {
                // Attempt to find parent phone number
                let parentPhone = null;
                // 1) Look up parent(s) from the `parents` table by student parent_id, parent_email, or parent_students linkage
                try {
                    const parentRecords = [];
                    // If the student record contains a parent_id, prefer that
                    const parentId = personInfo?.parent_id || personInfo?.parentId || null;
                    if (parentId) {
                        const { data: parentRecord, error: pErr } = await supabaseClient.from('parents').select('id, phone, mobile, phone_number, email').eq('id', parentId).limit(1).single();
                        if (!pErr && parentRecord) parentRecords.push(parentRecord);
                    }
                    // If parent not found but parent_email exists on student, check parents by email
                    const parentEmail = personInfo?.parent_email || personInfo?.parentEmail || null;
                    if (!parentRecords.length && parentEmail) {
                        const { data: parentRecord2, error: pErr2 } = await supabaseClient.from('parents').select('id, phone, mobile, phone_number, email').ilike('email', parentEmail).limit(1).single();
                        if (!pErr2 && parentRecord2) parentRecords.push(parentRecord2);
                    }
                    // If still not found, look up linkage table parent_students (if exists) for this student (match by student id / student_number / uuid)
                    if (!parentRecords.length && (personInfo?.student_id || personInfo?.student_number || personInfo?.id)) {
                        const sId = personInfo?.student_id || personInfo?.student_number || personInfo?.id;
                        try {
                            const { data: linkedParentIds } = await supabaseClient.from('parent_students').select('parent_id').eq('student_id', sId).limit(10);
                            if (linkedParentIds && linkedParentIds.length > 0) {
                                // fetch parents by those ids
                                const parentIds = linkedParentIds.map((r)=>r.parent_id).filter(Boolean);
                                if (parentIds.length > 0) {
                                    const { data: parentsFromLink } = await supabaseClient.from('parents').select('id, phone, mobile, phone_number, email').in('id', parentIds);
                                    if (parentsFromLink) parentRecords.push(...parentsFromLink);
                                }
                            }
                        } catch (linkError) {
                        // ignore if parent_students doesn't exist
                        }
                    }
                    // If we found any parent records, prefer the first parent's phone
                    if (parentRecords && parentRecords.length > 0) {
                        const p = parentRecords[0];
                        parentPhone = p?.phone || p?.mobile || p?.phone_number || null;
                    }
                } catch (parentQueryError) {
                    console.warn('Unable to query parents table for phone number:', parentQueryError);
                }
                // 2) If not found, try to derive from student record fields
                if (!parentPhone && personInfo) {
                    const possibleParentFields = [
                        'parent_phone',
                        'parentPhone',
                        'parent_contact',
                        'parentContact',
                        'parent_mobile',
                        'parentMobile',
                        'phone',
                        'emergency_contact',
                        'emergencyContact'
                    ];
                    for (const f of possibleParentFields){
                        const val = personInfo[f];
                        if (val) {
                            parentPhone = val;
                            break;
                        }
                    }
                }
                // Normalize phone if found and send SMS using TextBee (if configured)
                if (parentPhone) {
                    // Respect global toggle to disable SMS in development or if not desired
                    const smsEnabled = (process.env.SMS_ON_SCAN_ENABLED || 'false').toLowerCase();
                    if (smsEnabled !== 'true' && smsEnabled !== '1') {
                        console.log('SMS notifications are disabled (SMS_ON_SCAN_ENABLED is not set to true)');
                    } else {
                        // Basic normalization: ensure phone starts with + (assume local country code if not) - only light touch
                        let toPhone = parentPhone.toString().trim();
                        if (!toPhone.startsWith('+')) {
                            // Optionally, set default country code if provided in env
                            const defaultCountryCode = process.env.DEFAULT_PHONE_COUNTRY_CODE || '';
                            if (defaultCountryCode) {
                                toPhone = `${defaultCountryCode}${toPhone}`;
                            }
                        }
                        const smsTemplate = process.env.SMS_ON_SCAN_TEMPLATE || 'Dear parent, {studentName} ({gradeLevel} - {section}) was recorded present at {scanTime}. — Sto Niño Portal';
                        const message = smsTemplate.replace('{studentName}', formattedRecord.studentName).replace('{gradeLevel}', formattedRecord.gradeLevel || 'N/A').replace('{section}', formattedRecord.section || 'N/A').replace('{scanTime}', formattedRecord.scanTime || new Date().toISOString());
                        const smsSent = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$notifications$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sendSms"])(toPhone, message);
                        console.log('SMS notify result:', smsSent);
                    }
                } else {
                    console.log('No parent phone found for student, skipping SMS');
                }
            }
        } catch (smsError) {
            console.error('SMS notification error:', smsError);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            record: formattedRecord,
            message: `Time ${scanType === 'timein' ? 'In' : 'Out'} recorded successfully`
        }, {
            status: 200,
            headers: postHeaders
        });
    } catch (error) {
        // Catch any unhandled errors that might cause 500 HTML response (for Vercel)
        console.error('CRITICAL: Unhandled error in POST handler:', error);
        console.error('Error stack:', error?.stack);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        // Always return JSON, never HTML (works for both localhost and Vercel)
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: ("TURBOPACK compile-time truthy", 1) ? error?.message : "TURBOPACK unreachable",
            records: [],
            warning: 'Service error occurred'
        }, {
            status: 200,
            headers: postHeaders
        });
    }
}
async function PUT(request) {
    const putHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    try {
        const body = await request.json();
        const { action } = body;
        if (action === 'enable-timeout') {
            // Enable timeout mode for 5 seconds
            const now = Date.now();
            const expiry = now + 5000 // 5 seconds from now
            ;
            const timestamp = now;
            timeoutModeExpiry.set(timestamp, expiry);
            console.log('⏰ Timeout mode enabled for 5 seconds');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                message: 'Timeout mode enabled for 5 seconds',
                expiresAt: expiry
            }, {
                status: 200,
                headers: putHeaders
            });
        } else {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Invalid action'
            }, {
                status: 400,
                headers: putHeaders
            });
        }
    } catch (error) {
        console.error('Error in PUT handler:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || 'Internal server error'
        }, {
            status: 200,
            headers: putHeaders
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e017c31c._.js.map