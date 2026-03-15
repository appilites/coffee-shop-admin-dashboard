import { getSupabaseBrowserClient } from "./supabase"
import { mockCategories, mockMenuItems } from "../../lib/mock-data"

/**
 * Initialize database with coffee shop data
 * This syncs all the coffee shop products and categories to Supabase
 * and removes any data that doesn't exist in the coffee shop
 */
export async function initializeDatabase() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('Initializing database with coffee shop data...')

    // First, check if tables exist
    console.log('Checking if tables exist...')
    const { data: tablesCheck, error: tablesError } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
    
    if (tablesError) {
      console.error('Tables check failed:', tablesError)
      return {
        success: false,
        error: `Database tables not found. Please create tables first. Error: ${tablesError.message}`
      }
    }

    // 1. Insert Categories FIRST (in correct order - parents first)
    console.log('Step 1: Syncing categories (parents first)...')
    
    // First sync parent categories (no parent_id)
    const parentCategories = mockCategories.filter(c => !c.parent_id)
    console.log(`Syncing ${parentCategories.length} parent categories...`)
    
    for (const category of parentCategories) {
      const categoryData = {
        id: category.id,
        name: category.name,
        description: category.description,
        display_order: category.display_order,
        is_active: category.is_active,
        parent_id: category.parent_id,
        created_at: category.created_at,
        updated_at: category.updated_at
      }

      const { error } = await supabase
        .from('menu_categories')
        .upsert(categoryData, { onConflict: 'id' })
      
      if (error) {
        console.error('Error inserting parent category:', category.name, error)
        return {
          success: false,
          error: `Failed to sync parent category "${category.name}": ${error.message}`
        }
      } else {
        console.log('✅ Parent category synced:', category.name)
      }
    }

    // Then sync child categories (with parent_id)
    const childCategories = mockCategories.filter(c => c.parent_id)
    console.log(`Syncing ${childCategories.length} child categories...`)
    
    for (const category of childCategories) {
      const categoryData = {
        id: category.id,
        name: category.name,
        description: category.description,
        display_order: category.display_order,
        is_active: category.is_active,
        parent_id: category.parent_id,
        created_at: category.created_at,
        updated_at: category.updated_at
      }

      const { error } = await supabase
        .from('menu_categories')
        .upsert(categoryData, { onConflict: 'id' })
      
      if (error) {
        console.error('Error inserting child category:', category.name, error)
        return {
          success: false,
          error: `Failed to sync child category "${category.name}": ${error.message}`
        }
      } else {
        console.log('✅ Child category synced:', category.name)
      }
    }

    // 3. Verify categories exist before inserting menu items
    console.log('Step 2: Verifying categories exist...')
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
    console.log(`Found ${existingCategoryIds.size} categories in database`)

    // 4. Insert Menu Items LAST (only for existing categories)
    console.log('Step 3: Syncing menu items...')
    let syncedItems = 0
    let skippedItems = 0
    
    for (const item of mockMenuItems) {
      // Check if category exists
      if (!existingCategoryIds.has(item.category_id)) {
        console.warn(`Skipping item "${item.name}" - category "${item.category_id}" not found`)
        skippedItems++
        continue
      }

      const itemData = {
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
      }

      try {
        const { error } = await supabase
          .from('menu_items')
          .upsert(itemData, { onConflict: 'id' })
        
        if (error) {
          console.error(`Error inserting menu item: "${item.name}"`, error)
          // Continue with other items instead of failing completely
          skippedItems++
        } else {
          syncedItems++
          console.log('✅ Menu item synced:', item.name)
        }
      } catch (err) {
        console.error(`Failed to sync menu item "${item.name}":`, err)
        skippedItems++
      }
    }

    // 4. Clean up orphaned data
    console.log('Step 4: Cleaning up orphaned data...')
    
    // Clean up categories not in coffee shop
    const coffeeShopCategoryIds = mockCategories.map(c => c.id)
    if (coffeeShopCategoryIds.length > 0) {
      const { error: deleteCategoriesError } = await supabase
        .from('menu_categories')
        .delete()
        .not('id', 'in', `(${coffeeShopCategoryIds.map(id => `'${id}'`).join(',')})`)
      
      if (deleteCategoriesError) {
        console.warn('Warning cleaning up categories:', deleteCategoriesError)
      } else {
        console.log('✅ Cleaned up categories not in coffee shop')
      }
    }

    // Clean up menu items not in coffee shop
    const coffeeShopItemIds = mockMenuItems.map(i => i.id)
    if (coffeeShopItemIds.length > 0) {
      const { error: deleteItemsError } = await supabase
        .from('menu_items')
        .delete()
        .not('id', 'in', `(${coffeeShopItemIds.map(id => `'${id}'`).join(',')})`)
      
      if (deleteItemsError) {
        console.warn('Warning cleaning up menu items:', deleteItemsError)
      } else {
        console.log('✅ Cleaned up menu items not in coffee shop')
      }
    }

    console.log('🎉 Coffee shop data sync completed!')
    console.log(`Synced ${mockCategories.length} categories, ${syncedItems} menu items`)
    
    if (skippedItems > 0) {
      console.warn(`⚠️ Skipped ${skippedItems} menu items due to errors or missing categories`)
    }

    // Final verification
    console.log('Step 5: Final verification...')
    const { count: finalProductCount } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
    
    const { count: finalCategoryCount } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })

    console.log(`Final counts: ${finalCategoryCount} categories, ${finalProductCount} products`)
    
    return { 
      success: true, 
      message: `Successfully synced ${mockCategories.length} categories and ${syncedItems} menu items. ${skippedItems > 0 ? `Skipped ${skippedItems} items with errors.` : 'Removed any items not in coffee shop.'} Final database has ${finalCategoryCount} categories and ${finalProductCount} products.`,
      stats: {
        categories: mockCategories.length,
        menuItems: syncedItems,
        skippedItems,
        finalCategoryCount: finalCategoryCount || 0,
        finalProductCount: finalProductCount || 0
      }
    }

  } catch (error) {
    console.error('Error syncing coffee shop data:', error)
    return { 
      success: false, 
      error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * Check if database needs initialization
 */
export async function checkDatabaseStatus() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    const { count: categoryCount } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })

    const { count: productCount } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })

    return {
      categories: categoryCount || 0,
      products: productCount || 0,
      isEmpty: (categoryCount || 0) === 0 && (productCount || 0) === 0,
      needsSync: (categoryCount || 0) < mockCategories.length || (productCount || 0) < mockMenuItems.length
    }
  } catch (error) {
    console.error('Error checking database status:', error)
    return {
      categories: 0,
      products: 0,
      isEmpty: true,
      needsSync: true,
      error
    }
  }
}

