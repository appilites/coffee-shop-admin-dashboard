import { getSupabaseBrowserClient } from "./supabase"

/**
 * Debug function to test database operations step by step
 */
export async function debugDatabaseSync() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Starting database debug...')
    
    // Test 1: Basic connection
    console.log('Test 1: Testing basic connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (connectionError) {
      return {
        success: false,
        step: 'connection',
        error: `Connection failed: ${connectionError.message}`,
        details: connectionError
      }
    }
    console.log('✅ Connection successful')

    // Test 2: Check if tables exist
    console.log('Test 2: Checking if tables exist...')
    const tables = ['locations', 'menu_categories', 'menu_items']
    const tableStatus: Record<string, { exists: boolean; count?: any; error?: string }> = {}
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          tableStatus[tableName] = { exists: false, error: error.message }
          console.log(`❌ Table ${tableName}: ${error.message}`)
        } else {
          tableStatus[tableName] = { exists: true, count: data }
          console.log(`✅ Table ${tableName}: exists`)
        }
      } catch (err) {
        tableStatus[tableName] = { exists: false, error: 'Unknown error' }
        console.log(`❌ Table ${tableName}: Unknown error`)
      }
    }

    // Test 3: Try inserting a simple location
    console.log('Test 3: Testing simple location insert...')
    const testLocation = {
      id: 'test-location-1',
      name: 'Test Location',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      phone: '555-0123',
      is_active: true,
      opening_time: '09:00',
      closing_time: '17:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .upsert(testLocation, { onConflict: 'id' })
      .select()

    if (locationError) {
      return {
        success: false,
        step: 'location_insert',
        error: `Location insert failed: ${locationError.message}`,
        details: locationError,
        tableStatus
      }
    }
    console.log('✅ Location insert successful')

    // Test 4: Try inserting a simple category
    console.log('Test 4: Testing simple category insert...')
    const testCategory = {
      id: 'test-category-1',
      name: 'Test Category',
      description: 'Test category description',
      display_order: 1,
      is_active: true,
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from('menu_categories')
      .upsert(testCategory, { onConflict: 'id' })
      .select()

    if (categoryError) {
      return {
        success: false,
        step: 'category_insert',
        error: `Category insert failed: ${categoryError.message}`,
        details: categoryError,
        tableStatus
      }
    }
    console.log('✅ Category insert successful')

    // Test 5: Try inserting a simple menu item
    console.log('Test 5: Testing simple menu item insert...')
    const testMenuItem = {
      id: 'test-item-1',
      category_id: 'test-category-1',
      name: 'Test Menu Item',
      description: 'Test menu item description',
      base_price: 9.99,
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center',
      is_available: true,
      is_featured: false,
      prep_time_minutes: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: menuItemData, error: menuItemError } = await supabase
      .from('menu_items')
      .upsert(testMenuItem, { onConflict: 'id' })
      .select()

    if (menuItemError) {
      return {
        success: false,
        step: 'menu_item_insert',
        error: `Menu item insert failed: ${menuItemError.message}`,
        details: menuItemError,
        tableStatus
      }
    }
    console.log('✅ Menu item insert successful')

    // Clean up test data
    console.log('Cleaning up test data...')
    await supabase.from('menu_items').delete().eq('id', 'test-item-1')
    await supabase.from('menu_categories').delete().eq('id', 'test-category-1')
    await supabase.from('locations').delete().eq('id', 'test-location-1')

    return {
      success: true,
      message: 'All database tests passed successfully!',
      tableStatus
    }

  } catch (error) {
    console.error('Debug sync error:', error)
    return {
      success: false,
      step: 'unknown',
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Check database schema and permissions
 */
export async function checkDatabaseSchema() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Checking database schema...')
    
    // Check table structure
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'menu_items' })
    
    if (error) {
      console.log('Cannot check schema via RPC, trying direct query...')
      
      // Try a simple select to see what columns exist
      const { data: sampleData, error: selectError } = await supabase
        .from('menu_items')
        .select('*')
        .limit(1)
      
      if (selectError) {
        return {
          success: false,
          error: `Schema check failed: ${selectError.message}`,
          suggestion: 'Tables may not exist or have incorrect structure'
        }
      }
      
      return {
        success: true,
        message: 'Tables exist but cannot check detailed schema',
        sampleData
      }
    }
    
    return {
      success: true,
      message: 'Schema check completed',
      columns
    }
    
  } catch (error) {
    return {
      success: false,
      error: `Schema check error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}