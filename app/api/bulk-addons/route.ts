import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - Fetch categories and their products for bulk addon management
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Get all categories with product counts
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select(`
        id,
        name,
        parent_id,
        parent:menu_categories!parent_id(id, name)
      `)
      .order('name')
    
    if (categoriesError) throw categoriesError
    
    // Get product counts for each category
    const { data: productCounts, error: countsError } = await supabase
      .from('menu_items')
      .select('category_id')
    
    if (countsError) throw countsError
    
    // Count products per category
    const countMap = productCounts?.reduce((acc: Record<string, number>, item) => {
      acc[item.category_id] = (acc[item.category_id] || 0) + 1
      return acc
    }, {}) || {}
    
    // Add product counts to categories
    const categoriesWithCounts = categories?.map(category => {
      // Handle parent as either object or array (Supabase can return either)
      const parent = Array.isArray(category.parent) ? category.parent[0] : category.parent
      const parentName = parent?.name || ''
      const categoryPath = parent ? `${parentName} > ${category.name}` : category.name
      
      return {
        ...category,
        productCount: countMap[category.id] || 0,
        categoryPath
      }
    }) || []
    
    return NextResponse.json({
      success: true,
      categories: categoriesWithCounts
    })
    
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Apply addons to selected categories
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { selectedCategories, addons } = body
    
    if (!selectedCategories || !Array.isArray(selectedCategories) || selectedCategories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please select at least one category'
      }, { status: 400 })
    }
    
    if (!addons || !Array.isArray(addons) || addons.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please provide at least one addon'
      }, { status: 400 })
    }
    
    const supabase = getSupabaseAdminClient()
    
    console.log('🔄 Applying addons to categories:', selectedCategories)
    console.log('📦 Addons to apply:', addons)
    
    // Get products from selected categories
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('id, name, category_id, variations')
      .in('category_id', selectedCategories)
    
    if (productsError) throw productsError
    
    console.log(`Found ${products?.length || 0} products to update`)
    
    // Create addon variation structure
    const addonVariation = {
      id: 'addons-variation',
      title: 'Add-ons',
      type: 'checkbox' as const,
      required: false,
      options: addons.map((addon: {name: string, price: number}, index: number) => ({
        id: `addon-opt-${index}`,
        label: addon.name.trim(),
        priceModifier: addon.price || 0.5
      }))
    }
    
    // Update products with addon variations
    const updatePromises = products?.map(async (product) => {
      try {
        // Get existing variations
        let existingVariations = Array.isArray(product.variations) ? product.variations : []
        
        // Remove any existing addon variations to avoid duplicates
        existingVariations = existingVariations.filter((v: any) => 
          v.id !== 'addons-variation' && 
          v.title !== 'Add-ons' &&
          !v.title?.toLowerCase().includes('addon')
        )
        
        // Add the new addon variation
        const updatedVariations = [...existingVariations, addonVariation]
        
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            variations: updatedVariations,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
          return { 
            productId: product.id, 
            productName: product.name,
            success: false, 
            error: updateError.message 
          }
        }
        
        return { 
          productId: product.id, 
          productName: product.name,
          success: true 
        }
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error)
        return { 
          productId: product.id, 
          productName: product.name,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }) || []
    
    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`✅ Updated ${successful.length} products successfully`)
    if (failed.length > 0) {
      console.warn(`⚠️ Failed to update ${failed.length} products`)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        selectedCategories,
        addonsApplied: addons,
        updateResults: {
          successful: successful.length,
          failed: failed.length,
          successfulProducts: successful.map(r => ({ id: r.productId, name: r.productName })),
          failedProducts: failed.map(r => ({ id: r.productId, name: r.productName, error: r.error }))
        },
        addonVariation
      }
    })
    
  } catch (error) {
    console.error('Error applying bulk addons:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove addons from selected categories
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoriesParam = searchParams.get('categories')
    
    if (!categoriesParam) {
      return NextResponse.json({
        success: false,
        error: 'Categories parameter is required'
      }, { status: 400 })
    }
    
    const selectedCategories = categoriesParam.split(',')
    const supabase = getSupabaseAdminClient()
    
    console.log('🗑️ Removing addons from categories:', selectedCategories)
    
    // Get products from selected categories
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('id, name, category_id, variations')
      .in('category_id', selectedCategories)
    
    if (productsError) throw productsError
    
    console.log(`Found ${products?.length || 0} products to update`)
    
    // Remove addon variations from products
    const updatePromises = products?.map(async (product) => {
      try {
        // Get existing variations and remove addon variations
        let existingVariations = Array.isArray(product.variations) ? product.variations : []
        
        // Remove addon variations
        const filteredVariations = existingVariations.filter((v: any) => 
          v.id !== 'addons-variation' && 
          v.title !== 'Add-ons' &&
          !v.title?.toLowerCase().includes('addon')
        )
        
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            variations: filteredVariations,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
          return { 
            productId: product.id, 
            productName: product.name,
            success: false, 
            error: updateError.message 
          }
        }
        
        return { 
          productId: product.id, 
          productName: product.name,
          success: true 
        }
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error)
        return { 
          productId: product.id, 
          productName: product.name,
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }) || []
    
    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`✅ Removed addons from ${successful.length} products successfully`)
    if (failed.length > 0) {
      console.warn(`⚠️ Failed to remove addons from ${failed.length} products`)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        selectedCategories,
        updateResults: {
          successful: successful.length,
          failed: failed.length,
          successfulProducts: successful.map(r => ({ id: r.productId, name: r.productName })),
          failedProducts: failed.map(r => ({ id: r.productId, name: r.productName, error: r.error }))
        }
      }
    })
    
  } catch (error) {
    console.error('Error removing bulk addons:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}