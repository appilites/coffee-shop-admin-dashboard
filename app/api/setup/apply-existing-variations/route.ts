import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { variations, productIds, applyToAll = false } = body

    if (!variations || !Array.isArray(variations)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Variations array is required' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    
    console.log('🚀 Applying existing variations to products...')

    // Get products to update
    let productsQuery = supabase.from('menu_items').select('*')
    
    if (!applyToAll && productIds && productIds.length > 0) {
      productsQuery = productsQuery.in('id', productIds)
    }

    const { data: products, error: productsError } = await productsQuery

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch products',
        details: productsError 
      }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No products found to update' 
      }, { status: 400 })
    }

    // Calculate price range for the variations
    const calculatePriceRange = (basePrice: number, variations: any[]) => {
      let minPrice = basePrice
      let maxPrice = basePrice
      
      variations.forEach(variation => {
        if (variation.type === 'radio') {
          // For radio buttons, customer picks one option
          const prices = variation.options.map((opt: any) => opt.priceModifier || 0)
          const minVariationPrice = Math.min(...prices)
          const maxVariationPrice = Math.max(...prices)
          minPrice += minVariationPrice
          maxPrice += maxVariationPrice
        } else {
          // For checkboxes, customer can pick multiple options
          const totalVariationPrice = variation.options.reduce((sum: number, opt: any) => sum + (opt.priceModifier || 0), 0)
          maxPrice += totalVariationPrice
          // minPrice stays the same (customer can choose none)
        }
      })
      
      return { minPrice, maxPrice }
    }

    const updatedProducts = []
    let updateCount = 0

    for (const product of products) {
      try {
        // Skip if product already has variations (unless forced)
        if (product.description && product.description.includes('[VARIATIONS:')) {
          console.log(`Skipping ${product.name} - already has variations`)
          continue
        }

        // Calculate prices
        const basePrice = product.base_price || 0
        const priceRange = calculatePriceRange(basePrice, variations)
        const calculatedTotalPrice = basePrice + variations.reduce((sum: number, v: any) => 
          sum + v.options.reduce((optSum: number, opt: any) => optSum + (opt.priceModifier || 0), 0), 0
        )

        // Prepare variations and price data
        const variationsJson = JSON.stringify(variations)
        const priceData = {
          calculatedTotalPrice,
          priceRange
        }
        const priceDataJson = JSON.stringify(priceData)

        // Update description with variations and prices
        const originalDescription = product.description || ""
        const newDescription = originalDescription + 
          (originalDescription ? "\n\n" : "") + 
          `[VARIATIONS:${variationsJson}]` +
          `[PRICES:${priceDataJson}]`

        // Update the product
        const { data: updatedProduct, error: updateError } = await supabase
          .from('menu_items')
          .update({
            description: newDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .select()
          .single()

        if (updateError) {
          console.error(`Error updating product ${product.name}:`, updateError)
          continue
        }

        console.log(`✅ Updated ${product.name} with existing variations`)
        updatedProducts.push({
          id: updatedProduct.id,
          name: updatedProduct.name,
          priceRange: priceRange
        })
        updateCount++

      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully applied variations to ${updateCount} products`,
      data: {
        updatedCount: updateCount,
        totalProducts: products.length,
        updatedProducts: updatedProducts,
        appliedVariations: variations.map(v => ({
          title: v.title,
          type: v.type,
          optionsCount: v.options?.length || 0
        }))
      }
    })

  } catch (error) {
    console.error('Error applying existing variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}