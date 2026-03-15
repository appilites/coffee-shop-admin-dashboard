import { getSupabaseBrowserClient } from "./supabase"

/**
 * Debug dashboard data issues
 * This function tests if data exists and is accessible
 */
export async function debugDashboardData() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Starting dashboard data debug...')
    
    // Step 1: Test direct Supabase queries
    console.log('Step 1: Testing direct Supabase queries...')
    
    const [
      { data: locations, error: locError },
      { data: categories, error: catError },
      { data: products, error: prodError },
      { data: orders, error: orderError }
    ] = await Promise.all([
      supabase.from('locations').select('*'),
      supabase.from('menu_categories').select('*'),
      supabase.from('menu_items').select('*'),
      supabase.from('orders').select('*')
    ])
    
    if (locError) console.error('Locations error:', locError)
    if (catError) console.error('Categories error:', catError)
    if (prodError) console.error('Products error:', prodError)
    if (orderError) console.error('Orders error:', orderError)
    
    console.log('Direct query results:')
    console.log(`- Locations: ${locations?.length || 0}`)
    console.log(`- Categories: ${categories?.length || 0}`)
    console.log(`- Products: ${products?.length || 0}`)
    console.log(`- Orders: ${orders?.length || 0}`)
    
    // Step 2: Test API endpoints
    console.log('Step 2: Testing API endpoints...')
    
    try {
      const [productsAPI, categoriesAPI, ordersAPI] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
        fetch('/api/orders').then(r => r.json())
      ])
      
      console.log('API endpoint results:')
      console.log(`- Products API: ${Array.isArray(productsAPI) ? productsAPI.length : 'Error'}`)
      console.log(`- Categories API: ${Array.isArray(categoriesAPI) ? categoriesAPI.length : 'Error'}`)
      console.log(`- Orders API: ${Array.isArray(ordersAPI) ? ordersAPI.length : 'Error'}`)
      
      if (!Array.isArray(productsAPI)) {
        console.error('Products API error:', productsAPI)
      }
      if (!Array.isArray(categoriesAPI)) {
        console.error('Categories API error:', categoriesAPI)
      }
      if (!Array.isArray(ordersAPI)) {
        console.error('Orders API error:', ordersAPI)
      }
      
    } catch (apiError) {
      console.error('API test failed:', apiError)
    }
    
    // Step 3: Test dashboard service
    console.log('Step 3: Testing dashboard service...')
    
    try {
      const { dashboardService } = await import('./database')
      const stats = await dashboardService.getStats()
      console.log('Dashboard stats:', stats)
    } catch (serviceError) {
      console.error('Dashboard service error:', serviceError)
    }
    
    // Step 4: Sample data check
    console.log('Step 4: Sample data check...')
    
    if (categories && categories.length > 0) {
      console.log('Sample categories:')
      categories.slice(0, 3).forEach((cat: any) => {
        console.log(`- ${cat.name} (${cat.id})`)
      })
    }
    
    if (products && products.length > 0) {
      console.log('Sample products:')
      products.slice(0, 3).forEach((prod: any) => {
        console.log(`- ${prod.name} (${prod.id}) - Category: ${prod.category_id}`)
      })
    }
    
    // Step 5: Check for common issues
    console.log('Step 5: Checking for common issues...')
    
    const issues = []
    
    if (!locations || locations.length === 0) {
      issues.push('No locations found - sync may have failed')
    }
    
    if (!categories || categories.length === 0) {
      issues.push('No categories found - sync may have failed')
    }
    
    if (!products || products.length === 0) {
      issues.push('No products found - sync may have failed')
    }
    
    if (products && categories) {
      const categoryIds = new Set(categories.map((c: any) => c.id))
      const orphanedProducts = products.filter((p: any) => !categoryIds.has(p.category_id))
      if (orphanedProducts.length > 0) {
        issues.push(`${orphanedProducts.length} products have invalid category IDs`)
        console.log('Orphaned products:', orphanedProducts.map((p: any) => `${p.name} (category: ${p.category_id})`))
      }
    }
    
    if (issues.length > 0) {
      console.warn('Issues found:')
      issues.forEach(issue => console.warn(`- ${issue}`))
    } else {
      console.log('✅ No obvious issues found')
    }
    
    return {
      success: true,
      data: {
        locations: locations?.length || 0,
        categories: categories?.length || 0,
        products: products?.length || 0,
        orders: orders?.length || 0
      },
      issues,
      sampleData: {
        categories: categories?.slice(0, 3) || [],
        products: products?.slice(0, 3) || []
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Force refresh dashboard data
 */
export async function forceRefreshDashboard() {
  try {
    console.log('🔄 Force refreshing dashboard...')
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
      // Clear localStorage cache if any
      Object.keys(localStorage).forEach(key => {
        if (key.includes('dashboard') || key.includes('products') || key.includes('categories')) {
          localStorage.removeItem(key)
        }
      })
      
      // Force reload the page
      window.location.reload()
    }
    
    return { success: true, message: 'Dashboard refresh initiated' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Test specific API endpoint
 */
export async function testAPIEndpoint(endpoint: string) {
  try {
    console.log(`🧪 Testing API endpoint: ${endpoint}`)
    
    const response = await fetch(endpoint)
    const data = await response.json()
    
    console.log(`Response status: ${response.status}`)
    console.log(`Response data:`, data)
    
    return {
      success: response.ok,
      status: response.status,
      data,
      message: response.ok ? 'API endpoint working' : 'API endpoint failed'
    }
  } catch (error) {
    console.error(`API test failed for ${endpoint}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}