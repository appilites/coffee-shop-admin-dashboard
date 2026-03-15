import { getSupabaseBrowserClient } from "./supabase"

const supabase = getSupabaseBrowserClient()

/**
 * Admin Dashboard Data Sync Service
 * Ensures admin dashboard can manage the same data as the coffee shop
 */

export async function checkDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Database connection error:', error)
      return { connected: false, error: error.message }
    }

    return { connected: true, itemCount: data }
  } catch (error) {
    console.error('Database connection error:', error)
    return { connected: false, error: 'Failed to connect to database' }
  }
}

export async function getDashboardData() {
  try {
    // Get all data needed for dashboard
    const [
      { data: products, error: productsError },
      { data: categories, error: categoriesError },
      { data: orders, error: ordersError }
    ] = await Promise.all([
      supabase.from('menu_items').select('*').order('name'),
      supabase.from('menu_categories').select('*').order('display_order'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100)
    ])

    if (productsError) throw productsError
    if (categoriesError) throw categoriesError
    if (ordersError) throw ordersError

    return {
      products: products || [],
      categories: categories || [],
      orders: orders || [],
      success: true
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      products: [],
      categories: [],
      orders: [],
      success: false,
      error
    }
  }
}

/**
 * Real-time subscriptions for admin dashboard
 */
export function subscribeToOrders(callback: (payload: any) => void) {
  return supabase
    .channel('orders_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, 
      (payload: any) => {
        console.log('Order change detected:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export function subscribeToProducts(callback: (payload: any) => void) {
  return supabase
    .channel('products_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'menu_items' }, 
      (payload: any) => {
        console.log('Product change detected:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export function subscribeToCategories(callback: (payload: any) => void) {
  return supabase
    .channel('categories_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'menu_categories' }, 
      (payload: any) => {
        console.log('Category change detected:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

/**
 * Subscribe to all changes for real-time dashboard updates
 */
export function subscribeToAllChanges(callbacks: {
  onOrderChange?: (payload: any) => void
  onProductChange?: (payload: any) => void
  onCategoryChange?: (payload: any) => void
}) {
  const subscriptions: any[] = []

  if (callbacks.onOrderChange) {
    subscriptions.push(subscribeToOrders(callbacks.onOrderChange))
  }

  if (callbacks.onProductChange) {
    subscriptions.push(subscribeToProducts(callbacks.onProductChange))
  }

  if (callbacks.onCategoryChange) {
    subscriptions.push(subscribeToCategories(callbacks.onCategoryChange))
  }

  // Return cleanup function
  return () => {
    subscriptions.forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe()
      }
    })
  }
}