import { createBrowserClient } from "@supabase/ssr"

/**
 * Comprehensive Supabase connection diagnostic
 */
export async function diagnoseSupabaseConnection() {
  const results = {
    step1_config: { success: false, error: '', details: {} as any },
    step2_client: { success: false, error: '', details: {} as any },
    step3_auth: { success: false, error: '', details: {} as any },
    step4_basic_query: { success: false, error: '', details: {} as any },
    step5_tables: { success: false, error: '', details: {} as any },
    step6_permissions: { success: false, error: '', details: {} as any }
  }

  console.log('🔍 Starting Supabase connection diagnosis...')

  // Step 1: Check Configuration
  console.log('Step 1: Checking configuration...')
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xnmnklgmmeqpajxwrkir.supabase.co"
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubW5rbGdtbWVxcGFqeHdya2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzQ0MzgsImV4cCI6MjA4ODMxMDQzOH0.kQAaa27pr99vO8Ez1ffQJMrdFmiYD2uc00odwOmA9eM"
    
    const urlValid = url.startsWith('https://') && url.includes('.supabase.co')
    const keyValid = key.length > 100 && key.startsWith('eyJ')
    
    results.step1_config = {
      success: urlValid && keyValid,
      error: !urlValid ? 'Invalid Supabase URL' : !keyValid ? 'Invalid Supabase key' : '',
      details: {
        url: url.substring(0, 30) + '...',
        keyLength: key.length,
        urlValid,
        keyValid
      }
    }
    
    if (urlValid && keyValid) {
      console.log('✅ Configuration valid')
    } else {
      console.log('❌ Configuration invalid:', results.step1_config.error)
    }
  } catch (error: any) {
    results.step1_config = { success: false, error: error.message, details: error }
    console.log('❌ Configuration check failed:', error.message)
  }

  // Step 2: Create Client
  console.log('Step 2: Creating Supabase client...')
  let supabase: any = null
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xnmnklgmmeqpajxwrkir.supabase.co"
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubW5rbGdtbWVxcGFqeHdya2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzQ0MzgsImV4cCI6MjA4ODMxMDQzOH0.kQAaa27pr99vO8Ez1ffQJMrdFmiYD2uc00odwOmA9eM"
    
    supabase = createBrowserClient(url, key)
    
    results.step2_client = {
      success: true,
      error: '',
      details: {
        clientCreated: !!supabase,
        supabaseUrl: supabase?.supabaseUrl?.substring(0, 30) + '...',
        supabaseKey: supabase?.supabaseKey?.substring(0, 20) + '...'
      }
    }
    console.log('✅ Client created successfully')
  } catch (error: any) {
    results.step2_client = { success: false, error: error.message, details: error }
    console.log('❌ Client creation failed:', error.message)
    return { success: false, results, error: 'Failed to create Supabase client' }
  }

  // Step 3: Test Authentication Status
  console.log('Step 3: Checking authentication...')
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    results.step3_auth = {
      success: !authError,
      error: authError?.message || '',
      details: {
        hasSession: !!authData?.session,
        user: authData?.session?.user?.email || 'anonymous',
        authError: authError?.message
      }
    }
    
    if (authError) {
      console.log('⚠️ Auth check warning:', authError.message)
    } else {
      console.log('✅ Auth check passed (anonymous access)')
    }
  } catch (error: any) {
    results.step3_auth = { success: false, error: error.message, details: error }
    console.log('❌ Auth check failed:', error.message)
  }

  // Step 4: Test Basic Query (system tables)
  console.log('Step 4: Testing basic database query...')
  try {
    // Try to query system information schema (should always work if connection is good)
    const { data, error } = await supabase
      .rpc('version')
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = function not found, which is OK
      throw error
    }
    
    results.step4_basic_query = {
      success: true,
      error: '',
      details: {
        queryExecuted: true,
        response: data || 'Function not found (normal)',
        errorCode: error?.code
      }
    }
    console.log('✅ Basic query successful')
  } catch (error: any) {
    // Try alternative basic query
    try {
      const { data, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (altError) throw altError
      
      results.step4_basic_query = {
        success: true,
        error: '',
        details: {
          queryExecuted: true,
          method: 'information_schema',
          tablesFound: data?.length || 0
        }
      }
      console.log('✅ Basic query successful (alternative method)')
    } catch (altError: any) {
      results.step4_basic_query = { 
        success: false, 
        error: altError.message, 
        details: { 
          originalError: error.message,
          alternativeError: altError.message,
          code: altError.code,
          hint: altError.hint
        } 
      }
      console.log('❌ Basic query failed:', altError.message)
    }
  }

  // Step 5: Check Required Tables
  console.log('Step 5: Checking required tables...')
  const requiredTables = ['locations', 'menu_categories', 'menu_items', 'orders']
  const tableResults = {} as any
  
  for (const tableName of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        tableResults[tableName] = { 
          exists: false, 
          error: error.message,
          code: error.code,
          hint: error.hint
        }
      } else {
        tableResults[tableName] = { 
          exists: true, 
          count: count || 0,
          error: null 
        }
      }
    } catch (error: any) {
      tableResults[tableName] = { 
        exists: false, 
        error: error.message,
        code: error.code
      }
    }
  }
  
  const tablesExist = Object.values(tableResults).filter((t: any) => t.exists).length
  results.step5_tables = {
    success: tablesExist > 0,
    error: tablesExist === 0 ? 'No required tables found' : `${requiredTables.length - tablesExist} tables missing`,
    details: {
      tablesFound: tablesExist,
      totalRequired: requiredTables.length,
      tableStatus: tableResults
    }
  }
  
  if (tablesExist > 0) {
    console.log(`✅ Found ${tablesExist}/${requiredTables.length} required tables`)
  } else {
    console.log('❌ No required tables found')
  }

  // Step 6: Test Permissions
  console.log('Step 6: Testing permissions...')
  try {
    // Try to insert a test record (will fail if RLS blocks it, but that's OK)
    const testData = {
      id: 'connection-test-' + Date.now(),
      name: 'Connection Test',
      address: 'Test Address',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345'
    }
    
    const { data, error } = await supabase
      .from('locations')
      .insert(testData)
      .select()
    
    if (error) {
      // Check if it's a permissions error or table doesn't exist
      if (error.code === '42P01') {
        results.step6_permissions = {
          success: false,
          error: 'Table does not exist',
          details: { errorCode: error.code, message: error.message }
        }
      } else if (error.code === '42501' || error.message.includes('RLS')) {
        results.step6_permissions = {
          success: true, // RLS blocking is actually good - means connection works
          error: 'RLS policy blocking (connection works)',
          details: { errorCode: error.code, message: error.message, rlsActive: true }
        }
      } else {
        results.step6_permissions = {
          success: false,
          error: error.message,
          details: { errorCode: error.code, message: error.message }
        }
      }
    } else {
      // Insert succeeded, clean up
      await supabase.from('locations').delete().eq('id', testData.id)
      results.step6_permissions = {
        success: true,
        error: '',
        details: { insertSucceeded: true, cleanedUp: true }
      }
    }
    
    console.log('✅ Permissions test completed')
  } catch (error: any) {
    results.step6_permissions = { success: false, error: error.message, details: error }
    console.log('❌ Permissions test failed:', error.message)
  }

  // Generate Summary
  const successfulSteps = Object.values(results).filter(r => r.success).length
  const totalSteps = Object.keys(results).length
  
  const summary = {
    overallSuccess: successfulSteps >= 4, // Need at least config, client, auth, and basic query
    successfulSteps,
    totalSteps,
    criticalIssues: [] as string[],
    recommendations: [] as string[]
  }

  // Identify critical issues
  if (!results.step1_config.success) {
    summary.criticalIssues.push('Invalid Supabase configuration')
    summary.recommendations.push('Check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }
  
  if (!results.step2_client.success) {
    summary.criticalIssues.push('Cannot create Supabase client')
    summary.recommendations.push('Verify Supabase credentials and network connection')
  }
  
  if (!results.step4_basic_query.success) {
    summary.criticalIssues.push('Cannot execute database queries')
    summary.recommendations.push('Check if Supabase project is active and accessible')
  }
  
  if (!results.step5_tables.success) {
    summary.criticalIssues.push('Required database tables missing')
    summary.recommendations.push('Run "Create Tables" in Settings to create the database schema')
  }

  // Add general recommendations
  if (summary.criticalIssues.length === 0) {
    summary.recommendations.push('Connection is working! You can proceed with data synchronization.')
  } else {
    summary.recommendations.push('Fix the critical issues above, then try connecting again.')
  }

  console.log('🎉 Connection diagnosis completed')
  console.log(`Summary: ${successfulSteps}/${totalSteps} steps successful`)
  
  return {
    success: summary.overallSuccess,
    results,
    summary
  }
}