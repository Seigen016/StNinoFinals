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
"[project]/app/api/admin/settings/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.0.8_react-dom@19.2.1_react@19.2.1__react@19.2.1/node_modules/next/server.js [app-route] (ecmascript)");
;
// Use admin client for server-side operations (uses SERVICE_ROLE_KEY, not anon key)
// This is critical: server-side API routes MUST use service role key, not anon key
// Default settings
const DEFAULT_SETTINGS = {
    schoolName: "Sto Niño de Praga Academy",
    academicYear: "2024-2025",
    automaticBackup: true,
    rfidIntegration: true,
    emailNotifications: true,
    studentPortal: true,
    teacherPortal: true
};
async function GET() {
    try {
        // Try to fetch from database (if you have a settings table)
        // For now, return default settings
        // You can later implement database storage:
        /*
    const supabase = getSupabaseAdmin() // Use admin client with service role key
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()
    
    if (error || !data) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      })
    }
    
    return NextResponse.json({
      success: true,
      settings: {
        ...DEFAULT_SETTINGS,
        ...data,
      },
    })
    */ return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            settings: DEFAULT_SETTINGS
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: "Failed to fetch settings",
            settings: DEFAULT_SETTINGS
        }, {
            status: 200
        } // Return 200 instead of 500 to prevent frontend crashes
        );
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        // Validate settings structure
        const settings = {
            schoolName: body.schoolName || DEFAULT_SETTINGS.schoolName,
            academicYear: body.academicYear || DEFAULT_SETTINGS.academicYear,
            automaticBackup: body.automaticBackup ?? DEFAULT_SETTINGS.automaticBackup,
            rfidIntegration: body.rfidIntegration ?? DEFAULT_SETTINGS.rfidIntegration,
            emailNotifications: body.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
            studentPortal: body.studentPortal ?? DEFAULT_SETTINGS.studentPortal,
            teacherPortal: body.teacherPortal ?? DEFAULT_SETTINGS.teacherPortal
        };
        // Save to database (if you have a settings table)
        // For now, just return the settings
        // You can later implement database storage:
        /*
    const supabase = getSupabaseAdmin() // Use admin client with service role key
    const { data, error } = await supabase
      .from("settings")
      .upsert(
        {
          id: 1,
          ...settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single()
    
    if (error) {
      throw error
    }
    */ return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            settings: settings,
            message: "Settings saved successfully"
        });
    } catch (error) {
        console.error("Error saving settings:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$8_react$2d$dom$40$19$2e$2$2e$1_react$40$19$2e$2$2e$1_$5f$react$40$19$2e$2$2e$1$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error?.message || "Failed to save settings"
        }, {
            status: 200
        } // Return 200 instead of 500 to prevent frontend crashes
        );
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c80ed649._.js.map