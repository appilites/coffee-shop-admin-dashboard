import { getSupabaseBrowserClient } from "./supabase"

/**
 * Test Supabase connection from admin dashboard
 */
export async function testAdminConnection() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('Testing admin dashboard Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('menu_items')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('Admin connection test failed:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Admin dashboard Supabase connection successful!')
    console.log(`Found ${data} menu items in database`)
    
    return { 
      success: true, 
      message: `Admin connected successfully. Found ${data} menu items.` 
    }
    
  } catch (error) {
    console.error('Admin connection test error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Test admin operations
 */
export async function testAdminOperations() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    // Test fetching categories
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .limit(5)
    
    if (catError) throw catError
    
    // Test fetching menu items
    const { data: items, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .limit(5)
    
    if (itemError) throw itemError
    
    // Test fetching orders
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
    
    if (orderError) throw orderError
    
    console.log('✅ Admin operations test successful!')
    console.log(`Categories: ${categories?.length || 0}`)
    console.log(`Menu Items: ${items?.length || 0}`)
    console.log(`Orders: ${orders?.length || 0}`)
    
    return {
      success: true,
      data: {
        categories: categories?.length || 0,
        menuItems: items?.length || 0,
        orders: orders?.length || 0
      }
    }
    
  } catch (error) {
    console.error('Admin operations test error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}