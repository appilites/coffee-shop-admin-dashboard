/**
 * Variations API Routes — uses menu_items.variations JSONB column
 * No longer embeds variations in description field
 */

import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-server"
import { computePriceData } from "@/lib/compute-variation-prices"

// GET - Fetch all products with their variations (from JSONB column)
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
        variations,
        category:menu_categories(id, name)
      `)
      .order('name')

    if (error) throw error

    const productsWithVariations = products?.map(product => {
      const variations = Array.isArray(product.variations) ? product.variations : []
      const { calculatedTotalPrice, priceRange } = computePriceData(
        product.base_price,
        variations
      )

      return {
        id: product.id,
        name: product.name,
        basePrice: product.base_price,
        imageUrl: product.image_url,
        category: product.category,
        hasVariations: variations.length > 0,
        variationsCount: variations.length,
        variations: variations,
        calculatedPrices: { calculatedTotalPrice, priceRange },
        priceRange
      }
    }) || []

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

// PUT - Update variations for a specific product (saves to JSONB column)
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

    // Update the product's variations JSONB column directly
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        variations: Array.isArray(variations) ? variations : [],
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

// DELETE - Remove all variations from a product (clears JSONB column)
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

    // Clear the variations JSONB column
    const { error: updateError } = await supabase
      .from('menu_items')
      .update({
        variations: [],
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
