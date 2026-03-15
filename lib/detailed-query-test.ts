import { createBrowserClient } from "@supabase/ssr"

/**
 * Detailed query test to identify specific database issues
 */
export async function detailedQueryTest() {
  console.log('🔍 Running detailed query test...')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xnmnklgmmeqpajxwrkir.supabase.co"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubW5rbGdtbWVxcGFqeHdya2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzQ0MzgsImV4cCI6MjA4ODMxMDQzOH0.kQAaa27pr99vO8Ez1ffQJMrdFmiYD2uc00odwOmA9eM"
  
  const supabase = createBrowserClient(url, key)
  
  const tests = []
  
  // Test 1: Basic REST endpoint
  console.log('Test 1: Testing REST endpoint directly...')
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    })
    
    tests.push({
      name: 'REST Endpoint',
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      details: response.ok ? 'REST API accessible' : `HTTP ${response.status}: ${response.statusText}`
    })
    
    console.log(`REST endpoint: ${response.status} ${response.statusText}`)
  } catch (error: any) {
    tests.push({
      name: 'REST Endpoint',
      success: false,
      error: error.message,
      details: 'Network error accessing REST API'
    })
    console.error('REST endpoint error:', error.message)
  }
  
  // Test 2: System tables query (try multiple approaches)
  console.log('Test 2: Testing database access...')
  try {
    // First try: Simple version query
    let { data, error } = await supabase.rpc('version')
    
    if (error && error.code === 'PGRST116') {
      // Function doesn't exist, try alternative
      console.log('Version function not available, trying alternative...')
      
      // Second try: Simple select 1
      const response = await fetch(`${url}/rest/v1/rpc/version`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      
      if (response.status === 404) {
        // RPC not found is OK, means database is accessible
        tests.push({
          name: 'Database Access',
          success: true,
          details: 'Database accessible (RPC endpoint found)',
          method: 'RPC endpoint test'
        })
        console.log('Database access confirmed via RPC endpoint')
      } else if (response.status === 200) {
        tests.push({
          name: 'Database Access',
          success: true,
          details: 'Database accessible and RPC working',
          method: 'RPC call successful'
        })
        console.log('Database access confirmed via RPC call')
      } else {
        throw new Error(`RPC test failed: ${response.status} ${response.statusText}`)
      }
    } else if (error) {
      throw error
    } else {
      tests.push({
        name: 'Database Access',
        success: true,
        details: 'Database accessible via version function',
        data: data,
        method: 'Version RPC'
      })
      console.log('Database access confirmed via version function')
    }
  } catch (error: any) {
    // Third try: Test with a simple table query (will fail if no tables, but that's OK)
    try {
      const { data: testData, error: testError } = await supabase
        .from('locations')
        .select('id')
        .limit(1)
      
      if (testError && testError.code === '42P01') {
        // Table doesn't exist - this is actually good, means database is accessible
        tests.push({
          name: 'Database Access',
          success: true,
          details: 'Database accessible (table not found is expected)',
          method: 'Table query test',
          note: 'Tables need to be created'
        })
        console.log('Database access confirmed - tables need to be created')
      } else if (testError) {
        tests.push({
          name: 'Database Access',
          success: false,
          error: testError.message,
          code: testError.code,
          hint: testError.hint,
          details: `Database query error: ${testError.code}`,
          method: 'Table query test'
        })
        console.error('Database access error:', testError)
      } else {
        tests.push({
          name: 'Database Access',
          success: true,
          details: 'Database accessible and tables exist',
          method: 'Table query successful',
          data: testData
        })
        console.log('Database access confirmed - tables exist')
      }
    } catch (finalError: any) {
      tests.push({
        name: 'Database Access',
        success: false,
        error: finalError.message,
        details: 'All database access methods failed',
        originalError: error.message,
        finalError: finalError.message
      })
      console.error('All database access tests failed:', finalError)
    }
  }
  
  // Test 3: Simple RPC call
  console.log('Test 3: Testing RPC call...')
  try {
    const { data, error } = await supabase.rpc('version')
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = function not found (OK)
      tests.push({
        name: 'RPC Call',
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: `RPC error: ${error.code}`
      })
      console.error('RPC error:', error)
    } else {
      tests.push({
        name: 'RPC Call',
        success: true,
        details: error?.code === 'PGRST116' ? 'RPC accessible (function not found is OK)' : 'RPC successful',
        data: data
      })
      console.log('RPC call successful')
    }
  } catch (error: any) {
    tests.push({
      name: 'RPC Call',
      success: false,
      error: error.message,
      details: 'Exception during RPC call'
    })
    console.error('RPC exception:', error)
  }
  
  // Test 4: Check if our tables exist
  console.log('Test 4: Checking for our application tables...')
  const appTables = ['locations', 'menu_categories', 'menu_items', 'orders']
  const tableTests = []
  
  for (const tableName of appTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        tableTests.push({
          table: tableName,
          exists: false,
          error: error.message,
          code: error.code,
          hint: error.hint
        })
        console.log(`Table ${tableName}: ERROR - ${error.message}`)
      } else {
        tableTests.push({
          table: tableName,
          exists: true,
          count: count || 0
        })
        console.log(`Table ${tableName}: EXISTS with ${count || 0} records`)
      }
    } catch (error: any) {
      tableTests.push({
        table: tableName,
        exists: false,
        error: error.message,
        exception: true
      })
      console.log(`Table ${tableName}: EXCEPTION - ${error.message}`)
    }
  }
  
  tests.push({
    name: 'Application Tables',
    success: tableTests.some(t => t.exists),
    details: `${tableTests.filter(t => t.exists).length}/${appTables.length} tables exist`,
    tableResults: tableTests
  })
  
  // Test 5: Test direct HTTP request to specific table
  console.log('Test 5: Testing direct HTTP request to locations table...')
  try {
    const response = await fetch(`${url}/rest/v1/locations?select=*&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    })
    
    const responseText = await response.text()
    let responseData = null
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      // Response is not JSON
    }
    
    tests.push({
      name: 'Direct HTTP Request',
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseText: responseText.substring(0, 200),
      details: response.ok ? 'Direct HTTP request successful' : `HTTP ${response.status}`,
      data: responseData
    })
    
    console.log(`Direct HTTP: ${response.status} - ${responseText.substring(0, 100)}`)
  } catch (error: any) {
    tests.push({
      name: 'Direct HTTP Request',
      success: false,
      error: error.message,
      details: 'Network error in direct HTTP request'
    })
    console.error('Direct HTTP error:', error.message)
  }
  
  // Analyze results
  const successfulTests = tests.filter(t => t.success).length
  const totalTests = tests.length
  
  const analysis = {
    overallSuccess: successfulTests >= 3, // Need most tests to pass
    successfulTests,
    totalTests,
    issues: [] as string[],
    recommendations: [] as string[]
  }
  
  // Identify specific issues
  const restTest = tests.find(t => t.name === 'REST Endpoint')
  const systemTest = tests.find(t => t.name === 'System Tables Query')
  const rpcTest = tests.find(t => t.name === 'RPC Call')
  const tablesTest = tests.find(t => t.name === 'Application Tables')
  const httpTest = tests.find(t => t.name === 'Direct HTTP Request')
  
  if (!restTest?.success) {
    analysis.issues.push('REST API not accessible')
    analysis.recommendations.push('Check if Supabase project is active and not paused')
  }
  
  if (!systemTest?.success) {
    analysis.issues.push('Cannot query system tables')
    if (systemTest?.code === '42501') {
      analysis.recommendations.push('RLS policy blocking system queries - this might be normal')
    } else {
      analysis.recommendations.push('Database connection or permissions issue')
    }
  }
  
  if (!rpcTest?.success && rpcTest?.code !== 'PGRST116') {
    analysis.issues.push('RPC calls not working')
    analysis.recommendations.push('Database function execution blocked')
  }
  
  if (!tablesTest?.success) {
    analysis.issues.push('Application tables missing or inaccessible')
    analysis.recommendations.push('Run "Create Tables" to create the database schema')
  }
  
  if (!httpTest?.success) {
    if (httpTest?.status === 401) {
      analysis.issues.push('Authentication failed')
      analysis.recommendations.push('Check if your API key is valid and not expired')
    } else if (httpTest?.status === 404) {
      analysis.issues.push('Table not found')
      analysis.recommendations.push('Create the database tables first')
    } else {
      analysis.issues.push('HTTP request failed')
      analysis.recommendations.push('Check network connectivity and Supabase status')
    }
  }
  
  // Add general recommendations
  if (analysis.issues.length === 0) {
    analysis.recommendations.push('All database tests passed! You can proceed with data operations.')
  } else if (analysis.issues.includes('Application tables missing or inaccessible')) {
    analysis.recommendations.push('PRIORITY: Create database tables using the "Create Tables" button')
  } else if (analysis.issues.includes('REST API not accessible')) {
    analysis.recommendations.push('PRIORITY: Check if your Supabase project is paused or inactive')
  }
  
  console.log('🎉 Detailed query test completed')
  console.log(`Results: ${successfulTests}/${totalTests} tests passed`)
  
  return {
    success: analysis.overallSuccess,
    tests,
    analysis,
    summary: `${successfulTests}/${totalTests} tests passed. ${analysis.issues.length} issues found.`
  }
}