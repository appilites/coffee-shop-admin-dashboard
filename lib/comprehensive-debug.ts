import { getSupabaseBrowserClient } from "./supabase"
import { mockCategories, mockProducts, mockOrders } from "../data/mock-data"

/**
 * Comprehensive debug function to identify all issues
 */
export async function comprehensiveDebug() {
  const supabase = getSupabaseBrowserClient()
  const results = {
    connection: { success: false, error: '', details: null as any },
    tables: { success: false, error: '', details: {} as any },
    mockData: { success: false, error: '', details: {} as any },
    sync: { success: false, error: '', details: {} as any },
    apis: { success: false, error: '', details: {} as any },
    frontend: { success: false, error: '', details: {} as any }
  }

  try {
    console.log('🔍 Starting comprehensive debug...')

    // 1. Test Connection
    console.log('Step 1: Testing Supabase connection...')
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1)
      
      if (error) throw error
      results.connection = { success: true, error: '', details: data }
      console.log('✅ Connection successful')
    } catch (error: any) {
      results.connection = { success: false, error: error.message, details: error }
      console.log('❌ Connection failed:', error.message)
    }

    // 2. Check Tables
    console.log('Step 2: Checking database tables...')
    const requiredTables = ['locations', 'menu_categories', 'menu_items', 'orders', 'order_items']
    const tableResults = {} as any

    for (const tableName of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (error) throw error
        tableResults[tableName] = { exists: true, count: count || 0, error: null }
        console.log(`✅ Table ${tableName}: ${count || 0} records`)
      } catch (error: any) {
        tableResults[tableName] = { exists: false, count: 0, error: error.message }
        console.log(`❌ Table ${tableName}: ${error.message}`)
      }
    }

    results.tables = { 
      success: Object.values(tableResults).every((t: any) => t.exists), 
      error: Object.values(tableResults).some((t: any) => !t.exists) ? 'Some tables missing' : '',
      details: tableResults 
    }

    // 3. Check Mock Data
    console.log('Step 3: Checking mock data availability...')
    try {
      const mockDataStats = {
        locations: 3, // Using sample locations
        categories: mockCategories.length,
        menuItems: mockProducts.length,
        sampleLocation: 'Main Street',
        sampleCategory: mockCategories[0]?.name || 'None',
        sampleMenuItem: mockProducts[0]?.name || 'None'
      }

      results.mockData = { 
        success: mockCategories.length > 0 && mockProducts.length > 0,
        error: mockCategories.length === 0 ? 'No mock categories' : mockProducts.length === 0 ? 'No mock products' : '',
        details: mockDataStats 
      }
      console.log('✅ Mock data loaded:', mockDataStats)
    } catch (error: any) {
      results.mockData = { success: false, error: error.message, details: null }
      console.log('❌ Mock data error:', error.message)
    }

    // 4. Test Sync Process
    console.log('Step 4: Testing sync process...')
    try {
      // Test inserting one item of each type
      const testLocation = {
        id: 'debug-loc-1',
        name: 'Debug Location',
        address: '123 Debug St',
        city: 'Debug City',
        state: 'DB',
        zip_code: '12345',
        phone: '555-0000',
        is_active: true,
        opening_time: '09:00',
        closing_time: '17:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: locError } = await supabase
        .from('locations')
        .upsert(testLocation, { onConflict: 'id' })

      if (locError) throw new Error(`Location insert failed: ${locError.message}`)

      const testCategory = {
        id: 'debug-cat-1',
        name: 'Debug Category',
        description: 'Debug category',
        display_order: 999,
        is_active: true,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: catError } = await supabase
        .from('menu_categories')
        .upsert(testCategory, { onConflict: 'id' })

      if (catError) throw new Error(`Category insert failed: ${catError.message}`)

      const testMenuItem = {
        id: 'debug-item-1',
        category_id: 'debug-cat-1',
        name: 'Debug Item',
        description: 'Debug menu item',
        base_price: 9.99,
        image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center',
        is_available: true,
        is_featured: false,
        prep_time_minutes: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: itemError } = await supabase
        .from('menu_items')
        .upsert(testMenuItem, { onConflict: 'id' })

      if (itemError) throw new Error(`Menu item insert failed: ${itemError.message}`)

      // Clean up
      await supabase.from('menu_items').delete().eq('id', 'debug-item-1')
      await supabase.from('menu_categories').delete().eq('id', 'debug-cat-1')
      await supabase.from('locations').delete().eq('id', 'debug-loc-1')

      results.sync = { success: true, error: '', details: 'All sync operations successful' }
      console.log('✅ Sync test successful')
    } catch (error: any) {
      results.sync = { success: false, error: error.message, details: error }
      console.log('❌ Sync test failed:', error.message)
    }

    // 5. Test API Routes
    console.log('Step 5: Testing API routes...')
    try {
      const apiTests = {} as any

      // Test each API
      const apis = [
        { name: 'products', url: '/api/products' },
        { name: 'categories', url: '/api/categories' },
        { name: 'orders', url: '/api/orders' }
      ]

      for (const api of apis) {
        try {
          const response = await fetch(api.url)
          const data = response.ok ? await response.json() : null
          
          apiTests[api.name] = {
            status: response.status,
            success: response.ok,
            count: Array.isArray(data) ? data.length : 0,
            error: response.ok ? null : `HTTP ${response.status}`,
            sampleData: Array.isArray(data) ? data.slice(0, 1) : null
          }
        } catch (error: any) {
          apiTests[api.name] = {
            status: 0,
            success: false,
            count: 0,
            error: error.message,
            sampleData: null
          }
        }
      }

      results.apis = { 
        success: Object.values(apiTests).every((t: any) => t.success),
        error: Object.values(apiTests).some((t: any) => !t.success) ? 'Some APIs failing' : '',
        details: apiTests 
      }
      console.log('✅ API tests completed')
    } catch (error: any) {
      results.apis = { success: false, error: error.message, details: null }
      console.log('❌ API test error:', error.message)
    }

    // 6. Test Frontend Data Flow
    console.log('Step 6: Testing frontend data flow...')
    try {
      // Check if data exists in database
      const { count: dbProducts } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true })

      const { count: dbCategories } = await supabase
        .from('menu_categories')
        .select('*', { count: 'exact', head: true })

      const { count: dbOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      results.frontend = { 
        success: (dbProducts || 0) > 0 && (dbCategories || 0) > 0,
        error: (dbProducts || 0) === 0 ? 'No products in database' : (dbCategories || 0) === 0 ? 'No categories in database' : '',
        details: {
          productsInDB: dbProducts || 0,
          categoriesInDB: dbCategories || 0,
          ordersInDB: dbOrders || 0,
          recommendation: (dbProducts || 0) === 0 ? 'Run full sync to populate database' : 'Data exists, check API routes'
        }
      }
      console.log('✅ Frontend check completed')
    } catch (error: any) {
      results.frontend = { success: false, error: error.message, details: null }
      console.log('❌ Frontend check error:', error.message)
    }

    // Generate summary
    const overallSuccess = Object.values(results).every(r => r.success)
    const summary = {
      overallSuccess,
      issues: Object.entries(results)
        .filter(([_, result]) => !result.success)
        .map(([step, result]) => ({ step, error: result.error })),
      recommendations: generateRecommendations(results)
    }

    console.log('🎉 Comprehensive debug completed')
    console.log('Summary:', summary)

    return {
      success: true,
      results,
      summary
    }

  } catch (error: any) {
    console.error('Comprehensive debug failed:', error)
    return {
      success: false,
      error: error.message,
      results
    }
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations = []

  if (!results.connection.success) {
    recommendations.push('Fix Supabase connection - check credentials and network')
  }

  if (!results.tables.success) {
    recommendations.push('Create missing database tables using "Create Tables" button')
  }

  if (!results.mockData.success) {
    recommendations.push('Check mock data import - ensure lib/mock-data.ts is accessible')
  }

  if (!results.sync.success) {
    recommendations.push('Fix sync process - check foreign key constraints and data format')
  }

  if (!results.apis.success) {
    recommendations.push('Fix API routes - check server-side database connections')
  }

  if (!results.frontend.success) {
    if (results.frontend.details?.productsInDB === 0) {
      recommendations.push('Run "Sync All Data" to populate database with coffee shop products')
    } else {
      recommendations.push('Check frontend components - data exists but not displaying')
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems working! If you still see issues, check browser console for errors')
  }

  return recommendations
}