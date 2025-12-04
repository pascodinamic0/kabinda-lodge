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
"[project]/src/app/api/pairing/generate/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * POST /api/pairing/generate
 * Generate a pairing token for agent registration
 */ __turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-route] (ecmascript) <locals>");
;
;
// Server-side Supabase client (use service role key in production)
const getServerSupabase = ()=>{
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew';
    // Use service role key if available, otherwise fall back to anon key (with RLS)
    const key = supabaseServiceKey || supabaseAnonKey;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
async function POST(request) {
    try {
        const body = await request.json();
        const { agentName, hotelId } = body;
        if (!agentName || !hotelId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'agentName and hotelId are required'
            }, {
                status: 400
            });
        }
        // Get authenticated user from request headers
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        // Verify user has admin access to hotel
        const authToken = authHeader.replace('Bearer ', '');
        const serverSupabase = getServerSupabase();
        let user;
        try {
            const { data: userData, error: authError } = await serverSupabase.auth.getUser(authToken);
            if (authError || !userData) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Unauthorized'
                }, {
                    status: 401
                });
            }
            user = userData;
        } catch (authErr) {
            console.error('Auth error:', authErr);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Authentication failed'
            }, {
                status: 401
            });
        }
        // Check if user is admin for this hotel
        // Note: For single-hotel systems, we might skip this check or make it optional
        // If hotel_users table doesn't exist or user isn't in it, allow if they're authenticated
        try {
            const { data: hotelUser, error: hotelUserError } = await serverSupabase.from('hotel_users').select('role').eq('hotel_id', hotelId).eq('user_id', user.id).maybeSingle();
            // If hotel_users table exists and user is in it, check role
            if (hotelUser && !hotelUserError && hotelUser.role !== 'admin') {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Forbidden: Admin access required'
                }, {
                    status: 403
                });
            }
        // If hotel_users doesn't exist or user not in it, allow if authenticated (for single-hotel systems)
        } catch (checkError) {
            // If hotel_users table doesn't exist, allow authenticated users (for development)
            console.warn('Could not check hotel_users, allowing authenticated user:', checkError);
        }
        // Generate pairing token (short-lived, 5 minutes)
        const pairingTokenValue = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);
        // For inserting pairing tokens, use service role key if available to bypass RLS
        // Otherwise, create a client with the user's JWT token so RLS can identify the user
        const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log('Creating pairing token - Service key available:', hasServiceKey);
        const insertClient = hasServiceKey ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xgcsmkapakcyqxzxpuqk.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew', {
            global: {
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        // Store pairing token
        const { data: pairingToken, error: tokenError } = await insertClient.from('pairing_tokens').insert({
            hotel_id: hotelId,
            token: pairingTokenValue,
            agent_name: agentName,
            created_by: user.id,
            expires_at: expiresAt.toISOString()
        }).select().single();
        if (tokenError) {
            console.error('Error creating pairing token:', {
                error: tokenError,
                message: tokenError.message,
                code: tokenError.code,
                details: tokenError.details,
                hint: tokenError.hint,
                hasServiceKey,
                userId: user.id,
                hotelId
            });
            // If RLS blocks the insert, provide a more helpful error message
            if (tokenError.message?.includes('row-level security') || tokenError.message?.includes('permission denied') || tokenError.code === '42501') {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Permission denied: Unable to create pairing token. Please ensure RLS policies allow authenticated users to create pairing tokens.',
                    details: tokenError.message,
                    hint: hasServiceKey ? 'Service key is set but RLS is still blocking. Check that the policy was updated correctly.' : 'Service key is not set. Either set SUPABASE_SERVICE_ROLE_KEY or update RLS policies.'
                }, {
                    status: 403
                });
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: `Failed to create pairing token: ${tokenError.message}`,
                details: tokenError
            }, {
                status: 500
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            pairingToken: pairingTokenValue,
            expiresAt: expiresAt.toISOString()
        });
    } catch (error) {
        console.error('Error in pairing/generate:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ce0597b1._.js.map