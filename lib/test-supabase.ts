import { getSupabaseBrowserClient } from "./supabase"

/**
 * Test Supabase connection and basic functionality
 */
export async function testSupabaseConnection() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection test failed:', error)
      return {
        success: false,
        error: 'Failed to connect to Supabase database',
        details: error.message
      }
    }
    
    console.log('✅ Basic connection successful')
    
    // Test 2: Check if our tables exist
    const requiredTables = ['locations', 'menu_categories', 'menu_items', 'orders']
    const tableStatus: Record<string, string> = {}
    
    for (const tableName of requiredTables) {
      try {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (tableError) {
          if (tableError.message.includes('does not exist') || tableError.code === '42P01') {
            tableStatus[tableName] = 'missing'
          } else {
            tableStatus[tableName] = 'error'
          }
        } else {
          tableStatus[tableName] = 'exists'
        }
      } catch (err) {
        tableStatus[tableName] = 'missing'
      }
    }
    
    const existingTables = Object.entries(tableStatus).filter(([_, status]) => status === 'exists')
    const missingTables = Object.entries(tableStatus).filter(([_, status]) => status === 'missing')
    
    console.log('📊 Table status:', tableStatus)
    
    return {
      success: true,
      message: 'Supabase connection successful',
      tableStatus,
      existingTables: existingTables.map(([name]) => name),
      missingTables: missingTables.map(([name]) => name),
      needsSetup: missingTables.length > 0
    }
    
  } catch (error) {
    console.error('❌ Supabase test failed:', error)
    return {
      success: false,
      error: 'Unexpected error during connection test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test data operations
 */
export async function testDataOperations() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Testing data operations...')
    
    // Test reading from locations table
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5)
    
    if (locationsError) {
      console.warn('⚠️ Locations table not accessible:', locationsError.message)
    } else {
      console.log('✅ Locations table accessible, found', locations?.length || 0, 'records')
    }
    
    // Test reading from categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(5)
    
    if (categoriesError) {
      console.warn('⚠️ Categories table not accessible:', categoriesError.message)
    } else {
      console.log('✅ Categories table accessible, found', categories?.length || 0, 'records')
    }
    
    // Test reading from products table
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5)
    
    if (productsError) {
      console.warn('⚠️ Products table not accessible:', productsError.message)
    } else {
      console.log('✅ Products table accessible, found', products?.length || 0, 'records')
    }
    
    return {
      success: true,
      message: 'Data operations test completed',
      results: {
        locations: locations?.length || 0,
        categories: categories?.length || 0,
        products: products?.length || 0
      }
    }
    
  } catch (error) {
    console.error('❌ Data operations test failed:', error)
    return {
      success: false,
      error: 'Data operations test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}