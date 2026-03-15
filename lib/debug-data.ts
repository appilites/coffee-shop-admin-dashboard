import { getSupabaseBrowserClient } from "./supabase"

/**
 * Debug function to check what data exists in the database
 */
export async function debugDatabaseData() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Debugging database data...')
    
    // Check locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
    
    console.log('Locations:', locations?.length || 0, locationsError ? `Error: ${locationsError.message}` : 'OK')
    
    // Check categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
    
    console.log('Categories:', categories?.length || 0, categoriesError ? `Error: ${categoriesError.message}` : 'OK')
    
    // Check menu items
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*')
    
    console.log('Menu Items:', menuItems?.length || 0, menuItemsError ? `Error: ${menuItemsError.message}` : 'OK')
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
    
    console.log('Orders:', orders?.length || 0, ordersError ? `Error: ${ordersError.message}` : 'OK')
    
    // Sample some data
    if (categories && categories.length > 0) {
      console.log('Sample categories:', categories.slice(0, 3).map((c: any) => ({ id: c.id, name: c.name })))
    }
    
    if (menuItems && menuItems.length > 0) {
      console.log('Sample menu items:', menuItems.slice(0, 3).map((i: any) => ({ id: i.id, name: i.name, category_id: i.category_id })))
    }
    
    return {
      success: true,
      data: {
        locations: locations?.length || 0,
        categories: categories?.length || 0,
        menuItems: menuItems?.length || 0,
        orders: orders?.length || 0
      },
      sampleData: {
        categories: categories?.slice(0, 3) || [],
        menuItems: menuItems?.slice(0, 3) || [],
        orders: orders?.slice(0, 3) || []
      }
    }
    
  } catch (error) {
    console.error('Debug data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test API routes
 */
export async function debugAPIRoutes() {
  try {
    console.log('🔍 Testing API routes...')
    
    // Test products API
    console.log('Testing /api/products...')
    const productsResponse = await fetch('/api/products')
    const productsData = productsResponse.ok ? await productsResponse.json() : null
    console.log('Products API:', productsResponse.status, productsData?.length || 0, 'items')
    
    if (!productsResponse.ok) {
      console.error('Products API Error:', await productsResponse.text())
    }
    
    // Test categories API
    console.log('Testing /api/categories...')
    const categoriesResponse = await fetch('/api/categories')
    const categoriesData = categoriesResponse.ok ? await categoriesResponse.json() : null
    console.log('Categories API:', categoriesResponse.status, categoriesData?.length || 0, 'items')
    
    if (!categoriesResponse.ok) {
      console.error('Categories API Error:', await categoriesResponse.text())
    }
    
    // Test orders API
    console.log('Testing /api/orders...')
    const ordersResponse = await fetch('/api/orders')
    const ordersData = ordersResponse.ok ? await ordersResponse.json() : null
    console.log('Orders API:', ordersResponse.status, ordersData?.length || 0, 'items')
    
    if (!ordersResponse.ok) {
      console.error('Orders API Error:', await ordersResponse.text())
    }
    
    // Sample some data if available
    if (productsData && productsData.length > 0) {
      console.log('Sample products:', productsData.slice(0, 2).map((p: any) => ({ 
        id: p.id, 
        name: p.name, 
        category_id: p.category_id,
        base_price: p.base_price 
      })))
    }
    
    if (categoriesData && categoriesData.length > 0) {
      console.log('Sample categories:', categoriesData.slice(0, 2).map((c: any) => ({ 
        id: c.id, 
        name: c.name,
        is_active: c.is_active 
      })))
    }
    
    return {
      success: true,
      apis: {
        products: {
          status: productsResponse.status,
          count: productsData?.length || 0,
          error: !productsResponse.ok ? `HTTP ${productsResponse.status}` : null,
          sampleData: productsData?.slice(0, 2) || []
        },
        categories: {
          status: categoriesResponse.status,
          count: categoriesData?.length || 0,
          error: !categoriesResponse.ok ? `HTTP ${categoriesResponse.status}` : null,
          sampleData: categoriesData?.slice(0, 2) || []
        },
        orders: {
          status: ordersResponse.status,
          count: ordersData?.length || 0,
          error: !ordersResponse.ok ? `HTTP ${ordersResponse.status}` : null,
          sampleData: ordersData?.slice(0, 2) || []
        }
      }
    }
    
  } catch (error) {
    console.error('API debug error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Create sample order for testing
 */
export async function createSampleOrder() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Creating sample order...')
    
    // First check if we have any menu items
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(1)
    
    if (menuItemsError || !menuItems || menuItems.length === 0) {
      return {
        success: false,
        error: 'No menu items found. Please sync products first.'
      }
    }
    
    // Check if we have any locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(1)
    
    if (locationsError || !locations || locations.length === 0) {
      return {
        success: false,
        error: 'No locations found. Please sync locations first.'
      }
    }
    
    const sampleOrder = {
      order_number: `ORD-${Date.now()}`,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0123',
      total_amount: 15.99,
      tax_amount: 1.28,
      status: 'pending',
      payment_status: 'pending',
      location_id: locations[0].id,
      is_guest_order: true,
      special_instructions: 'Test order for debugging'
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(sampleOrder)
      .select()
      .single()
    
    if (orderError) {
      return {
        success: false,
        error: `Failed to create order: ${orderError.message}`
      }
    }
    
    // Add order item
    const orderItem = {
      order_id: order.id,
      menu_item_id: menuItems[0].id,
      item_name: menuItems[0].name,
      quantity: 1,
      unit_price: menuItems[0].base_price,
      total_price: menuItems[0].base_price,
      customizations: []
    }
    
    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItem)
    
    if (itemError) {
      console.warn('Failed to create order item:', itemError.message)
    }
    
    return {
      success: true,
      message: 'Sample order created successfully',
      order
    }
    
  } catch (error) {
    console.error('Create sample order error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}