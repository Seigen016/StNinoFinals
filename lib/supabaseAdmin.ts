import { Database } from '@/database.types'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Creates and returns a Supabase admin client instance
 * 
 * @returns SupabaseClient with full admin privileges
 * @throws Error if environment variables are not set
 * 
 * @example
 * ```ts
 * // In API route or Server Component only
 * const supabaseAdmin = getSupabaseAdmin();
 * const { data } = await supabaseAdmin.from('users').select('*');
 * ```
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server-only).')
  }
  
  return createClient<Database>(supabaseUrl as string, serviceRoleKey as string, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}