/**
 * Sync specific data types with cleanup
 */
export async function syncCategories() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('Syncing categories only...')
    
    // Insert/update coffee shop categories
    for (const category of mockCategories) {
      const categoryData = {
        id: category.id,
        name: category.name,
        description: category.description,
        display_order: category.display_order,
        is_active: category.is_active,
        parent_id: category.parent_id,
        created_at: category.created_at,
        updated_at: category.updated_at
      }

      const { error } = await supabase
        .from('menu_categories')
        .upsert(categoryData, { onConflict: 'id' })
      
      if (error) {
        console.error('Error syncing category:', category.name, error)
      }
    }

    // Clean up categories not in coffee shop
    const coffeeShopCategoryIds = mockCategories.map(c => c.id)
    const { error: deleteError } = await supabase
      .from('menu_categories')
      .delete()
      .not('id', 'in', `(${coffeeShopCategoryIds.map(id => `'${id}'`).join(',')})`)
    
    if (deleteError) {
      console.warn('Warning cleaning up categories:', deleteError)
    }

    return { success: true, count: mockCategories.length }
  } catch (error) {
    console.error('Error syncing categories:', error)
    return { success: false, error }
  }
}

export async function syncMenuItems() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('Syncing menu items only...')
    
    // Insert/update coffee shop menu items
    for (const item of mockMenuItems) {
      const itemData = {
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
      }

      const { error } = await supabase
        .from('menu_items')
        .upsert(itemData, { onConflict: 'id' })
      
      if (error) {
        console.error('Error syncing menu item:', item.name, error)
      }
    }

    // Clean up menu items not in coffee shop
    const coffeeShopItemIds = mockMenuItems.map(i => i.id)
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .not('id', 'in', `(${coffeeShopItemIds.map(id => `'${id}'`).join(',')})`)
    
    if (deleteError) {
      console.warn('Warning cleaning up menu items:', deleteError)
    }

    return { success: true, count: mockMenuItems.length }
  } catch (error) {
    console.error('Error syncing menu items:', error)
    return { success: false, error }
  }
}

/**
 * Update product images only - sync image URLs from coffee shop data
 */
export async function updateProductImages() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🖼️ Updating product images...')
    
    let updatedCount = 0
    
    // Update each menu item with new image URL
    for (const item of mockMenuItems) {
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          image_url: item.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
      
      if (error) {
        console.error('Error updating image for:', item.name, error)
      } else {
        updatedCount++
        console.log('✅ Image updated for:', item.name)
      }
    }

    console.log(`🎉 Product images update completed! Updated ${updatedCount} products`)
    
    return { 
      success: true, 
      message: `Successfully updated images for ${updatedCount} products`,
      count: updatedCount
    }

  } catch (error) {
    console.error('Error updating product images:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
export async function cleanupOrphanedData() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🧹 Cleaning up orphaned data...')
    
    // Get coffee shop IDs
    const coffeeShopCategoryIds = mockCategories.map(c => c.id)
    const coffeeShopItemIds = mockMenuItems.map(i => i.id)

    // Count items before cleanup
    const { count: beforeCategories } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
    
    const { count: beforeItems } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })

    // Clean up categories
    const { error: deleteCategoriesError } = await supabase
      .from('menu_categories')
      .delete()
      .not('id', 'in', `(${coffeeShopCategoryIds.map(id => `'${id}'`).join(',')})`)

    // Clean up menu items
    const { error: deleteItemsError } = await supabase
      .from('menu_items')
      .delete()
      .not('id', 'in', `(${coffeeShopItemIds.map(id => `'${id}'`).join(',')})`)

    // Count items after cleanup
    const { count: afterCategories } = await supabase
      .from('menu_categories')
      .select('*', { count: 'exact', head: true })
    
    const { count: afterItems } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })

    const removedCategories = (beforeCategories || 0) - (afterCategories || 0)
    const removedItems = (beforeItems || 0) - (afterItems || 0)

    console.log(`✅ Cleanup completed:`)
    console.log(`  - Removed ${removedCategories} orphaned categories`)
    console.log(`  - Removed ${removedItems} orphaned menu items`)

    return {
      success: true,
      message: `Cleanup completed. Removed ${removedCategories} categories and ${removedItems} menu items not in coffee shop.`,
      removed: {
        categories: removedCategories,
        items: removedItems
      }
    }

  } catch (error) {
    console.error('Error cleaning up orphaned data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}