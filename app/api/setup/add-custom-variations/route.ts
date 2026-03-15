import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, variations } = body

    if (!productId || !variations) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID and variations are required' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    
    console.log(`🚀 Adding custom variations to product ${productId}...`)

    // Get the existing product
    const { data: product, error: productError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 })
    }

    // Calculate price range based on variations
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

    // Get current description and remove existing variations/prices
    let currentDescription = product.description || ""
    currentDescription = currentDescription
      .replace(/\n\n\[VARIATIONS:.*?\]/, '')
      .replace(/\[VARIATIONS:.*?\]/, '')
      .replace(/\[PRICES:.*?\]/, '')

    // Update description with new variations and prices
    const newDescription = currentDescription + 
      (currentDescription ? "\n\n" : "") + 
      `[VARIATIONS:${variationsJson}]` +
      `[PRICES:${priceDataJson}]`

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('menu_items')
      .update({
        description: newDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error(`Error updating product:`, updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update product',
        details: updateError 
      }, { status: 500 })
    }

    console.log(`✅ Updated ${product.name} with custom variations`)

    return NextResponse.json({
      success: true,
      message: `Successfully added variations to ${product.name}`,
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        variations: variations,
        priceRange: priceRange
      }
    })

  } catch (error) {
    console.error('Error adding custom variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}