import { getSupabaseBrowserClient } from "./supabase"
import { mockCategories, mockMenuItems, mockLocations } from "../../lib/mock-data"

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
    console.log('Step 3: Syncing locations...')
    let syncedLocations = 0
    for (const location of mockLocations) {
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

    // Step 4: Sync Categories in correct order (parents first, then children)
    console.log('Step 4: Syncing categories in hierarchical order...')
    
    // First, sync all parent categories (no parent_id)
    const parentCategories = mockCategories.filter(c => !c.parent_id)
    let syncedParentCategories = 0
    
    console.log(`Syncing ${parentCategories.length} parent categories...`)
    for (const category of parentCategories) {
      const { error } = await supabase
        .from('menu_categories')
        .insert({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active,
          parent_id: null, // Explicitly set to null for parent categories
          created_at: category.created_at,
          updated_at: category.updated_at
        })
      
      if (error) {
        console.error('Error syncing parent category:', category.name, error)
        return {
          success: false,
          error: `Failed to sync parent category "${category.name}": ${error.message}`
        }
      }
      syncedParentCategories++
      console.log(`✅ Parent category synced: ${category.name}`)
    }

    // Then, sync all child categories (with parent_id)
    const childCategories = mockCategories.filter(c => c.parent_id)
    let syncedChildCategories = 0
    
    console.log(`Syncing ${childCategories.length} child categories...`)
    for (const category of childCategories) {
      // Verify parent exists before inserting child
      const { data: parentExists } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('id', category.parent_id)
        .single()
      
      if (!parentExists) {
        console.warn(`Skipping child category "${category.name}" - parent "${category.parent_id}" not found`)
        continue
      }
      
      const { error } = await supabase
        .from('menu_categories')
        .insert({
          id: category.id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active,
          parent_id: category.parent_id,
          created_at: category.created_at,
          updated_at: category.updated_at
        })
      
      if (error) {
        console.error('Error syncing child category:', category.name, error)
        return {
          success: false,
          error: `Failed to sync child category "${category.name}": ${error.message}`
        }
      }
      syncedChildCategories++
      console.log(`✅ Child category synced: ${category.name}`)
    }

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
    
    for (const item of mockMenuItems) {
      // Verify category exists before inserting menu item
      if (!existingCategoryIds.has(item.category_id)) {
        console.warn(`Skipping menu item "${item.name}" - category "${item.category_id}" not found`)
        skippedProducts++
        continue
      }

      const { error } = await supabase
        .from('menu_items')
        .insert({
          id: item.id,
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          base_price: item.base_price,
          image_url: item.image_url,
          is_available: item.is_available,
          is_featured: item.is_featured,
          prep_time_minutes: item.prep_time_minutes,
          created_at: item.created_at,
          updated_at: item.updated_at
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
        location_id: mockLocations[0].id,
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
        location_id: mockLocations[1].id,
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
        location_id: mockLocations[2].id,
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
      const availableProducts = mockMenuItems.filter(item => 
        existingCategoryIds.has(item.category_id)
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
              unit_price: product.base_price,
              total_price: product.base_price * quantity,
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