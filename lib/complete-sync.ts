import { getSupabaseBrowserClient } from "./supabase"
import { mockCategories, mockProducts, mockOrders } from "../data/mock-data"

/**
 * Complete sync of all coffee shop data to admin dashboard
 * This syncs locations, categories, products, and creates sample orders
 * Fixed to handle foreign key constraints properly
 */
export async function completeSync() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🚀 Starting complete coffee shop sync...')
    
    // Step 1: Verify database connection and tables
    console.log('Step 1: Verifying database connection...')
    const { error: connectionError } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
    
    if (connectionError) {
      return {
        success: false,
        error: `Database connection failed: ${connectionError.message}. Please create tables first.`
      }
    }
    
    // Step 2: Clear existing data in correct order (to avoid foreign key violations)
    console.log('Step 2: Clearing existing data in correct order...')
    
    // Delete in reverse dependency order
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('menu_items').delete().neq('id', 'dummy')
    await supabase.from('menu_categories').delete().neq('id', 'dummy')
    await supabase.from('locations').delete().neq('id', 'dummy')
    console.log('✅ Existing data cleared')

    // Step 3: Sync Locations FIRST (no dependencies)
    // Step 3: Sync locations (using mock data for now)
    console.log('Step 3: Creating sample locations...')
    const sampleLocations = [
      { id: 'loc-1', name: 'Main Street', address: '123 Main St' },
      { id: 'loc-2', name: 'Downtown', address: '456 Downtown Ave' },
      { id: 'loc-3', name: 'Mall Location', address: '789 Mall Blvd' }
    ]
    
    let syncedLocations = 0
    for (const location of sampleLocations) {
      const { error } = await supabase
        .from('locations')
        .insert(location)
      
      if (error) {
        console.error('Error syncing location:', location.name, error)
        return {
          success: false,
          error: `Failed to sync location "${location.name}": ${error.message}`
        }
      }
      syncedLocations++
      console.log(`✅ Location synced: ${location.name}`)
    }

    // Step 4: Sync Categories (simplified for mock data)
    console.log('Step 4: Syncing categories...')
    
    let syncedCategories = 0
    
    console.log(`Syncing ${mockCategories.length} categories...`)
    for (const category of mockCategories) {
      const { error } = await supabase
        .from('menu_categories')
        .insert({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: 1,
          is_active: category.isActive,
          parent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error syncing category:', category.name, error)
        return {
          success: false,
          error: `Failed to sync category "${category.name}": ${error.message}`
        }
      }
      syncedCategories++
      console.log(`✅ Category synced: ${category.name}`)
    }

    console.log(`✅ Categories synced: ${syncedCategories} total`)

    // Step 5: Verify all categories were inserted
    console.log('Step 5: Verifying categories...')
    const { data: existingCategories, error: categoryCheckError } = await supabase
      .from('menu_categories')
      .select('id')
    
    if (categoryCheckError) {
      return {
        success: false,
        error: `Failed to verify categories: ${categoryCheckError.message}`
      }
    }

    const existingCategoryIds = new Set(existingCategories?.map((c: any) => c.id) || [])
    console.log(`✅ Verified ${existingCategoryIds.size} categories in database`)

    // Step 6: Sync Menu Items LAST (depends on categories)
    console.log('Step 6: Syncing menu items...')
    let syncedProducts = 0
    let skippedProducts = 0
    
    for (const item of mockProducts) {
      // Verify category exists before inserting menu item
      if (!existingCategoryIds.has(item.categoryId)) {
        console.warn(`Skipping menu item "${item.name}" - category "${item.categoryId}" not found`)
        skippedProducts++
        continue
      }

      const { error } = await supabase
        .from('menu_items')
        .insert({
          id: item.id,
          category_id: item.categoryId,
          name: item.name,
          description: item.description,
          base_price: item.price,
          image_url: item.imageUrl,
          is_available: item.isAvailable,
          is_featured: item.isFeatured,
          prep_time_minutes: 5, // Default value since not in mock data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        console.error('Error syncing menu item:', item.name, error)
        // Don't fail completely, just skip this item
        skippedProducts++
        continue
      }
      syncedProducts++
      
      // Log progress every 10 items
      if (syncedProducts % 10 === 0) {
        console.log(`✅ Synced ${syncedProducts} products so far...`)
      }
    }

    console.log(`✅ Menu items sync completed: ${syncedProducts} synced, ${skippedProducts} skipped`)

    // Step 7: Create Sample Orders (depends on locations and menu items)
    console.log('Step 7: Creating sample orders...')
    const sampleOrders = [
      {
        order_number: `ORD-${Date.now()}-001`,
        customer_name: 'Sarah Johnson',
        customer_email: 'sarah@example.com',
        customer_phone: '555-0123',
        total_amount: 23.95,
        tax_amount: 1.92,
        status: 'completed',
        payment_status: 'paid',
        location_id: sampleLocations[0].id,
        is_guest_order: false,
        special_instructions: 'Extra hot, no foam'
      },
      {
        order_number: `ORD-${Date.now()}-002`,
        customer_name: 'Mike Chen',
        customer_email: 'mike@example.com',
        customer_phone: '555-0456',
        total_amount: 15.99,
        tax_amount: 1.28,
        status: 'preparing',
        payment_status: 'paid',
        location_id: sampleLocations[1].id,
        is_guest_order: true,
        special_instructions: null
      },
      {
        order_number: `ORD-${Date.now()}-003`,
        customer_name: 'Emma Davis',
        customer_email: 'emma@example.com',
        customer_phone: '555-0789',
        total_amount: 31.50,
        tax_amount: 2.52,
        status: 'pending',
        payment_status: 'pending',
        location_id: sampleLocations[2].id,
        is_guest_order: false,
        special_instructions: 'Pickup at 3 PM'
      }
    ]

    let syncedOrders = 0
    for (const orderData of sampleOrders) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()
      
      if (orderError) {
        console.error('Error creating sample order:', orderError)
        continue
      }

      // Add order items (only use products that were successfully synced)
      const availableProducts = mockProducts.filter(item => 
        existingCategoryIds.has(item.categoryId)
      )
      
      if (availableProducts.length > 0) {
        const randomProducts = availableProducts
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 items per order

        for (const product of randomProducts) {
          const quantity = Math.floor(Math.random() * 2) + 1 // 1-2 quantity
          const { error: itemError } = await supabase
            .from('order_items')
            .insert({
              order_id: order.id,
              menu_item_id: product.id,
              item_name: product.name,
              quantity,
              unit_price: product.price,
              total_price: product.price * quantity,
              customizations: []
            })
          
          if (itemError) {
            console.warn('Error adding order item:', itemError)
          }
        }
      }

      syncedOrders++
      console.log(`✅ Sample order created: ${orderData.order_number}`)
    }

    // Step 8: Final verification
    console.log('Step 8: Final verification...')
    const [
      { count: finalLocations },
      { count: finalCategories },
      { count: finalProducts },
      { count: finalOrders }
    ] = await Promise.all([
      supabase.from('locations').select('*', { count: 'exact', head: true }),
      supabase.from('menu_categories').select('*', { count: 'exact', head: true }),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ])

    console.log('🎉 Complete sync finished!')
    console.log(`Final counts: ${finalLocations} locations, ${finalCategories} categories, ${finalProducts} products, ${finalOrders} orders`)

    const message = `Complete sync successful! Synced ${finalLocations} locations, ${finalCategories} categories, ${finalProducts} products, and created ${syncedOrders} sample orders.${skippedProducts > 0 ? ` (${skippedProducts} products skipped due to missing categories)` : ''}`

    return {
      success: true,
      message,
      stats: {
        locations: finalLocations || 0,
        categories: finalCategories || 0,
        products: finalProducts || 0,
        orders: finalOrders || 0,
        skippedProducts
      }
    }

  } catch (error) {
    console.error('Complete sync error:', error)
    return {
      success: false,
      error: `Complete sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Quick status check of all data
 */
export async function checkSyncStatus() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    const [
      { count: locations },
      { count: categories },
      { count: products },
      { count: orders }
    ] = await Promise.all([
      supabase.from('locations').select('*', { count: 'exact', head: true }),
      supabase.from('menu_categories').select('*', { count: 'exact', head: true }),
      supabase.from('menu_items').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true })
    ])

    return {
      success: true,
      counts: {
        locations: locations || 0,
        categories: categories || 0,
        products: products || 0,
        orders: orders || 0
      },
      isEmpty: (locations || 0) === 0 && (categories || 0) === 0 && (products || 0) === 0,
      hasData: (products || 0) > 0 && (categories || 0) > 0
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}