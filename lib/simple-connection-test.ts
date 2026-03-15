import { createBrowserClient } from "@supabase/ssr"

/**
 * Simple connection test that avoids system tables
 */
export async function simpleConnectionTest() {
  console.log('🔍 Running simple connection test...')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xnmnklgmmeqpajxwrkir.supabase.co"
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubW5rbGdtbWVxcGFqeHdya2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MzQ0MzgsImV4cCI6MjA4ODMxMDQzOH0.kQAaa27pr99vO8Ez1ffQJMrdFmiYD2uc00odwOmA9eM"
  
  const results = {
    step1: { name: 'Configuration', success: false, message: '' },
    step2: { name: 'REST API', success: false, message: '' },
    step3: { name: 'Database Query', success: false, message: '' },
    step4: { name: 'Tables Check', success: false, message: '' }
  }
  
  // Step 1: Check configuration
  try {
    if (!url || !key) {
      results.step1 = { name: 'Configuration', success: false, message: 'Missing URL or API key' }
    } else if (!url.includes('supabase.co')) {
      results.step1 = { name: 'Configuration', success: false, message: 'Invalid Supabase URL' }
    } else if (!key.startsWith('eyJ')) {
      results.step1 = { name: 'Configuration', success: false, message: 'Invalid API key format' }
    } else {
      results.step1 = { name: 'Configuration', success: true, message: 'Configuration valid' }
    }
    console.log('Step 1:', results.step1.message)
  } catch (error: any) {
    results.step1 = { name: 'Configuration', success: false, message: `Config error: ${error.message}` }
  }
  
  // Step 2: Test REST API endpoint
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: { 'apikey': key }
    })
    
    if (response.ok || response.status === 404) {
      results.step2 = { name: 'REST API', success: true, message: `API accessible (${response.status})` }
    } else if (response.status === 401) {
      results.step2 = { name: 'REST API', success: false, message: 'Invalid API key (401)' }
    } else {
      results.step2 = { name: 'REST API', success: false, message: `API error (${response.status})` }
    }
    console.log('Step 2:', results.step2.message)
  } catch (error: any) {
    results.step2 = { name: 'REST API', success: false, message: `Network error: ${error.message}` }
  }
  
  // Step 3: Test database query capability
  try {
    const supabase = createBrowserClient(url, key)
    
    // Try a simple RPC call first
    const { error: rpcError } = await supabase.rpc('version')
    
    if (!rpcError || rpcError.code === 'PGRST116') {
      // No error or "function not found" (both are OK)
      results.step3 = { name: 'Database Query', success: true, message: 'Database queries working' }
    } else if (rpcError.code === '42501') {
      results.step3 = { name: 'Database Query', success: true, message: 'Database accessible (RLS active)' }
    } else {
      results.step3 = { name: 'Database Query', success: false, message: `Query error: ${rpcError.message}` }
    }
    console.log('Step 3:', results.step3.message)
  } catch (error: any) {
    results.step3 = { name: 'Database Query', success: false, message: `Database error: ${error.message}` }
  }
  
  // Step 4: Check if our application tables exist
  try {
    const supabase = createBrowserClient(url, key)
    const tables = ['locations', 'menu_categories', 'menu_items', 'orders']
    let existingTables = 0
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)
        if (!error || error.code !== '42P01') {
          existingTables++
        }
      } catch {
        // Ignore errors for individual tables
      }
    }
    
    if (existingTables === tables.length) {
      results.step4 = { name: 'Tables Check', success: true, message: 'All tables exist' }
    } else if (existingTables > 0) {
      results.step4 = { name: 'Tables Check', success: false, message: `${existingTables}/${tables.length} tables exist` }
    } else {
      results.step4 = { name: 'Tables Check', success: false, message: 'No tables found - need to create them' }
    }
    console.log('Step 4:', results.step4.message)
  } catch (error: any) {
    results.step4 = { name: 'Tables Check', success: false, message: `Tables check failed: ${error.message}` }
  }
  
  // Generate summary
  const successfulSteps = Object.values(results).filter(r => r.success).length
  const totalSteps = Object.keys(results).length
  
  const summary = {
    success: successfulSteps >= 3, // Need at least 3/4 steps to pass
    successfulSteps,
    totalSteps,
    message: `${successfulSteps}/${totalSteps} checks passed`,
    nextAction: getNextAction(results)
  }
  
  console.log('🎉 Simple connection test completed')
  console.log(`Summary: ${summary.message}`)
  console.log(`Next action: ${summary.nextAction}`)
  
  return {
    success: summary.success,
    results,
    summary
  }
}

function getNextAction(results: any): string {
  if (!results.step1.success) {
    return 'Fix environment variables in .env.local file'
  }
  if (!results.step2.success) {
    return 'Check if Supabase project is active (not paused)'
  }
  if (!results.step3.success) {
    return 'Verify API key permissions and project access'
  }
  if (!results.step4.success) {
    return 'Create database tables using the SQL script or "Create Tables" button'
  }
  return 'All checks passed! You can proceed with data synchronization'
}