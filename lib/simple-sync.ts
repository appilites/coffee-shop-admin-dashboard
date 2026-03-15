import { getSupabaseBrowserClient } from "./supabase"

/**
 * Simple database sync with minimal data for testing
 * This adds just a few items to test the system works
 */
export async function simpleDatabaseSync() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔵 Starting simple database sync...')
    
    // Step 1: Test connection
    console.log('Step 1: Testing connection...')
    const { error: connectionError } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
    
    if (connectionError) {
      return {
        success: false,
        error: `Database connection failed: ${connectionError.message}. Please create tables first.`
      }
    }
    
    // Step 2: Clear existing data
    console.log('Step 2: Clearing existing data...')
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('menu_items').delete().neq('id', 'dummy')
    await supabase.from('menu_categories').delete().neq('id', 'dummy')
    await supabase.from('locations').delete().neq('id', 'dummy')
    
    // Step 3: Add 2 locations
    console.log('Step 3: Adding locations...')
    const locations = [
      {
        id: "loc-1",
        name: "Druids Nutrition - Downtown",
        address: "123 Main Street",
        city: "San Francisco",
        state: "CA",
        zip_code: "94102",
        phone: "(415) 555-0123",
        is_active: true,
        opening_time: "06:00",
        closing_time: "20:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "loc-2",
        name: "Druids Nutrition - Marina",
        address: "456 Bay Street",
        city: "San Francisco",
        state: "CA",
        zip_code: "94123",
        phone: "(415) 555-0456",
        is_active: true,
        opening_time: "07:00",
        closing_time: "19:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
    
    for (const location of locations) {
      const { error } = await supabase.from('locations').insert(location)
      if (error) {
        return { success: false, error: `Failed to add location: ${error.message}` }
      }
      console.log(`✅ Added location: ${location.name}`)
    }
    
    // Step 4: Add 4 categories (2 parent, 2 child)
    console.log('Step 4: Adding categories...')
    const categories = [
      // Parent categories
      {
        id: "cat-1",
        name: "Meal Replacement Shakes",
        description: "LOW CARB • LOW SUGAR • 24G PROTEIN • 200-250 CALORIES",
        display_order: 1,
        is_active: true,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-loaded-tea",
        name: "Loaded Tea",
        description: "Teas are a combination of natural caffeine, B vitamins, tea grains, and aloe vera to make a highly caffeinated, sugar-free energy drink.",
        display_order: 2,
        is_active: true,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // Child categories
      {
        id: "cat-2",
        name: "Berry",
        description: "Teas are a combination of natural caffeine, B vitamins, tea grains, and aloe vera to make a highly caffeinated, sugar-free energy drink.",
        display_order: 1,
        is_active: true,
        parent_id: "cat-loaded-tea",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "cat-coffee-bar",
        name: "Coffee Bar",
        description: "Premium coffee and tea beverages. All sweetened with monk fruit - no sugar added.",
        display_order: 3,
        is_active: true,
        parent_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
    
    // Insert parent categories first
    const parentCategories = categories.filter(c => !c.parent_id)
    for (const category of parentCategories) {
      const { error } = await supabase.from('menu_categories').insert(category)
      if (error) {
        return { success: false, error: `Failed to add parent category: ${error.message}` }
      }
      console.log(`✅ Added parent category: ${category.name}`)
    }
    
    // Then insert child categories
    const childCategories = categories.filter(c => c.parent_id)
    for (const category of childCategories) {
      const { error } = await supabase.from('menu_categories').insert(category)
      if (error) {
        return { success: false, error: `Failed to add child category: ${error.message}` }
      }
      console.log(`✅ Added child category: ${category.name}`)
    }
    
    // Step 5: Add 6 products
    console.log('Step 5: Adding products...')
    const products = [
      {
        id: "item-1",
        category_id: "cat-1",
        name: "Apple Pie",
        description: "Low carb, low sugar, 24g protein, 200-250 calories",
        base_price: 7.95,
        image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-2",
        category_id: "cat-1",
        name: "Chocolate Chip Cookie Dough",
        description: "Low carb, low sugar, 24g protein, 200-250 calories",
        base_price: 7.95,
        image_url: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-76",
        category_id: "cat-2",
        name: "Airhead Extreme",
        description: "175-200mg caffeine, 4 carbs, 24 calories, 0 sugar",
        base_price: 6.95,
        image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-77",
        category_id: "cat-2",
        name: "Beach Please",
        description: "175-200mg caffeine, 4 carbs, 24 calories, 0 sugar",
        base_price: 6.95,
        image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: false,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-316",
        category_id: "cat-coffee-bar",
        name: "Iced Latte",
        description: "Espresso with milk over ice, sweetened with monk fruit",
        base_price: 5.95,
        image_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-323",
        category_id: "cat-coffee-bar",
        name: "Hot Latte",
        description: "Espresso with steamed milk, sweetened with monk fruit",
        base_price: 5.95,
        image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
    
    for (const product of products) {
      const { error } = await supabase.from('menu_items').insert(product)
      if (error) {
        return { success: false, error: `Failed to add product: ${error.message}` }
      }
      console.log(`✅ Added product: ${product.name}`)
    }
    
    // Step 6: Add 1 sample order
    console.log('Step 6: Adding sample order...')
    const orderData = {
      order_number: `ORD-${Date.now()}-SIMPLE`,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '555-0123',
      total_amount: 15.90,
      tax_amount: 1.27,
      status: 'completed',
      payment_status: 'paid',
      location_id: locations[0].id,
      is_guest_order: false,
      special_instructions: 'Simple sync test order'
    }
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    
    if (orderError) {
      console.warn('Could not create sample order:', orderError)
    } else {
      // Add 2 order items
      const orderItems = [
        {
          order_id: order.id,
          menu_item_id: products[0].id,
          item_name: products[0].name,
          quantity: 1,
          unit_price: products[0].base_price,
          total_price: products[0].base_price,
          customizations: []
        },
        {
          order_id: order.id,
          menu_item_id: products[4].id,
          item_name: products[4].name,
          quantity: 1,
          unit_price: products[4].base_price,
          total_price: products[4].base_price,
          customizations: []
        }
      ]
      
      for (const item of orderItems) {
        const { error: itemError } = await supabase.from('order_items').insert(item)
        if (itemError) {
          console.warn('Could not add order item:', itemError)
        }
      }
      
      console.log(`✅ Added sample order: ${orderData.order_number}`)
    }
    
    // Step 7: Verify results
    console.log('Step 7: Verifying results...')
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
    
    console.log('🎉 Simple sync completed!')
    console.log(`Results: ${finalLocations} locations, ${finalCategories} categories, ${finalProducts} products, ${finalOrders} orders`)
    
    return {
      success: true,
      message: `Simple sync successful! Added ${finalLocations} locations, ${finalCategories} categories, ${finalProducts} products, and ${finalOrders} orders.`,
      stats: {
        locations: finalLocations || 0,
        categories: finalCategories || 0,
        products: finalProducts || 0,
        orders: finalOrders || 0
      }
    }
    
  } catch (error) {
    console.error('Simple sync error:', error)
    return {
      success: false,
      error: `Simple sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Add more products after simple sync works
 */
export async function addMoreProducts() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('➕ Adding more products...')
    
    // Check if we have the basic categories
    const { data: categories } = await supabase
      .from('menu_categories')
      .select('id')
      .in('id', ['cat-1', 'cat-2', 'cat-coffee-bar'])
    
    if (!categories || categories.length < 3) {
      return {
        success: false,
        error: 'Please run Simple Sync first to create the basic categories'
      }
    }
    
    // Add 4 more products
    const moreProducts = [
      {
        id: "item-3",
        category_id: "cat-1",
        name: "Strawberry Cheesecake",
        description: "Low carb, low sugar, 24g protein, 200-250 calories",
        base_price: 7.95,
        image_url: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: true,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-78",
        category_id: "cat-2",
        name: "Berry Blue",
        description: "175-200mg caffeine, 4 carbs, 24 calories, 0 sugar",
        base_price: 6.95,
        image_url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: false,
        prep_time_minutes: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-317",
        category_id: "cat-coffee-bar",
        name: "Iced Americano",
        description: "Espresso shots over ice, sweetened with monk fruit",
        base_price: 4.95,
        image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: false,
        prep_time_minutes: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "item-324",
        category_id: "cat-coffee-bar",
        name: "Hot Americano",
        description: "Espresso shots with hot water, sweetened with monk fruit",
        base_price: 4.95,
        image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&crop=center",
        is_available: true,
        is_featured: false,
        prep_time_minutes: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ]
    
    let added = 0
    for (const product of moreProducts) {
      const { error } = await supabase.from('menu_items').insert(product)
      if (error) {
        console.warn(`Could not add product ${product.name}:`, error)
      } else {
        added++
        console.log(`✅ Added product: ${product.name}`)
      }
    }
    
    return {
      success: true,
      message: `Successfully added ${added} more products!`,
      count: added
    }
    
  } catch (error) {
    console.error('Add more products error:', error)
    return {
      success: false,
      error: `Failed to add more products: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}