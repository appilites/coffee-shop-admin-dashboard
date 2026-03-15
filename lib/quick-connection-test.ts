import { createBrowserClient } from "@supabase/ssr"

/**
 * Quick connection test to identify immediate issues
 */
export async function quickConnectionTest() {
  console.log('🔍 Running quick connection test...')
  
  try {
    // Check environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', url ? 'Set' : 'Missing')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'Set' : 'Missing')
    
    if (!url || !key) {
      return {
        success: false,
        error: 'Missing environment variables',
        details: {
          missingUrl: !url,
          missingKey: !key,
          solution: 'Check your .env.local file in admin-dashboard folder'
        }
      }
    }
    
    // Create client
    console.log('Creating Supabase client...')
    const supabase = createBrowserClient(url, key)
    
    // Test basic connection
    console.log('Testing connection...')
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) {
      console.error('Connection error:', error)
      return {
        success: false,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          message: error.message,
          possibleCauses: [
            'Supabase project is paused or inactive',
            'Invalid credentials',
            'Network connectivity issues',
            'Supabase service outage'
          ]
        }
      }
    }
    
    console.log('✅ Connection successful!')
    return {
      success: true,
      message: 'Connection to Supabase is working',
      details: {
        connected: true,
        tablesAccessible: true
      }
    }
    
  } catch (error: any) {
    console.error('Quick connection test failed:', error)
    return {
      success: false,
      error: error.message || 'Unknown connection error',
      details: {
        type: 'Exception',
        message: error.message,
        stack: error.stack
      }
    }
  }
}