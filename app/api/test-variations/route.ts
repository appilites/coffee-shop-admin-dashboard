import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = getSupabaseAdminClient()
    
    console.log('🧪 Testing variations functionality...')

    // Create a test product with variations
    const testProduct = {
      id: crypto.randomUUID(),
      name: "Test Product with Variations",
      description: "This is a test product to verify variations work",
      base_price: 9.99,
      category_id: "test-category-id", // This might fail if category doesn't exist
      image_url: null,
      is_available: true,
      is_featured: false,
      prep_time_minutes: 5,
      variations: JSON.stringify([
        {
          id: "var-1",
          title: "Size",
          type: "radio",
          options: [
            { id: "opt-1", label: "Small", priceModifier: 0 },
            { id: "opt-2", label: "Large", priceModifier: 2.00 }
          ]
        },
        {
          id: "var-2", 
          title: "Add-ons",
          type: "checkbox",
          options: [
            { id: "opt-3", label: "Extra Shot", priceModifier: 0.50 },
            { id: "opt-4", label: "Whipped Cream", priceModifier: 0.75 }
          ]
        }
      ]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // First, let's check if we have any categories to use
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .limit(1)

    if (catError) {
      console.error('Error fetching categories:', catError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch categories',
        details: catError 
      }, { status: 500 })
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No categories found. Please create a category first.' 
      }, { status: 400 })
    }

    // Use the first available category
    testProduct.category_id = categories[0].id

    console.log('Creating test product:', testProduct)

    const { data: product, error } = await supabase
      .from('menu_items')
      .insert(testProduct)
      .select()
      .single()

    if (error) {
      console.error('Error creating test product:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create test product',
        details: error 
      }, { status: 500 })
    }

    console.log('✅ Test product created:', product)

    // Parse the variations back
    const parsedProduct = {
      ...product,
      variations: product.variations ? JSON.parse(product.variations) : []
    }

    return NextResponse.json({
      success: true,
      message: "Test product with variations created successfully",
      product: parsedProduct
    })

  } catch (error) {
    console.error('Error testing variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}