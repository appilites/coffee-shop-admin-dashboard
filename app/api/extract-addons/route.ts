import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    // Target categories ke names
    const targetCategories = [
      'Tea',
      'Beauty Drinks', 
      'Specialty Drinks',
      'Meal Replacement Shakes',
      'Kid Drinks'
    ]
    
    console.log('🔍 Extracting addons from categories:', targetCategories)
    
    // Get categories by name
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .in('name', targetCategories)
    
    if (categoriesError) {
      throw categoriesError
    }
    
    console.log('Found categories:', categories)
    
    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No matching categories found',
        searchedFor: targetCategories
      })
    }
    
    const categoryIds = categories.map(c => c.id)
    
    // Get products from these categories
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('id, name, description, category_id, variations')
      .in('category_id', categoryIds)
    
    if (productsError) {
      throw productsError
    }
    
    console.log(`Found ${products?.length || 0} products in target categories`)
    
    // Extract all addons from products
    const allAddons = new Set<string>()
    const productVariations: Array<{
      productId: string
      productName: string
      variationTitle: string
      options: Array<{ id: string; label: string; priceModifier: number }>
    }> = []
    
    products?.forEach(product => {
      // Check both description field (legacy) and variations column (new)
      let variations: any[] = []
      
      // First try variations column
      if (product.variations && Array.isArray(product.variations)) {
        variations = product.variations
      }
      // Fallback to description field parsing
      else if (product.description && product.description.includes('[VARIATIONS:')) {
        try {
          const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\](?:\[PRICES:|$)/s)
          if (variationsMatch) {
            variations = JSON.parse(variationsMatch[1].trim())
          }
        } catch (e) {
          console.warn(`Could not parse variations from description for ${product.name}:`, e)
        }
      }
      
      variations.forEach((variation: any) => {
        if (variation.title && variation.options) {
          // Add variation title as addon category
          allAddons.add(variation.title)
          
          // Add each option as individual addon
          variation.options.forEach((option: any) => {
            if (option.label) {
              allAddons.add(option.label)
            }
          })
          
          productVariations.push({
            productId: product.id,
            productName: product.name,
            variationTitle: variation.title,
            options: variation.options
          })
        }
      })
    })
    
    // Convert Set to Array and sort
    const uniqueAddons = Array.from(allAddons).sort()
    
    // Group addons by type for better organization
    const addonCategories = {
      sizes: uniqueAddons.filter((addon: string) => 
        addon.toLowerCase().includes('small') || 
        addon.toLowerCase().includes('medium') || 
        addon.toLowerCase().includes('large') ||
        addon.toLowerCase().includes('size')
      ),
      milkOptions: uniqueAddons.filter((addon: string) => 
        addon.toLowerCase().includes('milk') ||
        addon.toLowerCase().includes('almond') ||
        addon.toLowerCase().includes('oat') ||
        addon.toLowerCase().includes('soy')
      ),
      sweeteners: uniqueAddons.filter((addon: string) => 
        addon.toLowerCase().includes('sugar') ||
        addon.toLowerCase().includes('honey') ||
        addon.toLowerCase().includes('stevia') ||
        addon.toLowerCase().includes('sweet')
      ),
      extras: uniqueAddons.filter((addon: string) => 
        addon.toLowerCase().includes('extra') ||
        addon.toLowerCase().includes('shot') ||
        addon.toLowerCase().includes('cream') ||
        addon.toLowerCase().includes('syrup')
      ),
      other: uniqueAddons.filter((addon: string) => {
        const lower = addon.toLowerCase()
        return !lower.includes('small') && !lower.includes('medium') && !lower.includes('large') &&
               !lower.includes('milk') && !lower.includes('almond') && !lower.includes('oat') &&
               !lower.includes('sugar') && !lower.includes('honey') && !lower.includes('stevia') &&
               !lower.includes('extra') && !lower.includes('shot') && !lower.includes('cream') &&
               !lower.includes('syrup') && !lower.includes('size') && !lower.includes('sweet')
      })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        targetCategories: categories,
        totalProducts: products?.length || 0,
        totalUniqueAddons: uniqueAddons.length,
        uniqueAddons: uniqueAddons,
        addonCategories: addonCategories,
        productVariations: productVariations,
        summary: {
          sizes: addonCategories.sizes.length,
          milkOptions: addonCategories.milkOptions.length,
          sweeteners: addonCategories.sweeteners.length,
          extras: addonCategories.extras.length,
          other: addonCategories.other.length
        }
      }
    })
    
  } catch (error) {
    console.error('Error extracting addons:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { unifiedAddons, applyToCategories } = body
    
    if (!unifiedAddons || !Array.isArray(unifiedAddons)) {
      return NextResponse.json({
        success: false,
        error: 'unifiedAddons array is required'
      }, { status: 400 })
    }
    
    const supabase = getSupabaseAdminClient()
    
    // Default to target categories if not specified
    const targetCategories = applyToCategories || [
      'Tea',
      'Beauty Drinks', 
      'Specialty Drinks',
      'Meal Replacement Shakes',
      'Kid Drinks'
    ]
    
    console.log('🔄 Applying unified addons to categories:', targetCategories)
    console.log('📦 Unified addons:', unifiedAddons)
    
    // Get categories by name
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('id, name')
      .in('name', targetCategories)
    
    if (categoriesError) {
      throw categoriesError
    }
    
    if (!categories || categories.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No matching categories found',
        searchedFor: targetCategories
      })
    }
    
    const categoryIds = categories.map(c => c.id)
    
    // Get products from these categories
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('id, name, category_id')
      .in('category_id', categoryIds)
    
    if (productsError) {
      throw productsError
    }
    
    console.log(`Found ${products?.length || 0} products to update`)
    
    // Create standardized variations structure
    const standardizedVariations = [
      {
        id: 'size-variation',
        title: 'Size',
        type: 'radio' as const,
        required: true,
        options: unifiedAddons
          .filter((addon: string) => 
            addon.toLowerCase().includes('small') || 
            addon.toLowerCase().includes('medium') || 
            addon.toLowerCase().includes('large') ||
            addon.toLowerCase().includes('size')
          )
          .map((addon: string, index: number) => ({
            id: `size-opt-${index}`,
            label: addon,
            priceModifier: addon.toLowerCase().includes('large') ? 2.0 : 
                          addon.toLowerCase().includes('medium') ? 1.0 : 0
          }))
      },
      {
        id: 'milk-variation',
        title: 'Milk Options',
        type: 'radio' as const,
        required: false,
        options: unifiedAddons
          .filter((addon: string) => 
            addon.toLowerCase().includes('milk') ||
            addon.toLowerCase().includes('almond') ||
            addon.toLowerCase().includes('oat') ||
            addon.toLowerCase().includes('soy')
          )
          .map((addon: string, index: number) => ({
            id: `milk-opt-${index}`,
            label: addon,
            priceModifier: addon.toLowerCase().includes('regular') ? 0 : 0.5
          }))
      },
      {
        id: 'sweetener-variation',
        title: 'Sweeteners',
        type: 'checkbox' as const,
        required: false,
        options: unifiedAddons
          .filter((addon: string) => 
            addon.toLowerCase().includes('sugar') ||
            addon.toLowerCase().includes('honey') ||
            addon.toLowerCase().includes('stevia') ||
            addon.toLowerCase().includes('sweet')
          )
          .map((addon: string, index: number) => ({
            id: `sweet-opt-${index}`,
            label: addon,
            priceModifier: 0.25
          }))
      },
      {
        id: 'extras-variation',
        title: 'Extras',
        type: 'checkbox' as const,
        required: false,
        options: unifiedAddons
          .filter((addon: string) => 
            addon.toLowerCase().includes('extra') ||
            addon.toLowerCase().includes('shot') ||
            addon.toLowerCase().includes('cream') ||
            addon.toLowerCase().includes('syrup')
          )
          .map((addon: string, index: number) => ({
            id: `extra-opt-${index}`,
            label: addon,
            priceModifier: addon.toLowerCase().includes('shot') ? 1.5 : 1.0
          }))
      },
      {
        id: 'other-variation',
        title: 'Other Options',
        type: 'checkbox' as const,
        required: false,
        options: unifiedAddons
          .filter((addon: string) => {
            const lower = addon.toLowerCase()
            return !lower.includes('small') && !lower.includes('medium') && !lower.includes('large') &&
                   !lower.includes('milk') && !lower.includes('almond') && !lower.includes('oat') &&
                   !lower.includes('sugar') && !lower.includes('honey') && !lower.includes('stevia') &&
                   !lower.includes('extra') && !lower.includes('shot') && !lower.includes('cream') &&
                   !lower.includes('syrup') && !lower.includes('size') && !lower.includes('sweet')
          })
          .map((addon: string, index: number) => ({
            id: `other-opt-${index}`,
            label: addon,
            priceModifier: 0.5
          }))
      }
    ].filter(variation => variation.options.length > 0) // Only include variations that have options
    
    // Update all products with standardized variations
    const updatePromises = products?.map(async (product) => {
      try {
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            variations: standardizedVariations,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
        
        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
          return { productId: product.id, success: false, error: updateError.message }
        }
        
        return { productId: product.id, success: true }
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error)
        return { 
          productId: product.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }) || []
    
    const results = await Promise.all(updatePromises)
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    console.log(`✅ Updated ${successful} products successfully`)
    if (failed > 0) {
      console.warn(`⚠️ Failed to update ${failed} products`)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        targetCategories: categories,
        totalProducts: products?.length || 0,
        standardizedVariations: standardizedVariations,
        updateResults: {
          successful,
          failed,
          details: results
        },
        summary: {
          variationsCreated: standardizedVariations.length,
          totalOptions: standardizedVariations.reduce((sum, v) => sum + v.options.length, 0)
        }
      }
    })
    
  } catch (error) {
    console.error('Error applying unified addons:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}