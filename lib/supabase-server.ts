import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xnmnklgmmeqpajxwrkir.supabase.co"

// Supports both old anon key format and new publishable key format
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubW5rbGdtbWVxcGFqeHdya2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzQ0MzgsImV4cCI6MjA4ODMxMDQzOH0.kQAaa27pr99vO8Ez1ffQJMrdFmiYD2uc00odwOmA9eM"

/**
 * Service Role / Secret Key — bypasses Supabase RLS entirely.
 * Required for all INSERT / UPDATE / DELETE in the admin dashboard.
 *
 * New format projects:  SUPABASE_SECRET_KEY=sb_secret_...
 * Old format projects:  SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
 *
 * Set one of these in .env.local
 * (Supabase Dashboard → Project Settings → API → Secret key / service_role)
 */
const supabaseServiceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ""

// Read-only server client (uses publishable/anon key + cookies)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Component — cannot set cookies, safe to ignore
        }
      },
    },
  })
}

/**
 * Admin client — uses secret/service_role key, bypasses RLS.
 * Use this for ALL write operations (INSERT / UPDATE / DELETE) in API routes.
 */
export function getSupabaseAdminClient() {
  const key = supabaseServiceRoleKey || supabaseAnonKey
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * General server client:
 * - If secret key is available → admin client (bypasses RLS) ✅
 * - Otherwise → anon client (read-only for public tables)
 */
export async function getSupabaseServerClient() {
  if (supabaseServiceRoleKey) {
    return getSupabaseAdminClient()
  }
  return createServerSupabaseClient()
}
