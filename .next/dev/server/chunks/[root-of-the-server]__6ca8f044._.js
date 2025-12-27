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
"[project]/app/api/student/dashboard/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        const body = await request.json();
        const { studentId, email } = body;
        if (!studentId && !email) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Student ID or email is required'
            }, {
                status: 400
            });
        }
        // Dummy grades data for testing
        const dummyGrades = [
            {
                id: '1',
                subject: 'Contemporary Philippine Arts from the Regions',
                grade: '94',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '2',
                subject: 'Media and Information Literacy',
                grade: '94',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '3',
                subject: 'Physical Education and Health',
                grade: '97',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '4',
                subject: 'Filipino sa Piling Larang',
                grade: '95',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '5',
                subject: 'Entrepreneurship',
                grade: '95',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '6',
                subject: 'Inquiries, Investigations and Immersion',
                grade: '90',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '7',
                subject: 'General Physics 2',
                grade: '96',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '8',
                subject: 'General Chemistry 2',
                grade: '96',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '9',
                subject: 'Work Immersion',
                grade: '97',
                lastUpdated: new Date().toISOString()
            },
            {
                id: '10',
                subject: 'Practical Research 2',
                grade: '90',
                lastUpdated: new Date().toISOString()
            }
        ];
        // Dummy dashboard data
        const dashboardData = {
            stats: {
                gpa: 94.0,
                attendanceRate: 95.5,
                activeCourses: 10,
                pendingTasks: 2
            },
            assignments: [
                {
                    id: '1',
                    title: 'Research Paper',
                    subject: 'Practical Research 2',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                },
                {
                    id: '2',
                    title: 'Business Plan',
                    subject: 'Entrepreneurship',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                }
            ],
            courseProgress: [
                {
                    id: '1',
                    subject: 'Contemporary Philippine Arts from the Regions',
                    completion: 85,
                    instructor: 'Prof. Santos'
                },
                {
                    id: '2',
                    subject: 'Media and Information Literacy',
                    completion: 90,
                    instructor: 'Prof. Garcia'
                },
                {
                    id: '3',
                    subject: 'Physical Education and Health',
                    completion: 95,
                    instructor: 'Coach Rodriguez'
                }
            ],
            schedule: {
                today: [
                    {
                        id: '1',
                        subject: 'Mathematics',
                        time: '8:00 AM',
                        location: 'Room 201',
                        instructor: 'Prof. Rodriguez',
                        accent: 'blue'
                    },
                    {
                        id: '2',
                        subject: 'Science',
                        time: '10:00 AM',
                        location: 'Lab 101',
                        instructor: 'Prof. Santos',
                        accent: 'green'
                    }
                ],
                events: [
                    {
                        id: '1',
                        title: 'Midterm Exams',
                        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        description: 'Midterm examination week',
                        accent: 'red'
                    }
                ]
            },
            grades: dummyGrades,
            enrollment: {
                status: 'enrolled',
                academicYear: '2024-2025',
                semester: 'SECOND SEMESTER',
                gradeLevel: '12',
                strand: 'STEM'
            },
            subjects: [
                {
                    id: '1',
                    subject: 'Contemporary Philippine Arts from the Regions',
                    teacher: 'Prof. Maria Santos'
                },
                {
                    id: '2',
                    subject: 'Media and Information Literacy',
                    teacher: 'Prof. Juan Garcia'
                },
                {
                    id: '3',
                    subject: 'Physical Education and Health',
                    teacher: 'Coach Rodriguez'
                },
                {
                    id: '4',
                    subject: 'Filipino sa Piling Larang',
                    teacher: 'Prof. Ana Cruz'
                },
                {
                    id: '5',
                    subject: 'Entrepreneurship',
                    teacher: 'Prof. Carlos Reyes'
                },
                {
                    id: '6',
                    subject: 'Inquiries, Investigations and Immersion',
                    teacher: 'Prof. Lisa Torres'
                },
                {
                    id: '7',
                    subject: 'General Physics 2',
                    teacher: 'Prof. Robert Martinez'
                },
                {
                    id: '8',
                    subject: 'General Chemistry 2',
                    teacher: 'Prof. Patricia Lopez'
                },
                {
                    id: '9',
                    subject: 'Work Immersion',
                    teacher: 'Prof. Michael Brown'
                },
                {
                    id: '10',
                    subject: 'Practical Research 2',
                    teacher: 'Prof. Jennifer White'
                }
            ]
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: dashboardData
        });
    } catch (error) {
        console.error('Student dashboard API error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || 'Internal server error',
            data: {
                stats: {
                    gpa: null,
                    attendanceRate: null,
                    activeCourses: null,
                    pendingTasks: null
                },
                assignments: [],
                courseProgress: [],
                schedule: {
                    today: [],
                    events: []
                },
                grades: [],
                enrollment: {
                    status: 'unknown',
                    academicYear: '2024-2025',
                    semester: 'SECOND SEMESTER',
                    gradeLevel: null,
                    strand: null
                },
                subjects: []
            }
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__6ca8f044._.js.map