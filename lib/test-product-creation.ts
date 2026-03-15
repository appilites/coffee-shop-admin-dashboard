import { getSupabaseBrowserClient } from "./supabase"

/**
 * Test product creation to debug the 500 error
 */
export async function testProductCreation() {
  const supabase = getSupabaseBrowserClient()
  
  try {
    console.log('🔍 Testing product creation...')
    
    // Test 1: Check database connection
    console.log('Step 1: Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('menu_items')
      .select('id', { count: 'exact', head: true })
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError)
      return { success: false, error: 'Database connection failed', details: connectionError }
    }
    console.log('✅ Database connection successful')
    
    // Test 2: Check if categories exist
    console.log('Step 2: Checking categories...')
    const { data: categories, error: categoryError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .limit(5)
    
    if (categoryError) {
      console.error('❌ Categories check failed:', categoryError)
      return { success: false, error: 'Categories check failed', details: categoryError }
    }
    
    if (!categories || categories.length === 0) {
      console.error('❌ No categories found')
      return { success: false, error: 'No categories found - sync data first' }
    }
    
    console.log(`✅ Found ${categories.length} categories`)
    
    // Test 3: Try to create a simple product
    console.log('Step 3: Creating test product...')
    const testProduct = {
      id: `test-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Product ${Date.now()}`,
      description: 'Test product for debugging',
      base_price: 9.99,
      category_id: categories[0].id,
      image_url: null,
      is_available: true,
      is_featured: false,
      prep_time_minutes: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('Test product data:', testProduct)
    
    const { data: product, error: productError } = await supabase
      .from('menu_items')
      .insert(testProduct)
      .select()
      .single()
    
    if (productError) {
      console.error('❌ Product creation failed:', productError)
      return { success: false, error: 'Product creation failed', details: productError }
    }
    
    console.log('✅ Test product created successfully:', product)
    
    // Test 4: Clean up - delete the test product
    console.log('Step 4: Cleaning up test product...')
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', product.id)
    
    if (deleteError) {
      console.warn('⚠️ Failed to clean up test product:', deleteError)
    } else {
      console.log('✅ Test product cleaned up')
    }
    
    return {
      success: true,
      message: 'Product creation test passed',
      testProduct: product
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error)
    return {
      success: false,
      error: 'Test failed with exception',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test the complete product creation flow through the service
 */
export async function testProductService() {
  try {
    console.log('🔍 Testing product service...')
    
    const { productService } = await import('./database')
    
    const testProductData = {
      name: `Service Test Product ${Date.now()}`,
      description: 'Test product via service',
      price: 12.99,
      categoryId: 'cat-1', // Assuming this category exists
      imageUrl: undefined,
      isAvailable: true,
      isFeatured: false,
      variations: []
    }
    
    console.log('Creating product via service:', testProductData)
    
    const product = await productService.create(testProductData)
    console.log('✅ Product created via service:', product)
    
    // Clean up
    await productService.delete(product.id)
    console.log('✅ Test product cleaned up')
    
    return {
      success: true,
      message: 'Product service test passed',
      product
    }
    
  } catch (error) {
    console.error('❌ Product service test failed:', error)
    return {
      success: false,
      error: 'Product service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}