// lib/supabaseClient.ts
import { Database } from '@/database.types'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Client for Client-Side Operations
 * 
 * This client uses the ANON key and is safe to use in browser code.
 * It respects Row Level Security (RLS) policies in Supabase.
 * 
 * DO NOT use service role key here - it bypasses RLS and is a security risk.
 * For admin operations, use getSupabaseAdmin() in server-side code only.
 */

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Supabase client instance with typed database schema
 * Use this for all client-side database operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)