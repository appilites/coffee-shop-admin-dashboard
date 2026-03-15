import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

// GET - Fetch all products with their variations
export async function GET() {
  try {
    const supabase = getSupabaseAdminClient()
    
    const { data: products, error } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        base_price,
        image_url,
        category:menu_categories(id, name)
      `)
      .order('name')

    if (error) throw error

    // Parse variations from all products
    const productsWithVariations = products?.map(product => {
      let variations = []
      let calculatedPrices = null
      let hasVariations = false

      if (product.description) {
        hasVariations = product.description.includes('[VARIATIONS:')
        
        if (hasVariations) {
          // Use same regex as other APIs for consistency
          const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\](?:\[PRICES:|$)/s)
          if (variationsMatch) {
            try {
              const variationsJson = variationsMatch[1].trim()
              variations = JSON.parse(variationsJson)
            } catch (e) {
              console.warn(`Could not parse variations for ${product.name}:`, e)
            }
          }
          
          const pricesMatch = product.description.match(/\[PRICES:(.*?)\](?:\s|$)/s)
          if (pricesMatch) {
            try {
              const pricesJson = pricesMatch[1].trim()
              calculatedPrices = JSON.parse(pricesJson)
            } catch (e) {
              console.warn(`Could not parse prices for ${product.name}:`, e)
            }
          }
        }
      }

      return {
        id: product.id,
        name: product.name,
        basePrice: product.base_price,
        imageUrl: product.image_url,
        category: product.category,
        hasVariations,
        variationsCount: variations.length,
        variations: variations,
        calculatedPrices: calculatedPrices,
        priceRange: calculatedPrices?.priceRange || { 
          minPrice: product.base_price, 
          maxPrice: product.base_price 
        }
      }
    }) || []

    // Separate products with and without variations
    const withVariations = productsWithVariations.filter(p => p.hasVariations)
    const withoutVariations = productsWithVariations.filter(p => !p.hasVariations)

    return NextResponse.json({
      success: true,
      summary: {
        totalProducts: productsWithVariations.length,
        productsWithVariations: withVariations.length,
        productsWithoutVariations: withoutVariations.length,
        totalVariations: withVariations.reduce((sum, p) => sum + p.variationsCount, 0)
      },
      productsWithVariations: withVariations,
      productsWithoutVariations: withoutVariations
    })

  } catch (error) {
    console.error('Error fetching variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT - Update variations for a specific product
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { productId, variations } = body

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID is required' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Get current product
    const { data: currentProduct, error: fetchError } = await supabase
      .from('menu_items')
      .select('description, base_price')
      .eq('id', productId)
      .single()

    if (fetchError || !currentProduct) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 })
    }

    let currentDescription = currentProduct.description || ""
    
    // Remove existing variations and prices from description
    currentDescription = currentDescription
      .replace(/\n\n\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '')
      .replace(/\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '')

    // Add new variations if provided
    let newDescription = currentDescription
    if (variations && variations.length > 0) {
      // Calculate price data
      const basePrice = currentProduct.base_price || 0
      let minPrice = basePrice
      let maxPrice = basePrice
      
      variations.forEach((variation: any) => {
        if (variation.type === 'radio') {
          const prices = variation.options.map((opt: any) => opt.priceModifier || 0)
          minPrice += Math.min(...prices)
          maxPrice += Math.max(...prices)
        } else {
          const totalPrice = variation.options.reduce((sum: number, opt: any) => 
            sum + (opt.priceModifier || 0), 0)
          maxPrice += totalPrice
        }
      })

      const priceData = {
        calculatedTotalPrice: maxPrice,
        priceRange: { minPrice, maxPrice }
      }

      const variationsJson = JSON.stringify(variations)
      const priceDataJson = JSON.stringify(priceData)
      
      newDescription = currentDescription + 
        (currentDescription ? "\n\n" : "") + 
        `[VARIATIONS:${variationsJson}]` +
        `[PRICES:${priceDataJson}]`
    }

    // Update the product
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        description: newDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: variations && variations.length > 0 
        ? `Updated ${variations.length} variations for product`
        : 'Removed all variations from product'
    })

  } catch (error) {
    console.error('Error updating variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove all variations from a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product ID is required' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Get current product
    const { data: currentProduct, error: fetchError } = await supabase
      .from('menu_items')
      .select('description')
      .eq('id', productId)
      .single()

    if (fetchError || !currentProduct) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 })
    }

    let currentDescription = currentProduct.description || ""
    
    // Remove variations and prices from description
    const cleanDescription = currentDescription
      .replace(/\n\n\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '')
      .replace(/\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '') || null

    // Update the product
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        description: cleanDescription,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'All variations removed from product'
    })

  } catch (error) {
    console.error('Error removing variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}