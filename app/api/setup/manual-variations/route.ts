import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { variationsData } = body

    if (!variationsData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Variations data is required' 
      }, { status: 400 })
    }

    // Parse variations data (could be JSON string or object)
    let variations
    try {
      variations = typeof variationsData === 'string' 
        ? JSON.parse(variationsData) 
        : variationsData
    } catch (e) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid JSON format in variations data' 
      }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    
    // Get all products without variations
    const { data: products, error: productsError } = await supabase
      .from('menu_items')
      .select('*')

    if (productsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch products',
        details: productsError 
      }, { status: 500 })
    }

    const productsToUpdate = products?.filter(p => 
      !p.description || !p.description.includes('[VARIATIONS:')
    ) || []

    let updateCount = 0
    const updatedProducts = []

    for (const product of productsToUpdate) {
      try {
        const basePrice = product.base_price || 0
        
        // Calculate price range
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

        const priceRange = { minPrice, maxPrice }
        const calculatedTotalPrice = maxPrice

        // Update product
        const variationsJson = JSON.stringify(variations)
        const priceDataJson = JSON.stringify({ calculatedTotalPrice, priceRange })
        
        const originalDescription = product.description || ""
        const newDescription = originalDescription + 
          (originalDescription ? "\n\n" : "") + 
          `[VARIATIONS:${variationsJson}][PRICES:${priceDataJson}]`

        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            description: newDescription,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)

        if (!updateError) {
          updateCount++
          updatedProducts.push({ id: product.id, name: product.name })
        }
      } catch (error) {
        console.error(`Error updating product ${product.name}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Applied variations to ${updateCount} products`,
      updatedCount: updateCount,
      updatedProducts
    })

  } catch (error) {
    console.error('Error applying manual variations:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}