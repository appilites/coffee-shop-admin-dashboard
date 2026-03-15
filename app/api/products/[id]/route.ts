/**
 * Single Product API Routes — connected to Supabase
 * Reads  → anon/publishable key
 * Writes → service_role key (bypasses RLS)
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient, createServerSupabaseClient } from "@/lib/supabase-server"

// GET — Get product by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    const { data: product, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(id, name)
        )
      `)
      .eq('id', id)
      .single()

    if (error?.code === 'PGRST116' || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (error) throw error

    // Parse variations and prices from description
    let variations = []
    let calculatedPrices = null
    let cleanDescription = product.description

    if (product.description) {
      console.log('Raw description:', product.description)
      
      // More flexible regex to handle newlines and spaces
      const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\](?:\[PRICES:|$)/s)
      if (variationsMatch) {
        try {
          const variationsJson = variationsMatch[1].trim()
          console.log('Extracted variations JSON:', variationsJson)
          variations = JSON.parse(variationsJson)
          console.log('Parsed variations:', variations)
        } catch (e) {
          console.warn('Could not parse variations from description:', e)
          console.warn('Variations JSON that failed to parse:', variationsMatch[1])
        }
      } else {
        console.log('No variations match found in description')
      }
      
      const pricesMatch = product.description.match(/\[PRICES:(.*?)\](?:\s|$)/s)
      if (pricesMatch) {
        try {
          const pricesJson = pricesMatch[1].trim()
          calculatedPrices = JSON.parse(pricesJson)
        } catch (e) {
          console.warn('Could not parse prices from description:', e)
        }
      }
      
      // Clean the description for display
      cleanDescription = product.description
        .replace(/\n\n\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '')
        .replace(/\[VARIATIONS:.*?\](\[PRICES:.*?\])?/s, '') || null
    }

    const transformedProduct = {
      ...product,
      description: cleanDescription,
      variations: variations,
      calculatedTotalPrice: calculatedPrices?.calculatedTotalPrice || product.base_price,
      priceRange: calculatedPrices?.priceRange || { minPrice: product.base_price, maxPrice: product.base_price }
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to fetch product", details: msg }, { status: 500 })
  }
}

// PUT — Update product (admin client bypasses RLS)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('Updating product with data:', body)
    const supabase = getSupabaseAdminClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined)        updateData.name          = String(body.name).trim()
    if (body.description !== undefined) updateData.description   = body.description?.trim() || null
    if (body.price !== undefined) {
      const price = parseFloat(body.price)
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: "Invalid price value" }, { status: 400 })
      }
      updateData.base_price = price
    }
    if (body.categoryId !== undefined)  updateData.category_id   = body.categoryId
    if (body.imageUrl !== undefined)    updateData.image_url     = body.imageUrl?.trim() || null
    if (body.isAvailable !== undefined) updateData.is_available  = Boolean(body.isAvailable)
    if (body.isFeatured !== undefined)  updateData.is_featured   = Boolean(body.isFeatured)
    
    // Handle variations update - store in description field
    if (body.variations !== undefined) {
      // Get current product to preserve existing description
      const { data: currentProduct } = await supabase
        .from('menu_items')
        .select('description')
        .eq('id', id)
        .single()

      let currentDescription = currentProduct?.description || ""
      
      // Remove existing variations and prices from description
      currentDescription = currentDescription
        .replace(/\n\n\[VARIATIONS:.*?\]/, '')
        .replace(/\[VARIATIONS:.*?\]/, '')
        .replace(/\[PRICES:.*?\]/, '')
      
      // Add new variations and prices if any
      if (body.variations && body.variations.length > 0) {
        const variationsJson = JSON.stringify(body.variations)
        const priceData = {
          calculatedTotalPrice: body.calculatedTotalPrice || updateData.base_price || 0,
          priceRange: body.priceRange || { minPrice: updateData.base_price || 0, maxPrice: updateData.base_price || 0 }
        }
        const priceDataJson = JSON.stringify(priceData)
        
        updateData.description = currentDescription + 
          (currentDescription ? "\n\n" : "") + 
          `[VARIATIONS:${variationsJson}]` +
          `[PRICES:${priceDataJson}]`
      } else {
        updateData.description = currentDescription || null
      }
    }

    const { data: product, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:menu_categories(
          id,
          name,
          parent_id,
          parent:menu_categories!parent_id(id, name)
        )
      `)
      .single()

    if (error?.code === 'PGRST116') {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    if (error) {
      console.error('Error updating product:', error)
      if (error.code === '23503') return NextResponse.json({ error: "Invalid category selected" }, { status: 400 })
      if (error.code === '23505') return NextResponse.json({ error: "A product with this name already exists" }, { status: 400 })
      throw error
    }

    console.log('✅ Product updated successfully:', product)

    // Parse variations and prices back from description for response
    let variations = []
    let calculatedPrices = null
    let cleanDescription = product.description

    if (product.description) {
      const variationsMatch = product.description.match(/\[VARIATIONS:(.*?)\]/)
      if (variationsMatch) {
        try {
          variations = JSON.parse(variationsMatch[1])
        } catch (e) {
          console.warn('Could not parse variations from description:', e)
        }
      }
      
      const pricesMatch = product.description.match(/\[PRICES:(.*?)\]/)
      if (pricesMatch) {
        try {
          calculatedPrices = JSON.parse(pricesMatch[1])
        } catch (e) {
          console.warn('Could not parse prices from description:', e)
        }
      }
      
      // Clean the description for display
      cleanDescription = product.description
        .replace(/\n\n\[VARIATIONS:.*?\]/, '')
        .replace(/\[VARIATIONS:.*?\]/, '')
        .replace(/\[PRICES:.*?\]/, '') || null
    }

    // Parse variations back to object format for response
    const responseProduct = {
      ...product,
      description: cleanDescription,
      variations: variations,
      calculatedTotalPrice: calculatedPrices?.calculatedTotalPrice || product.base_price,
      priceRange: calculatedPrices?.priceRange || { minPrice: product.base_price, maxPrice: product.base_price }
    }

    return NextResponse.json(responseProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to update product", details: msg }, { status: 500 })
  }
}

// DELETE — Delete product (admin client bypasses RLS)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = getSupabaseAdminClient()

    // Delete customization options first (FK constraint)
    await supabase.from('customization_options').delete().eq('menu_item_id', id)

    const { error } = await supabase.from('menu_items').delete().eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: "Failed to delete product", details: msg }, { status: 500 })
  }
}
